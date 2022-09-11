import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { TelegrafExecutionContext } from 'nestjs-telegraf';

import { ValidationException } from '../exceptions/validation.exception';
import type { BotContext } from '../interfaces/bot.interface';

@Injectable()
export class BotNotVerifiedGuard implements CanActivate {
  public canActivate(context: ExecutionContext): boolean {
    const ctx = TelegrafExecutionContext.create(context);
    const botContext = ctx.getContext<BotContext>();

    if (botContext.botChat.verified) {
      throw new ValidationException('Вы уже верифицированы');
    }

    return true;
  }
}
