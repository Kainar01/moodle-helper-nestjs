import type { User } from '../interfaces';

export interface CreateUserDto extends Partial<Omit<User, 'id'>> {
  chatId: string;
}
