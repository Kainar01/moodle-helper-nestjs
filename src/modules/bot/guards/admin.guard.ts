import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { TelegrafExecutionContext } from 'nestjs-telegraf';

import { ChatGroupType } from '@/modules/chat/chat.interface';

import { ValidationException } from '../exceptions/validation.exception';
import type { BotContext } from '../interfaces/bot.interface';

@Injectable()
export class BotAdminGuard implements CanActivate {
  public canActivate(context: ExecutionContext): boolean {
    const ctx = TelegrafExecutionContext.create(context);
    const botContext = ctx.getContext<BotContext>();

    const adminGroupChats = [ChatGroupType.ADMIN, ChatGroupType.SUPERADMIN];
    const isAdmin = botContext.botChat.chatGroupType && adminGroupChats.includes(botContext.botChat.chatGroupType);

    if (!isAdmin) {
      throw new ValidationException('You are not allowed 😡');
    }

    return true;
  }
}
