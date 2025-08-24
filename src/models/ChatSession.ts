import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { User } from './User';
import { ChatMessage } from './ChatMessage';
import { Chat } from './Chat';
import { v4 as uuidv4 } from 'uuid';

export enum SessionStatus {
  SCHEDULED = 'scheduled',
  ONGOING = 'ongoing',
  ENDED = 'ended',
  CANCELED = 'canceled',
}

export enum SessionType {
  CHAT = 'chat',
  AUDIO_CALL = 'audioCall',
  VIDEO_CALL = 'videoCall',
}

@Table({
  tableName: 'chat_sessions',
  timestamps: true,
})
export class ChatSession extends Model {
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

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
    comment: 'Public reference for socket room (UUID)'
  })
  sessionId!: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: 'Doctor ID'
  })
  doctorId!: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: 'Patient ID'
  })
  patientId!: number;

  @Column({
    type: DataType.ENUM(...Object.values(SessionType)),
    allowNull: false,
    defaultValue: SessionType.CHAT,
  })
  sessionType!: SessionType;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: 'Secure token or provider token'
  })
  sessionToken?: string;

  @Column({
    type: DataType.ENUM(...Object.values(SessionStatus)),
    allowNull: false,
    defaultValue: SessionStatus.SCHEDULED,
  })
  status!: SessionStatus;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: 'Session start time'
  })
  startTime?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: 'Session end time'
  })
  endTime?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: 'When patient joined'
  })
  patientJoinedAt?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: 'When doctor joined'
  })
  doctorJoinedAt?: Date;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Duration in seconds'
  })
  duration!: number;

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

  @BelongsTo(() => User, { foreignKey: 'patientId', as: 'patient' })
  patient!: User;

  @BelongsTo(() => User, { foreignKey: 'doctorId', as: 'doctor' })
  doctor!: User;

  @HasMany(() => ChatMessage, { foreignKey: 'sessionId', as: 'messages' })
  messages!: ChatMessage[];

  // Helper methods
  static generateSessionId(doctorId: number, patientId: number): string {
    return `session_${doctorId}_${patientId}_${uuidv4().substring(0, 8)}`;
  }

  getDurationInSeconds(): number {
    if (!this.startTime || !this.endTime) {
      return 0;
    }
    return Math.floor((this.endTime.getTime() - this.startTime.getTime()) / 1000);
  }

  getDurationInMinutes(): number {
    return Math.ceil(this.getDurationInSeconds() / 60);
  }

  isSessionActive(): boolean {
    return this.status === SessionStatus.ONGOING;
  }

  canJoin(): boolean {
    return this.status === SessionStatus.SCHEDULED || this.status === SessionStatus.ONGOING;
  }

  markAsStarted(): void {
    this.status = SessionStatus.ONGOING;
    this.startTime = new Date();
  }

  markAsEnded(): void {
    this.status = SessionStatus.ENDED;
    this.endTime = new Date();
    this.duration = this.getDurationInSeconds();
  }

  markPatientJoined(): void {
    this.patientJoinedAt = new Date();
  }

  markDoctorJoined(): void {
    this.doctorJoinedAt = new Date();
  }
}
