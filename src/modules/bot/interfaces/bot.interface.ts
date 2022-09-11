import type { Context, Scenes } from 'telegraf';

import type { Chat } from '@/modules/chat/chat.interface';

export enum BotCommand {
  START = 'start',
  QUIT = 'quit',
  INIT = 'init',
  SCHEDULE = 'schedule',
  ASSIGNMENTS = 'assignments',
  NOTIFY_ASSIGNMENT = 'notifyassignment',
  REQUEST_VERIFY = 'requestverify',
  LEAVE_FEEDBACK = 'feedback',
  REQUEST_ADMIN = 'requestadmin',
  MAKE_ERROR_CHAT = 'makeerrorchat',
}

export enum BotAction {
  REGISTER = 'register',
}

export interface BotContext extends Context, Scenes.SceneContext {
  botChat: Chat;
}
