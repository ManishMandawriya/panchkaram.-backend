export interface Review {
  id?: number;
  patientId: number;
  doctorId: number;
  rating: number;
  comment?: string;
  isRecommended: boolean;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateReviewRequest {
  doctorId: number;
  rating: number;
  comment?: string;
  isRecommended: boolean;
}

export interface UpdateReviewRequest {
  rating?: number;
  comment?: string;
  isRecommended?: boolean;
}

export interface ReviewResponse {
  success: boolean;
  message: string;
  data?: {
    review?: Review;
    reviews?: Review[];
    statistics?: ReviewStatistics;
  };
}

export interface ReviewStatistics {
  totalReviews: number;
  positiveReviews: number;
  negativeReviews: number;
  averageRating: number;
  positivePercentage: number;
  negativePercentage: number;
  positiveChange: number;
  negativeChange: number;
}

export interface ReviewWithUserDetails extends Review {
  patient?: {
    id: number;
    fullName: string;
    profilePicture?: string;
  };
  doctor?: {
    id: number;
    fullName: string;
    doctorId: string;
    departmentId?: number;
    department?: string;
    specialization?: string;
    profilePicture?: string;
  };
}

export interface ReviewFilters {
  doctorId?: number;
  patientId?: number;
  rating?: number;
  isRecommended?: boolean;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'rating';
  sortOrder?: 'ASC' | 'DESC';
} 