// export * from './development';
export const config = {
  db: {
    type: 'mysql',
    synchronize: false,
    logging: false,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    extra: {
      connectionLimit: 5,
    },
    autoLoadEntities: true,
  },
};
