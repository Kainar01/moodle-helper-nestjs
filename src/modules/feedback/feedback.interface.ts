export enum FeedbackType {
  GENERAL = 'general',
  ERROR = 'error',
  SUGGESTION = 'suggestion',
  NEW_FEATURE = 'new-feature',
}

export interface Feedback {
  id: number;
  telegramChatId: number;
  message: string;
  type: FeedbackType;
  createdAt: Date;
  updatedAt: Date;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface CreateFeedbackDto extends Pick<Feedback, 'telegramChatId' | 'message'> {}
