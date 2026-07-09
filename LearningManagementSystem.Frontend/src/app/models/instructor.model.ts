import { ChartDataDto } from './admin.model';

export interface InstructorDashboardResponse {
  totalCourses: number;
  totalStudents: number;
  totalRevenue: number;
  averageCourseRating: number;
  totalReviewsCount: number;
  unansweredDiscussionsCount: number;
  enrollmentTrendsChart?: ChartDataDto;
  revenuePerCourseChart?: ChartDataDto;
  ratingsDistributionChart?: ChartDataDto;
  monthlyRevenueChart?: ChartDataDto;
}

export interface InstructorDiscussionResponse {
  discussionGuid: string;
  courseGuid: string;
  courseTitle: string;
  lectureTitle: string | null;
  studentName: string;
  title: string;
  content: string;
  createdAt: string;
  repliesCount: number;
  isAnswered: boolean;
}
