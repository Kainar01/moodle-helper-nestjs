import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository, UpdateResult } from 'typeorm';

import type { UpdateUserDto } from '../dto';
import type { CreateUserDto } from '../dto/create-user.dto';
import { UserEntity } from '../entities';
import { ScheduleHour, User, UserRole } from '../interfaces';
import { UserScheduleService } from './user-schedule.service';

@Injectable()
export class UserService {
  constructor(
    private userScheduleService: UserScheduleService,
    @InjectRepository(UserEntity) private userRepository: Repository<UserEntity>,
  ) {}

  public async findByUsername(username: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  public async findByChatId(chatId: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { chatId } });
  }

  public async findSuperAdmin(): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { role: UserRole.SUPERADMIN } });
  }

  public async findByUserId(userId: number): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { id: userId } });
  }

  public async createUser(dto: CreateUserDto): Promise<UserEntity> {
    const user = this.userRepository.create(dto);

    await this.userRepository.save(user);

    const defaultUserScheduleHours = [ScheduleHour.$8, ScheduleHour.$18];

    await this.userScheduleService.updateUserSchedule(user.id, defaultUserScheduleHours);

    return user;
  }

  public async updateUser(id: number, dto: UpdateUserDto): Promise<User> {
    return this.userRepository
      .createQueryBuilder()
      .update(dto)
      .returning('*')
      .where({ id })
      .execute()
      .then((result: UpdateResult) => (<[User]>result.raw)[0]);
  }
}
