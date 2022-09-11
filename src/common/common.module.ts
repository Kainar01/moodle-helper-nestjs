import { Global, Module } from '@nestjs/common';

import { Logger } from './logger/logger';
import { RequestContext } from './logger/request-context';
import { ConfigService } from './providers/config.service';
import { UtilService } from './providers/util.service';

const services = [Logger, RequestContext, ConfigService, UtilService];

@Global()
@Module({
  providers: services,
  exports: services,
})
export class CommonModule {}
