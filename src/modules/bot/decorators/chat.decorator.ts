import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TelegrafExecutionContext } from 'nestjs-telegraf';

import type { BotContext } from '../interfaces/bot.interface';

export const CtxChat = createParamDecorator(
  (_: any, ctx: ExecutionContext) => TelegrafExecutionContext.create(ctx).getContext<BotContext>().botChat,
);
