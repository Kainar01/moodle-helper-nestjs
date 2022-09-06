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
  chatId: string;
  assignmentId: number;
  scheduledAt: Date;
  status: NotificationStatus;
}

export interface PendingNotifications {
  notifications: Date[];
  duplicate: boolean;
}
