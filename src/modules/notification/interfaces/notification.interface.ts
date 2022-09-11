export interface NotifyAssignmentJobData {
  notificationId: number;
}

export enum NotificationStatus {
  PENDING = 'pending',
  NOTIFIED = 'notified',
  FAILED = 'failed',
}

export interface AssignmentNotification {
  id: number;
  telegramChatId: number;
  assignmentId: number;
  scheduledAt: Date;
  status: NotificationStatus;
}

export interface PendingNotifications {
  notifications: Date[];
  duplicate: boolean;
}
