import type { AppEnvConfig } from '../config.interface';

export const config : AppEnvConfig = {
  db: {
    type: 'postgres',
    synchronize: false,
    logging: true,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    extra: {
      connectionLimit: 10,
    },
    autoLoadEntities: true,
  },
};
