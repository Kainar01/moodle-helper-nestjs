import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegrafExecutionContext } from 'nestjs-telegraf';

import { ChatGroupType } from '@/modules/chat/chat.interface';

import { ValidationException } from '../exceptions/validation.exception';
import { type BotContext, BotCommand } from '../interfaces/bot.interface';

@Injectable()
export class BotVerifiedGuard implements CanActivate {
  constructor(@Inject(ConfigService) private config: ConfigService) {}

  public canActivate(context: ExecutionContext): boolean {
    const ctx = TelegrafExecutionContext.create(context);
    const botContext = ctx.getContext<BotContext>();

    if (this.config.get('bot.auth.verificationDisabled')) return true;

    const adminGroupChats = [ChatGroupType.ADMIN, ChatGroupType.SUPERADMIN];
    const isAdmin = botContext.botChat.chatGroupType && adminGroupChats.includes(botContext.botChat.chatGroupType);
    if (!botContext.botChat.verified && !isAdmin) {
      throw new ValidationException(
        `Вы не верифицированы для этого действия. Вам нужно будет сделать запрос на админа\n\n/${BotCommand.REQUEST_VERIFY} - Запросить доступ`,
      );
    }

    return true;
  }
}
