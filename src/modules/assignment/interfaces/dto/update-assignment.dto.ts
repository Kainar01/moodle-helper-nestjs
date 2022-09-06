import type { Assignment } from '../assignment.interface';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface UpdateAssignmentDto extends Partial<Omit<Assignment, 'id'>> {}
