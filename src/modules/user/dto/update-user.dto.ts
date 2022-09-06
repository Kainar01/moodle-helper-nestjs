import type { User } from '../interfaces';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface UpdateUserDto extends Partial<Omit<User, 'id'>> {
}
