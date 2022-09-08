import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { TelegrafArgumentsHost } from 'nestjs-telegraf';

import type { BotContext } from '@/modules/bot';
import { ValidationException } from '@/modules/bot/exceptions';

import { Logger } from '../logger';

@Catch()
export class TelegrafExceptionFilter implements ExceptionFilter {
  constructor(private logger: Logger) {}
  public async catch(exception: Error, host: ArgumentsHost): Promise<void> {
    const telegrafHost = TelegrafArgumentsHost.create(host);
    const ctx = telegrafHost.getContext<BotContext>();
    if (exception instanceof ValidationException) {
      await ctx.reply(`${exception.message}`, { parse_mode: 'Markdown' });
    } else {
      await ctx.reply(`*Error*: ${exception.message}`, { parse_mode: 'Markdown' });
      this.logger.error(exception);
    }
    await ctx.scene.leave();
  }
}
