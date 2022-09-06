import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { TelegrafExecutionContext, TelegrafException } from 'nestjs-telegraf';

import type { BotContext } from '../interfaces';

@Injectable()
export class BotNotVerifiedGuard implements CanActivate {
  public canActivate(context: ExecutionContext): boolean {
    const ctx = TelegrafExecutionContext.create(context);
    const botContext = ctx.getContext<BotContext>();

    if (botContext.user.verified) {
      throw new TelegrafException('Вы уже верифицированы');
    }

    return true;
  }
}
