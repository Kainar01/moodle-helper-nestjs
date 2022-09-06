import type { AssignmentNotification } from '../notification.interface';
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface CreateAssignmentNotificationDto extends Omit<AssignmentNotification, 'id' | 'status'> {}
