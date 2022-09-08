import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { EntityManager, Repository, UpdateResult } from 'typeorm';

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

  public async findSuperAdminChat() {
    return this.chatRepository.findOne({ where: { chatGroupType: ChatGroupType.SUPERADMIN } });
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

  public async updateChat(id: number, dto: UpdateChatDto, entityManager?: EntityManager): Promise<ChatEntity> {
    let chatRepository;
    if (entityManager) chatRepository = entityManager.createQueryBuilder(ChatEntity, 'c');
    else chatRepository = this.chatRepository;

    return chatRepository
      .createQueryBuilder()
      .update(dto)
      .returning('*')
      .where({ id })
      .execute()
      .then((result: UpdateResult) => (<[Chat]>result.raw)[0]);
  }

  public async assignChatGroup(id: number, chatGroupType: ChatGroupType) {
    const oldAdminChat = await this.chatRepository
      .createQueryBuilder('c')
      .update()
      .set({ chatGroupType: null })
      .where({ chatGroupType })
      .returning('name, telegram_chat_id as "telegramChatId"')
      .execute()
      .then((res: UpdateResult) => <Chat>res.raw[0]);

    await this.updateChat(id, { chatGroupType });

    return <Pick<Chat, 'name' | 'telegramChatId'> | undefined>oldAdminChat;
  }
}
