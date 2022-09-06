import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { TelegrafExecutionContext, TelegrafException } from 'nestjs-telegraf';

import { UserRole } from '@/modules/user';

import type { BotContext } from '../interfaces';

@Injectable()
export class BotSuperAdminGuard implements CanActivate {
  public canActivate(context: ExecutionContext): boolean {
    const ctx = TelegrafExecutionContext.create(context);
    const botContext = ctx.getContext<BotContext>();

    if (!botContext.user.role || ![UserRole.SUPERADMIN].includes(botContext.user.role)) {
      throw new TelegrafException('You are not allowed 😡');
    }

    return true;
  }
}
