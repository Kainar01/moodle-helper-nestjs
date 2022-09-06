export interface User {
  id: number;
  telegramUserId: number;
  chatId: string;
  name: string;
  username: string | null;
  moodleUsername: string | null;
  moodlePassword: string | null;
  role: UserRole | null;
  lastAssignmentNotification: Date | null;
  lastAssignmentRequest: Date | null;
  verified: boolean;
}

export enum UserRole {
  ADMIN = 'admin',
  SUPERADMIN = 'superadmin',
}
