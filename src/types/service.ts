export interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  type: ServiceType;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum ServiceType {
  VOICE_CALL = 'Voice Call',
  MESSAGING = 'Messaging',
  VIDEO_CALL = 'Video Call',
}

export interface ServiceResponse {
  success: boolean;
  message: string;
  data?: {
    services?: Service[];
  };
}

export interface ServicePrice {
  type: ServiceType;
  price: number;
  description: string;
} 