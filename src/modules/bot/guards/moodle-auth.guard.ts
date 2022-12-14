import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { TelegrafExecutionContext } from 'nestjs-telegraf';

import { ValidationException } from '../exceptions/validation.exception';
import type { BotContext } from '../interfaces/bot.interface';

@Injectable()
export class BotMoodleAuthGuard implements CanActivate {
  public canActivate(context: ExecutionContext): boolean {
    const ctx = TelegrafExecutionContext.create(context);
    const botContext = ctx.getContext<BotContext>();

    const { moodlePassword, moodleUsername } = botContext.botChat;
    if (!moodleUsername || !moodlePassword) {
      throw new ValidationException(
        'Прежде чем пользоваться командой, мне нужны данные от твоей мудл системы\n\n/init - Ввести данные от мудл системы',
      );
    }

    return true;
  }
}
