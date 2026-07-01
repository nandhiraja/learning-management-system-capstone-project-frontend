import { UserProfile } from '../shared/models/user.model';

export interface DiscussionResponse {
  externalId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: UserProfile;
  repliesCount: number;
  lectureId: number;
  lectureTitle: string | null;
  isInstructorThread: boolean;
}

export interface DiscussionDetailResponse {
  externalId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: UserProfile;
  lectureId: number;
  lectureTitle: string | null;
  isInstructorThread: boolean;
  replies: DiscussionReplyResponse[];
}

export interface DiscussionReplyResponse {
  externalId: string;
  content: string;
  createdAt: string;
  user: UserProfile;
  isPinned: boolean;
  likesCount: number;
  isInstructorReply: boolean;
  isAuthorReply: boolean;
  isLikedByCurrentUser: boolean;
}
