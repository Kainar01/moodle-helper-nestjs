import path from 'path';

import { BullModule } from '@nestjs/bull';
import { BadRequestException, MiddlewareConsumer, Module, NestModule, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_PIPE, RouterModule } from '@nestjs/core';
import { ScheduleModule as NestScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { ValidationError } from 'class-validator';
import { I18nModule } from 'nestjs-i18n';
import { TelegrafModule } from 'nestjs-telegraf';

import { CommonModule } from './common/common.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { configuration } from './config/configuration';
import { validateEnv } from './config/env.validation';
import { AssignmentModule } from './modules/assignment/assignment.module';
import { MOODLE_BOT_NAME } from './modules/bot/bot.constants';
import { BotModule } from './modules/bot/bot.module';
import { sessionMiddleware } from './modules/bot/middlewares/session.middleware';
import { BullBoardModule } from './modules/bull-board/bull-board.module';
import { ChatModule } from './modules/chat/chat.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { NotificationModule } from './modules/notification/notification.module';
import { ScheduleModule } from './modules/schedule/schedule.module';
import { WebScraperModule } from './modules/webscraper/webscraper.module';

@Module({
  imports: [
    // Configuration
    // https://docs.nestjs.com/techniques/configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
    }),
    // I18n
    I18nModule.forRoot({
      fallbackLanguage: 'ru',
      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: true,
      },
      resolvers: [],
    }),
    NestScheduleModule.forRoot(),
    TelegrafModule.forRootAsync({
      botName: MOODLE_BOT_NAME,
      useFactory: async (config: ConfigService) => ({
        token: <string> await config.get('bot.moodle.token'),
        middlewares: [sessionMiddleware],
        include: [BotModule],
      }),
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      useFactory: async (config: ConfigService) => ({
        ...(await config.get('redis')),
      }),
      inject: [ConfigService],
    }),
    // Database
    // https://docs.nestjs.com/techniques/database
    TypeOrmModule.forRootAsync({
      useFactory: async (config: ConfigService) => ({
        ...(await config.get('db')),
      }),
      inject: [ConfigService],
    }),
    // Service Modules
    CommonModule, // Global
    WebScraperModule,
    AssignmentModule,
    ChatModule,
    ScheduleModule,
    BotModule,
    NotificationModule,
    FeedbackModule,
    BullBoardModule,
    // Module Router
    // https://docs.nestjs.com/recipes/router-module
    RouterModule.register([]),
  ],
  providers: [
    // Global Guard, Authentication check on all routers
    // { provide: APP_GUARD, useClass: AuthenticatedGuard },
    // Global Filter, Exception check
    // { provide: APP_FILTER, useClass: ExceptionsFilter },
    // Global Pipe, Validation check
    // https://docs.nestjs.com/pipes#global-scoped-pipes
    // https://docs.nestjs.com/techniques/validation
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        // disableErrorMessages: true,
        transform: true, // transform object to DTO class
        whitelist: true,
        exceptionFactory: (errors: ValidationError[]): BadRequestException => new BadRequestException(errors),
      }),
    },
  ],
})
export class AppModule implements NestModule {
  // Global Middleware, Inbound logging
  public configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
