import { CourseResponse } from './course.model';
import { UserProfile } from '../shared/models/user.model';

export interface ChartDataDto {
  labels: string[];
  data: number[];
}

export interface AdminDashboardResponse {
  users: number;
  courses: number;
  orders: number;
  totalRevenue: number;
  pendingCoursesCount: number;
  blockedUsersCount: number;
  instructorsCount: number;
  studentsCount: number;
  platformGrowthChart?: ChartDataDto;
  revenueByCategoryChart?: ChartDataDto;
  courseStatusChart?: ChartDataDto;
  monthlyRevenueChart?: ChartDataDto;
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
