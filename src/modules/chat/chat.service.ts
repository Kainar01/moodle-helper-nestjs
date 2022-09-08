import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository, UpdateResult } from 'typeorm';

import { ScheduleHour } from '../schedule/schedule.interface';
import { ScheduleService } from '../schedule/schedule.service';
import { ChatEntity } from './chat.entity';
import { Chat, ChatGroupType, CreateChatDto, UpdateChatDto } from './chat.interface';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatEntity) private chatRepository: Repository<ChatEntity>,
    @Inject(forwardRef(() => ScheduleService)) private scheduleService: ScheduleService,
  ) {}

  public async findChatByTelegramId(telegramChatId: number) {
    return this.chatRepository.findOne({ where: { telegramChatId } });
  }

  public async findChatById(chatId: number) {
    return this.chatRepository.findOne({ where: { id: chatId } });
  }

  public async findAdminChat() {
    return this.chatRepository.findOne({ where: { chatGroupType: ChatGroupType.ADMIN } });
  }

  public async findErrorChat() {
    return this.chatRepository.findOne({ where: { chatGroupType: ChatGroupType.ERROR } });
  }

  public async createChat(dto: CreateChatDto): Promise<ChatEntity> {
    const chat = this.chatRepository.create(dto);

    await this.chatRepository.save(chat);

    const defaultChatScheduleHours = [ScheduleHour.$8, ScheduleHour.$18];

    await this.scheduleService.updateChatScheduleWithHours(chat.id, defaultChatScheduleHours);

    return chat;
  }

  public async updateChat(id: number, dto: UpdateChatDto): Promise<Chat> {
    return this.chatRepository
      .createQueryBuilder()
      .update(dto)
      .returning('*')
      .where({ id })
      .execute()
      .then((result: UpdateResult) => (<[Chat]>result.raw)[0]);
  }
}
