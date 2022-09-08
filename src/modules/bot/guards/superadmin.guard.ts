import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { TelegrafExecutionContext } from 'nestjs-telegraf';

import { ChatGroupType } from '@/modules/chat/chat.interface';

import { ValidationException } from '../exceptions/validation.exception';
import type { BotContext } from '../interfaces/bot.interface';

@Injectable()
export class BotSuperAdminGuard implements CanActivate {
  public canActivate(context: ExecutionContext): boolean {
    const ctx = TelegrafExecutionContext.create(context);
    const botContext = ctx.getContext<BotContext>();

    if (!botContext.botChat.chatGroupType || ![ChatGroupType.SUPERADMIN].includes(botContext.botChat.chatGroupType)) {
      throw new ValidationException('You are not allowed 😡');
    }

    return true;
  }
}
