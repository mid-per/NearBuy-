export interface User {
  id: number;
  email: string;
  name: string | null;   // Matches SQLAlchemy's nullable String
  avatar: string | null; // Matches SQLAlchemy's nullable String
  bio?: string;
  location?: string;
  phone?: string;
  is_admin: boolean;
  listings_count?: number;
  rating?: number;
}

export interface EditProfileForm {
  name: string;
  bio?: string;
  location?: string;
  phone?: string;
  avatar?: string | null;
}

export interface ChangeEmailForm {
  currentPassword: string;
  newEmail: string;
}

export interface ChangePasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}