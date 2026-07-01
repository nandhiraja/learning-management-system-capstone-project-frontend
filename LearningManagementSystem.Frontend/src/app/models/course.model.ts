export interface Category {
  id: number;
  name: string;
  isApproved: boolean;
}

export interface Language {
  id: number;
  name: string;
  isApproved: boolean;
}

export interface Course {
  id: number;
  externalId: string;
  title: string;
  description: string;
  price: number;
  language: string;
  thumbnailUrl: string | null;
  rating: number;
  studentsCount: number;
  status: string;
  createdAt: string;
  categoryId: number;
  instructor: {
    id?: number;
    email?: string;
    firstName: string;
    lastName: string;
    profilePictureUrl: string | null;
  };
}

export interface CourseResponse extends Course {
  sections: CourseSectionResponse[];
  originalCourseExternalId?: string;
  originalCourseDetails?: CourseResponse;
}

export interface CourseSectionResponse {
  id: number;
  title: string;
  order: number;
  lectures: LectureResponse[];
}

export interface LectureResponse {
  id: number;
  title: string;
  contentUrl: string;
  durationInMinutes: number;
  contentType: string;
  quizId: number | null;
}
