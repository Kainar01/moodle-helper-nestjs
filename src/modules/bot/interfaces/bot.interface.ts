import type { Context, Scenes } from 'telegraf';

import type { User } from '@/modules/user';

export enum BotCommand {
  START = 'start',
  QUIT = 'quit',
  INIT = 'init',
  SCHEDULE = 'schedule',
  ASSIGNMENTS = 'assignments',
  NOTIFY_ASSIGNMENT = 'notifyassignment',
  REQUEST_VERIFY = 'requestverify',
  REQUEST_SUPERADMIN = 'requestsuperadmin',
}

export enum BotAction {
  REGISTER = 'register',
}

export interface BotContext extends Context, Scenes.SceneContext {
  user: User;
}
