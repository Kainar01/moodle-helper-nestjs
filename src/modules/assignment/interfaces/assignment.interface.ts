export enum AssignmentType {
  ASSIGNMENT = 'assignment',
  QUIZ = 'quiz',
}

export enum AssignmentStatus {
  PENDING = 'pending',
  SUBMITTED = 'submitted',
  HIDDEN = 'hidden',
}

export interface Assignment {
  id: number;
  userId: number;
  assignmentId: string;
  title: string;
  type: AssignmentType;
  status: AssignmentStatus;
  link: string;
  courseTitle: string;
  deadline: Date;
}

export interface AssignmentListRO {
  assignments: Assignment[];
  error: string | null;
}

export interface AssignmentFormatted extends Assignment {
  formatted: string;
}

export interface AssignmentFormattedListRO {
  assignments: AssignmentFormatted[];
  error: string | null;
}
