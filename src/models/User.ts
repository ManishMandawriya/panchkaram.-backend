import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
  BeforeCreate,
  BeforeUpdate,
  HasMany,
  HasOne,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import bcrypt from 'bcryptjs';
import { UserRole } from '../types/auth';
import { Review } from './Review';
import { Appointment } from './Appointment';
import { Category } from './Category';
import { DoctorService } from './DoctorService';
import { DoctorAvailability } from './DoctorAvailability';
import { DoctorTimeSlot } from './DoctorTimeSlot';
import { ChatSession } from './ChatSession';
import { ChatMessage } from './ChatMessage';
import { DUMMY_USER_IMAGE, FILE_URL } from '../config/env';

@Table({
  tableName: 'users',
  timestamps: true,

  getterMethods: {
    profileImage() {
      return this.getDataValue('profileImage') ? `${FILE_URL}${this.getDataValue('profileImage')}` : this.getDataValue('role') === UserRole.PATIENT ? DUMMY_USER_IMAGE : null;
    },
  },
})
export class User extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    validate: {
      isEmail: true,
    },
  })
  email!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  password!: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
  })
  phoneNumber!: string;

  @Column({
    type: DataType.ENUM(...Object.values(UserRole)),
    allowNull: false,
  })
  role!: UserRole;

  // Common fields for all user types
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  isActive!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isPhoneVerified!: boolean;

  @Column({
    type: DataType.STRING(6),
    allowNull: true,
  })
  phoneVerificationCode?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  phoneVerificationExpires?: Date;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isEmailVerified!: boolean;

  // Patient specific fields
  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  fullName?: string;

  @Column({
    type: DataType.STRING(500),
    allowNull: true,
  })
  profileImage?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  dateOfBirth?: Date;

  @Column({
    type: DataType.ENUM('male', 'female', 'other'),
    allowNull: true,
  })
  gender?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  address?: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
  })
  emergencyContact?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  medicalHistory?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  allergies?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  currentMedications?: string;

  // Doctor specific fields
  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  doctorId?: string;

  @ForeignKey(() => Category)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  departmentId?: number;

  @BelongsTo(() => Category, { foreignKey: 'departmentId' })
  department?: Category;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  experience?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  qualifications?: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  specialization?: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  licenseNumber?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  aboutYourself?: string;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  degrees?: any[];

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  specializations?: any[];

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  documents?: string[];

  @Column({
    type: DataType.BOOLEAN,
    // defaultValue: false,
    defaultValue: true,
  })
  isApproved!: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  approvedAt?: Date;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  approvedBy?: number;

  // Clinic specific fields
  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  clinicName?: string;

  // Admin specific fields
  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  permissions?: string[];

  @Column({
    type: DataType.DECIMAL(3, 2),
    allowNull: true,
    defaultValue: 0.00,
  })
  rating?: number;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  // Associations
  @HasMany(() => Review, { as: 'reviews', foreignKey: 'patientId' })
  reviews!: Review[];

  @HasMany(() => Review, { as: 'doctorReviews', foreignKey: 'doctorId' })
  doctorReviews!: Review[];

  @HasMany(() => Appointment, { as: 'appointments', foreignKey: 'patientId' })
  appointments!: Appointment[];

  @HasMany(() => Appointment, { as: 'doctorAppointments', foreignKey: 'doctorId' })
  doctorAppointments!: Appointment[];

  @HasOne(() => DoctorService, { as: 'doctorServices', foreignKey: 'doctorId' })
  doctorServices!: DoctorService;

  @HasMany(() => DoctorAvailability, { as: 'doctorAvailability', foreignKey: 'doctorId' })
  doctorAvailability!: DoctorAvailability[];

  @HasMany(() => DoctorTimeSlot, { as: 'doctorTimeSlots', foreignKey: 'doctorId' })
  doctorTimeSlots!: DoctorTimeSlot[];

  // Chat associations
  @HasMany(() => ChatSession, { as: 'patientSessions', foreignKey: 'patientId' })
  patientSessions!: ChatSession[];

  @HasMany(() => ChatSession, { as: 'doctorSessions', foreignKey: 'doctorId' })
  doctorSessions!: ChatSession[];

  @HasMany(() => ChatMessage, { as: 'sentMessages', foreignKey: 'senderId' })
  sentMessages!: ChatMessage[];

  // Instance methods
  async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }

  // Hooks
  @BeforeCreate
  @BeforeUpdate
  static async hashPassword(instance: User) {
    if ((instance as any).changed('password')) {
      const salt = await bcrypt.genSalt(12);
      instance.password = await bcrypt.hash(instance.password, salt);
    }
  }

  // Virtual fields for type safety
  get isPatient(): boolean {
    return this.role === UserRole.PATIENT;
  }

  get isDoctor(): boolean {
    return this.role === UserRole.DOCTOR;
  }

  get isClinic(): boolean {
    return this.role === UserRole.CLINIC;
  }

  get isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  get isHealthcareProvider(): boolean {
    return this.isDoctor || this.isClinic;
  }

  // Public profile (without sensitive data)
  toPublicJSON() {
    const user = this.toJSON();
    delete user.password;
    return user;
  }
} 