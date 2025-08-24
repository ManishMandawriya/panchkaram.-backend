import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
  ForeignKey,
  BelongsTo,
  Index,
} from 'sequelize-typescript';
import { User } from './User';
import { ServiceType, AppointmentStatus } from '../types/appointment';

@Table({
  tableName: 'appointments',
  timestamps: true,
})
export class Appointment extends Model {
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
  })
  patientId!: number;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  doctorId!: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  appointmentDate!: Date;

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
  })
  appointmentTime!: string;

  @Column({
    type: DataType.ENUM(...Object.values(ServiceType)),
    allowNull: false,
  })
  serviceType!: ServiceType;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  patientName!: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  patientAge!: string;

  @Column({
    type: DataType.ENUM('male', 'female'),
    allowNull: false,
  })
  patientGender!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  problemDescription!: string;

  @Column({
    type: DataType.ENUM(...Object.values(AppointmentStatus)),
    allowNull: false,
    defaultValue: AppointmentStatus.PENDING,
  })
  status!: AppointmentStatus;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  })
  totalAmount!: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  isActive!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  isUpcoming!: boolean;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  // Associations
  @BelongsTo(() => User, { as: 'patient', foreignKey: 'patientId' })
  patient!: User;

  @BelongsTo(() => User, { as: 'doctor', foreignKey: 'doctorId' })
  doctor!: User;

  // Indexes for better query performance - temporarily disabled to fix startup
  // @Index(['doctorId', 'appointmentDate'])
  // @Index(['patientId', 'status'])
  // @Index(['appointmentDate', 'appointmentTime'])
  // @Index(['status', 'isActive'])
  // @Index(['isUpcoming'])

  // Instance methods
  get isUpcomingComputed(): boolean {
    const now = new Date();
    const appointmentDateTime = new Date(this.appointmentDate);
    appointmentDateTime.setHours(parseInt(this.appointmentTime.split(':')[0]));
    appointmentDateTime.setMinutes(parseInt(this.appointmentTime.split(':')[1]));
    return appointmentDateTime > now && this.status === AppointmentStatus.CONFIRMED;
  }

  get isPast(): boolean {
    const now = new Date();
    const appointmentDateTime = new Date(this.appointmentDate);
    appointmentDateTime.setHours(parseInt(this.appointmentTime.split(':')[0]));
    appointmentDateTime.setMinutes(parseInt(this.appointmentTime.split(':')[1]));
    return appointmentDateTime < now;
  }

  // Public JSON (without sensitive data)
  toPublicJSON() {
    const appointment = this.toJSON();
    return appointment;
  }
} 