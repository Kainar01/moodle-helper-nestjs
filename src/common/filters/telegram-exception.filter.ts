import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { TelegrafArgumentsHost } from 'nestjs-telegraf';

import type { BotContext } from '@/modules/bot';
import { ValidationException } from '@/modules/bot/exceptions';
import { UserService } from '@/modules/user';

import { Logger } from '../logger';

@Catch()
export class TelegrafExceptionFilter implements ExceptionFilter {
  constructor(private logger: Logger, private userService: UserService) {}
  public async catch(exception: Error, host: ArgumentsHost): Promise<void> {
    const telegrafHost = TelegrafArgumentsHost.create(host);
    const ctx = telegrafHost.getContext<BotContext>();
    if (exception instanceof ValidationException) {
      await ctx.reply(`${exception.message}`, { parse_mode: 'Markdown' });
    } else {
      await ctx.reply(`*Error*: ${exception.message}`, { parse_mode: 'Markdown' });
      await this.sendExceptionToAdmin(ctx, exception);
      this.logger.error(exception);
    }
    await ctx.scene.leave();
  }

  private async sendExceptionToAdmin(ctx: BotContext, exception: Error) {
    const admin = await this.userService.findSuperAdmin();
    if (admin) {
      await ctx.telegram
        .sendMessage(admin.chatId, `User: ${ctx.user.id}\n~${exception.stack}~`, { parse_mode: 'Markdown' })
        .catch(this.logger.error.bind(this));
    }
  }
}
