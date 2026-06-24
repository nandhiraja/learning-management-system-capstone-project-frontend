export interface UserProfile {
  id: number;
  externalId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNo: string;
  profilePictureUrl: string | null;
  role: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
