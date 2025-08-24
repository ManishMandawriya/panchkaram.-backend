export enum ChatSessionStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired'
}

export enum ChatSessionType {
  CHAT = 'chat',
  AUDIO_CALL = 'audio_call',
  VIDEO_CALL = 'video_call'
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  AUDIO = 'audio',
  VIDEO = 'video',
  SYSTEM = 'system'
}

export enum MessageStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed'
}

export enum MessageDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
  SYSTEM = 'system'
}

export interface ChatSessionData {
  id: string;
  patientId: number;
  doctorId: number;
  sessionType: ChatSessionType;
  status: ChatSessionStatus;
  totalCost: number;
  costPerUnit: number;
  totalDuration: number;
  totalMessages: number;
  startedAt?: Date;
  endedAt?: Date;
  expiresAt?: Date;
  notes?: string;
  isPaid: boolean;
  paymentTransactionId?: string;
  paidAt?: Date;
  isRated: boolean;
  rating?: number;
  review?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessageData {
  id: string;
  sessionId: string;
  senderId: number;
  messageType: MessageType;
  direction: MessageDirection;
  content: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  status: MessageStatus;
  sentAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
  messageId: string;
  replyToMessageId?: string;
  isEdited: boolean;
  isDeleted: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSessionRequest {
  doctorId: number;
  sessionType: ChatSessionType;
  notes?: string;
}

export interface SendMessageRequest {
  sessionId: string;
  content: string;
  messageType?: MessageType;
  replyToMessageId?: string;
  file?: Express.Multer.File;
}

export interface GetMessagesQuery {
  page?: number;
  limit?: number;
  messageType?: MessageType;
  status?: MessageStatus;
  startDate?: string;
  endDate?: string;
}

export interface GetSessionsQuery {
  page?: number;
  limit?: number;
  status?: ChatSessionStatus;
  sessionType?: ChatSessionType;
  startDate?: string;
  endDate?: string;
  sortBy?: 'createdAt' | 'startedAt' | 'totalCost' | 'totalMessages';
  sortOrder?: 'ASC' | 'DESC';
}

export interface SessionFilters {
  page: number;
  limit: number;
  status?: ChatSessionStatus;
  sessionType?: ChatSessionType;
  startDate?: Date;
  endDate?: Date;
  sortBy: 'createdAt' | 'startedAt' | 'totalCost' | 'totalMessages';
  sortOrder: 'ASC' | 'DESC';
}

export interface MessageFilters {
  page: number;
  limit: number;
  messageType?: MessageType;
  status?: MessageStatus;
  startDate?: Date;
  endDate?: Date;
  sortBy: 'sentAt' | 'createdAt';
  sortOrder: 'ASC' | 'DESC';
}

export interface SocketMessageData {
  sessionId: string;
  content: string;
  messageType?: MessageType;
  replyToMessageId?: string;
}

export interface SocketSessionData {
  sessionId: string;
  status: ChatSessionStatus;
}

export interface SocketUserData {
  userId: number;
  userName: string;
  isTyping?: boolean;
  timestamp?: Date;
}
