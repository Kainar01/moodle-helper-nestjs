import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { BullModule, getQueueToken } from '@nestjs/bull';
import { Inject, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import type { Queue } from 'bull';

import { ASSIGNMENT_QUEUES } from '@/modules/assignment';
import { NOTIFICATION_QUEUES } from '@/modules/notification';
// TODO: FIX BULL BOARD, NOT WORKING
@Module({
  imports: [
    BullModule.registerQueue({
      name: ASSIGNMENT_QUEUES.SHOW_ASSIGNMENTS,
    }),
    BullModule.registerQueue({
      name: NOTIFICATION_QUEUES.NOTIFY_ASSIGNMENT,
    }),
  ],
})
export class BullBoardModule implements NestModule {
  @Inject(getQueueToken(ASSIGNMENT_QUEUES.SHOW_ASSIGNMENTS))
  private readonly showAssignmentQueue!: Queue;

  @Inject(getQueueToken(NOTIFICATION_QUEUES.NOTIFY_ASSIGNMENT))
  private readonly notifyAssignmentQueue!: Queue;

  public configure(consumer: MiddlewareConsumer) {
    const serverAdapter = new ExpressAdapter();
    createBullBoard(
      { queues: this.getBullAdapters(), serverAdapter },
    );
    serverAdapter.setBasePath('/admin/queues');

    const router = serverAdapter.getRouter();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    consumer.apply(router).forRoutes('/admin/queues');
  }

  private getBullAdapters() {
    const queues = [this.showAssignmentQueue, this.notifyAssignmentQueue];
    return queues.map((queue: Queue) => new BullAdapter(queue));
  }
}
