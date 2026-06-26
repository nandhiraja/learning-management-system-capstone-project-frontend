import { CourseResponse } from './course.model';
import { UserProfile } from '../shared/models/user.model';

export interface AdminDashboardResponse {
  users: number;
  courses: number;
  orders: number;
  totalRevenue: number;
  pendingCoursesCount: number;
  blockedUsersCount: number;
  instructorsCount: number;
  studentsCount: number;
}

export interface PendingQueueResponse {
  pendingCourses: CourseResponse[];
  pendingInstructors: UserProfile[];
}

export interface AdminCategoryResponse {
  id: number;
  name: string;
  isApproved: boolean;
  createdAt: string;
}

export interface AdminLanguageResponse {
  id: number;
  name: string;
  isApproved: boolean;
  createdAt: string;
}
