import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response } from 'express';
import { nanoid } from 'nanoid';

import { Logger } from '../logger/logger';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: Logger) { }

  public use(req: Request, res: Response, next: () => void): void {
    req.id = req.header('X-Request-Id') || nanoid();
    res.setHeader('X-Request-Id', req.id);
    // Uncomment when using PinoLogger
    // Logger.setMetadata({ id: req.id });

    this.logger.log(`${req.method} ${req.originalUrl} - ${req.ip.replace('::ffff:', '')}`);

    return next();
  }
}
