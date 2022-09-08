import { Scenes } from 'telegraf';

import type { AppEnvVars } from '@/config/config.interface';

export declare global {
  type AnyObject = Record<string, unknown>;

  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface ProcessEnv extends AppEnvVars {}
  }

  namespace Express {
    interface Request {
      id: string;
    }
  }

  namespace Telegraf {

    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface Context extends Scenes.SceneContext {}
  }
}
