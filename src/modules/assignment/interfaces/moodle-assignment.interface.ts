export interface MoodleAssignment {
  title: string;
  date: Date;
  link: string;
  courseTitle: string;
  eventId: string;
}

export interface MoodleAssignmentListRO {
  events?: MoodleAssignment[];
  error: string | null;
}
