export enum UserRole {
  PATIENT = 'patient',
  DOCTOR = 'doctor',
  CLINIC = 'clinic',
  ADMIN = 'admin',
}

export interface BaseUser {
  id?: number;
  email: string;
  password: string;
  phoneNumber: string;
  role: UserRole;
  isActive: boolean;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Patient extends BaseUser {
  role: UserRole.PATIENT;
  fullName: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  emergencyContact?: string;
  medicalHistory?: string;
  allergies?: string;
  currentMedications?: string;
}

export interface Doctor extends BaseUser {
  role: UserRole.DOCTOR;
  fullName: string;
  doctorId: string;
  departmentId?: number; // Foreign key to Category table
  experience: string;
  qualifications?: string;
  specialization?: string;
  licenseNumber?: string;
  documents?: string[]; // Array of file paths
  isApproved: boolean;
  approvedAt?: Date;
  approvedBy?: number;
}

export interface Clinic extends BaseUser {
  role: UserRole.CLINIC;
  clinicName: string;
  doctorId: string;
  departmentId?: number; // Foreign key to Category table
  experience: string;
  address?: string;
  licenseNumber?: string;
  documents?: string[]; // Array of file paths
  isApproved: boolean;
  approvedAt?: Date;
  approvedBy?: number;
}

export interface Admin extends BaseUser {
  role: UserRole.ADMIN;
  fullName: string;
  permissions: string[];
}

export type User = Patient | Doctor | Clinic | Admin;

export interface LoginRequest {
  phoneNumber: string;
  password: string;
}

export interface RegisterRequest {
  role: UserRole;
  email: string;
  password: string;
  phoneNumber: string;
  fullName?: string;
  clinicName?: string;
  doctorId?: string;
  departmentId?: number; // Foreign key to Category table
  experience?: string;
  specializations?: any[]; // Array of specializations for doctors
  address?: string;
  licenseNumber?: string;
  permissions?: string[];
  documents?: Express.Multer.File[];
  confirmPassword?: string;
}

export interface ForgotPasswordRequest {
  phoneNumber: string;
}

export interface ResetPasswordRequest {
  phoneNumber: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
}

export interface VerifyCodeRequest {
  phoneNumber: string;
  code: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdateProfileRequest {
  fullName: string;
  email: string;
  phoneNumber: string;
  location: string;
  gender: 'male' | 'female' | 'other';
  dateOfBirth: string;
  aboutYourself?: string; // Optional field for doctors
  profileImage?: Express.Multer.File; // Optional profile image file
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user?: Omit<User, 'password'>;
    token?: string;
    refreshToken?: string;
    message?: string;
  };
}

export interface JwtPayload {
  userId: number;
  email: string;
  role: UserRole;
  type: 'access' | 'refresh';
} 