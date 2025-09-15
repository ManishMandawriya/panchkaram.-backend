import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from './User';
import { ChatSession } from './ChatSession';
import { Chat } from './Chat';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  AUDIO = 'audio',
  VIDEO = 'video',
  SYSTEM = 'system',
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  PENDING = 'pending',
}

export enum MessageDirection {
  INBOUND = 'inbound',  // From patient to doctor
  OUTBOUND = 'outbound', // From doctor to patient
  SYSTEM = 'system',     // System messages
}

@Table({
  tableName: 'chat_messages',
  timestamps: true,
})
export class ChatMessage extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  @ForeignKey(() => Chat)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: 'Reference to chats table'
  })
  chatId!: number;

  @ForeignKey(() => ChatSession)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: 'Reference to chat_sessions table'
  })
  sessionId!: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: 'Sender ID (patient or doctor), null for system messages'
  })
  senderId?: number;

  @Column({
    type: DataType.ENUM(...Object.values(MessageType)),
    allowNull: false,
    defaultValue: MessageType.TEXT,
  })
  messageType!: MessageType;

  @Column({
    type: DataType.ENUM(...Object.values(MessageDirection)),
    allowNull: false,
    defaultValue: MessageDirection.INBOUND,
  })
  direction!: MessageDirection;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    comment: 'Message content'
  })
  content!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: 'File URL if message contains file/image/audio/video'
  })
  fileUrl?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: 'File name'
  })
  fileName?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: 'File type/MIME type'
  })
  fileType?: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    comment: 'File size in bytes'
  })
  fileSize?: number;

  @Column({
    type: DataType.ENUM(...Object.values(MessageStatus)),
    allowNull: false,
    defaultValue: MessageStatus.PENDING,
  })
  status!: MessageStatus;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: 'Message sent timestamp'
  })
  sentAt?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: 'Message delivered timestamp'
  })
  deliveredAt?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: 'Message read timestamp'
  })
  readAt?: Date;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: 'Unique message ID for tracking'
  })
  messageId?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: 'Reply to message ID'
  })
  replyToMessageId?: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    comment: 'Whether message is edited'
  })
  isEdited!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    comment: 'Whether message is deleted'
  })
  isDeleted!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  isActive!: boolean;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  // Associations
  @BelongsTo(() => Chat, { foreignKey: 'chatId', as: 'chat' })
  chat!: Chat;

  @BelongsTo(() => ChatSession, { foreignKey: 'sessionId', as: 'session' })
  session!: ChatSession;

  @BelongsTo(() => User, { foreignKey: 'senderId', as: 'sender' })
  sender?: User;

  // Helper methods
  isFromPatient(): boolean {
    return this.direction === MessageDirection.INBOUND;
  }

  isFromDoctor(): boolean {
    return this.direction === MessageDirection.OUTBOUND;
  }

  isSystemMessage(): boolean {
    return this.direction === MessageDirection.SYSTEM;
  }

  canBeEdited(): boolean {
    return !this.isDeleted && this.messageType === MessageType.TEXT;
  }

  canBeDeleted(): boolean {
    return !this.isDeleted;
  }

  getDisplayContent(): string {
    if (this.isDeleted) {
      return 'This message was deleted';
    }
    return this.content;
  }

  markAsDelivered(): void {
    this.status = MessageStatus.DELIVERED;
    this.deliveredAt = new Date();
  }

  markAsRead(): void {
    this.status = MessageStatus.READ;
    this.readAt = new Date();
  }

  markAsFailed(): void {
    this.status = MessageStatus.FAILED;
  }
}
