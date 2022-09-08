import { ConsoleLogger as NestConsoleLogger, ConsoleLoggerOptions, Injectable, Scope } from '@nestjs/common';

/**
 * https://docs.nestjs.com/techniques/logger
 * To disable color in the default logger's messages, set the `NO_COLOR` environment variable to some non-empty string.
 */
@Injectable({ scope: Scope.TRANSIENT })
export class ConsoleLogger extends NestConsoleLogger {
  protected isProduction: boolean = process.env.NODE_ENV === 'production';
  protected override options: ConsoleLoggerOptions = {
    logLevels: ['log', 'error', 'warn', 'debug', 'verbose'],
    timestamp: !this.isProduction,
  };

  public override log(message: unknown, ...optionalParams: unknown[]): void {
    super.log(message, optionalParams);
  }

  public override warn(message: unknown, ...optionalParams: unknown[]): void {
    super.warn(message, optionalParams);
  }

  public override error(message: unknown, ...optionalParams: unknown[]): void {
    super.error(message, optionalParams);
  }

  protected override getTimestamp(): string {
    // When you want to change or remove the date format
    // return this.isProduction ? '' : super.getTimestamp();
    return super.getTimestamp();
  }
}
