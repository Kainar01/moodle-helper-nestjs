import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { TelegrafExecutionContext, TelegrafException } from 'nestjs-telegraf';

import { ConfigService } from '@/common';
import { UserRole } from '@/modules/user';

import { BotCommand, BotContext } from '../interfaces';

@Injectable()
export class BotVerifiedGuard implements CanActivate {
  constructor(@Inject(ConfigService) private config: ConfigService) {}

  public canActivate(context: ExecutionContext): boolean {
    const ctx = TelegrafExecutionContext.create(context);
    const botContext = ctx.getContext<BotContext>();

    if (this.config.get('bot.auth.verificationDisabled')) return true;

    const isAdmin = botContext.user.role && [UserRole.ADMIN, UserRole.SUPERADMIN].includes(botContext.user.role);
    if (!botContext.user.verified && !isAdmin) {
      throw new TelegrafException(
        `Вы не верифицированы для этого действия. Вам нужно будет сделать запрос на админа\n\n/${BotCommand.REQUEST_VERIFY}`,
      );
    }

    return true;
  }
}
