import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { TelegrafArgumentsHost } from 'nestjs-telegraf';

import type { BotContext } from '@/modules/bot';

@Catch()
export class TelegrafExceptionFilter implements ExceptionFilter {
  public async catch(exception: Error, host: ArgumentsHost): Promise<void> {
    const telegrafHost = TelegrafArgumentsHost.create(host);
    const ctx = telegrafHost.getContext<BotContext>();
    console.error(exception);
    await ctx.replyWithHTML(`<b>Error</b>: ${exception.message}`);
    await ctx.scene.leave();
  }
}
