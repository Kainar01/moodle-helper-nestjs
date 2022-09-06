import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TelegrafExecutionContext } from 'nestjs-telegraf';

import type { BotContext } from '../interfaces';

export const CtxUser = createParamDecorator(
  (_: any, ctx: ExecutionContext) => TelegrafExecutionContext.create(ctx).getContext<BotContext>().user,
);
