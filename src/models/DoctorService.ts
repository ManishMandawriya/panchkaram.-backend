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

export enum ServiceType {
  CHAT = 'chat',
  AUDIO_CALL = 'audio_call',
  VIDEO_CALL = 'video_call',
}

export interface ServiceDetails {
  price: number;
  isEnabled: boolean;
  duration: number;
  description?: string;
}

export interface DoctorServices {
  chat: ServiceDetails;
  audioCall: ServiceDetails;
  videoCall: ServiceDetails;
}

@Table({
  tableName: 'doctor_services',
  timestamps: true,
})
export class DoctorService extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    unique: true, // One record per doctor
  })
  doctorId!: number;

  // Chat service details
  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  })
  chatPrice!: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  chatEnabled!: boolean;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: 30,
  })
  chatDuration!: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  chatDescription?: string;

  // Audio Call service details
  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  })
  audioPrice!: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  audioEnabled!: boolean;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: 30,
  })
  audioDuration!: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  audioDescription?: string;

  // Video Call service details
  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  })
  videoPrice!: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  videoEnabled!: boolean;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: 30,
  })
  videoDuration!: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  videoDescription?: string;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  // Associations
  @BelongsTo(() => User, { foreignKey: 'doctorId' })
  doctor!: User;

  // Helper method to get services in structured format
  getServicesObject(): DoctorServices {
    return {
      chat: {
        price: this.chatPrice,
        isEnabled: this.chatEnabled,
        duration: this.chatDuration,
        description: this.chatDescription,
      },
      audioCall: {
        price: this.audioPrice,
        isEnabled: this.audioEnabled,
        duration: this.audioDuration,
        description: this.audioDescription,
      },
      videoCall: {
        price: this.videoPrice,
        isEnabled: this.videoEnabled,
        duration: this.videoDuration,
        description: this.videoDescription,
      },
    };
  }
}