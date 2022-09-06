/* eslint-disable */
import { plainToInstance } from 'class-transformer';
import { IsBooleanString,IsEnum, IsNotEmpty, IsNumberString, IsString, IsUrl, validateSync } from 'class-validator';
import { AppEnv, AppEnvVars } from './config.interface';

class EnvironmentVariables implements AppEnvVars {
  @IsEnum(AppEnv)
  NODE_ENV!: AppEnv;

  @IsNumberString()
  PORT!: string;

  @IsString()
  @IsNotEmpty()
  DB_HOST!: string;

  @IsNumberString()
  DB_PORT!: string;

  @IsString()
  @IsNotEmpty()
  DB_USER!: string;

  @IsString()
  @IsNotEmpty()
  DB_PASSWORD!: string;

  @IsString()
  @IsNotEmpty()
  DB_NAME!: string;

  @IsString()
  @IsNotEmpty()
  MONGO_DB_URL!: string;

  @IsString()
  @IsNotEmpty()
  REDIS_URL!: string;

  @IsString()
  @IsNotEmpty()
  JWT_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  MOODLE_BOT_TOKEN!: string;

  @IsUrl()
  @IsNotEmpty()
  BOT_MOODLE_URL!: string;

  @IsBooleanString()
  @IsNotEmpty()
  BOT_USER_VERIFICATION_DISABLE!: string;

  @IsString()
  @IsNotEmpty()
  APP_TIMEZONE!: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, { enableImplicitConversion: true });
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    // red font color for error message 
    // https://stackoverflow.com/questions/9781218/how-to-change-node-jss-console-font-color
    console.error('\x1b[31m%s\x1b[0m', errors.toString())
    throw new Error('Env vars missing');
  }

  return validatedConfig;
}
