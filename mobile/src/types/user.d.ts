export interface User {
  id: number;
  email: string;
  password?: string; // Only for forms, not in API responses
  is_admin: boolean;
  avatar: string | null; // Matches SQLAlchemy's nullable String
  name: string | null;   // Matches SQLAlchemy's nullable String
}

export interface UserProfileResponse extends User {
  listings_count?: number;
  rating?: number;
}

export interface EditProfileForm {
  name: string;
  email: string;
  password: string;
  avatar?: string | null;
}
