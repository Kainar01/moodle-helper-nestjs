import { Injectable } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import type { ExtraReplyMessage } from 'telegraf/typings/telegram-types';

import { MOODLE_BOT_NAME } from '../bot.constants';
import type { BotContext } from '../interfaces/bot.interface';

@Injectable()
export class MoodleBotService {
  constructor(
    @InjectBot(MOODLE_BOT_NAME)
    private readonly bot: Telegraf<BotContext>,
  ) {}

  public async sendMessage(chatId: string, message: string, extra?: ExtraReplyMessage) {
    return this.bot.telegram.sendMessage(chatId, message, extra);
  }
}
