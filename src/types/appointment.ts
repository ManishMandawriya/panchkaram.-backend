export interface Appointment {
  id: number;
  patientId: number;
  doctorId: number;
  appointmentDate: Date;
  appointmentTime: string;
  serviceType: ServiceType;
  patientName: string;
  patientAge: string;
  patientGender: 'male' | 'female';
  problemDescription: string;
  status: AppointmentStatus;
  totalAmount: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum ServiceType {
  CHAT = 'chat',
  AUDIO_CALL = 'audio_call',
  VIDEO_CALL = 'video_call',
}

export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface CreateAppointmentRequest {
  doctorId: number;
  appointmentDate: string;
  appointmentTime: string;
  serviceType: ServiceType;
  patientName: string;
  patientAge: string;
  patientGender: 'male' | 'female';
  problemDescription: string;
}

export interface AppointmentResponse {
  success: boolean;
  message: string;
  data?: {
    appointment?: Appointment;
    appointments?: Appointment[];
    pagination?: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  };
}

export interface AvailableSlot {
  time: string;
  isAvailable: boolean;
}

export interface AvailableSlotsResponse {
  success: boolean;
  message: string;
  data?: {
    slots?: AvailableSlot[];
    date?: string;
    timeOfDay?: 'morning' | 'evening';
  };
}

export interface AppointmentFilters {
  doctorId?: number;
  patientId?: number;
  status?: AppointmentStatus;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
  sortBy?: 'appointmentDate' | 'createdAt' | 'patientName';
  sortOrder?: 'ASC' | 'DESC';
} 