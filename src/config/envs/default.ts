import type { AppConfig } from '../config.interface';

export const config: AppConfig = {
  db: {
    type: 'postgres',
    entities: [`${__dirname}/../../modules/**/*.entity.{js,ts}`],
    synchronize: false,
    subscribers: [`${__dirname}/../../db/subscriber/**/*.{js,ts}`],
    migrations: [`${__dirname}/../../db/migration/**/*.{js,ts}`],
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    jwtExpiration: '15m',
    jwtRefreshExpiration: '7 days',
    cookieSecure: false,
  },
  server: {
    port: 3000,
    cors: false,
  },
  bot: {
    moodle: {
      url: process.env.BOT_MOODLE_URL,
      token: process.env.MOODLE_BOT_TOKEN,
    },
    auth: {
      verificationDisabled: <boolean>JSON.parse(process.env.BOT_USER_VERIFICATION_DISABLE),
    },
  },
  redis: {
    url: process.env.REDIS_URL,
  },
  mongodb: {
    url: process.env.MONGO_DB_URL,
  },
};
