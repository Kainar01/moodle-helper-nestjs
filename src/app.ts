import { Logger as NestLogger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import moment from 'moment-timezone';

import { middleware } from './app.middleware';
import { AppModule } from './app.module';
import { Logger } from './common/logger/logger';

/**
 * https://docs.nestjs.com
 * https://github.com/nestjs/nest/tree/master/sample
 * https://github.com/nestjs/nest/issues/2249#issuecomment-494734673
 */
async function bootstrap(): Promise<string> {
  const isProduction = (process.env.NODE_ENV === 'production');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  moment.tz.setDefault(process.env.TZ);

  app.useLogger(await app.resolve(Logger));

  if (isProduction) {
    app.enable('trust proxy');
  }

  // Express Middleware
  middleware(app);

  await app.listen(process.env.PORT);

  return app.getUrl();
}

(async (): Promise<void> => {
  try {
    const url = await bootstrap();
    NestLogger.log(url, 'Bootstrap');
  } catch (error) {
    NestLogger.error(error, 'Bootstrap');
  }
})();
