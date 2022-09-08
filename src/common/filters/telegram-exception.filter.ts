import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { TelegrafArgumentsHost } from 'nestjs-telegraf';

import { ValidationException } from '@/modules/bot/exceptions/validation.exception';
import type { BotContext } from '@/modules/bot/interfaces/bot.interface';
import { ChatService } from '@/modules/chat/chat.service';

import { Logger } from '../logger/logger';

@Catch()
export class TelegrafExceptionFilter implements ExceptionFilter {
  constructor(private logger: Logger, private chatService: ChatService) {}
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
    const errorChat = await this.chatService.findErrorChat();
    if (errorChat) {
      await ctx.telegram
        .sendMessage(errorChat.telegramChatId, `Chat: ${ctx.botChat.id}\n~${exception.stack}~`, { parse_mode: 'Markdown' })
        .catch(this.logger.error.bind(this));
    }
  }
}
