export interface EnrollmentResponse {
  id: number;
  courseId: number;
  courseExternalId: string;
  courseTitle: string;
  progress: number;
  courseThumbnailUrl: string | null;
  instructorName: string;
}

export interface CertificateResponse {
  id: number;
  issuedDate: string;
  certificateUrl: string;
  userGuid: string;
  userFullName: string;
  userEmail: string;
  courseGuid: string;
  courseTitle: string;
  instructorName: string;
}
