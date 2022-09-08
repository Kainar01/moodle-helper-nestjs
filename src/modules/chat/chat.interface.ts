export enum ChatType {
  PRIVATE = 'private',
  GROUP = 'group',
}

export enum ChatGroupType {
  ERROR = 'error',
  ADMIN = 'admin',
  SUPERADMIN = 'superadmin',
}

export interface Chat {
  id: number;
  name: string;
  telegramChatId: number;
  type: ChatType;
  chatGroupType: ChatGroupType | null;
  moodleUsername: string | null;
  moodlePassword: string | null;

  lastAssignmentRequest: Date | null;
  lastAssignmentNotification: Date | null;
  verified: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export interface TelegramChat {
  id: number;
  name: string;
  type: ChatType;
}

export interface CreateChatDto extends Partial<Omit<Chat, 'id' | 'createdAt' | 'updatedAt'>> {
  name: string;
  telegramChatId: number;
  type: ChatType;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface UpdateChatDto extends Partial<Omit<Chat, 'id' | 'createdAt' | 'updatedAt'>> {}
