import type { Assignment } from '../assignment.interface';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface CreateAssignmentDto extends Omit<Assignment, 'id' | 'status' | 'type'>, Partial<Pick<Assignment, 'status' | 'type'>> {}
