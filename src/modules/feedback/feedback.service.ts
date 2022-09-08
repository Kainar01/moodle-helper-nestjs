import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import moment from 'moment-timezone';
import { I18n, I18nService } from 'nestjs-i18n';
import type { Repository } from 'typeorm';

import { FEEDBACK_COOLDOWN_IN_MINUTES } from './feedback.constant';
import { FeedbackEntity } from './feedback.entity';
import type { CreateFeedbackDto } from './feedback.interface';

@Injectable()
export class FeedbackService {
  constructor(
    @I18n() private i18n: I18nService,
    @InjectRepository(FeedbackEntity) private feedbackRepository: Repository<FeedbackEntity>,
  ) {}

  public async getFeedbackById(id: number) {
    return this.feedbackRepository.findOne({ where: { id } });
  }

  public async saveFeedback(data: CreateFeedbackDto) {
    const feedback = this.feedbackRepository.create(data);

    await this.validateFeedback(data.telegramChatId);

    return this.feedbackRepository.save(feedback);
  }

  public async validateFeedback(telegramChatId: number): Promise<boolean> {
    const lastFeedback = await this.feedbackRepository.findOne({ where: { telegramChatId }, order: { createdAt: 'DESC' } });

    if (!lastFeedback) return true;

    const lastFeedbackTime = moment(lastFeedback.createdAt);
    const nextFeedbackAllowedTime = lastFeedbackTime.add(FEEDBACK_COOLDOWN_IN_MINUTES, 'minutes');
    const now = moment();

    if (now.isBefore(nextFeedbackAllowedTime)) {
      const message = this.i18n.translate<string>('feedback.cooldown-error', {
        args: { minutes: FEEDBACK_COOLDOWN_IN_MINUTES, allowedTime: nextFeedbackAllowedTime.format('h:mm:ss a') },
      });
      throw new Error(message);
    }

    return true;
  }
}
