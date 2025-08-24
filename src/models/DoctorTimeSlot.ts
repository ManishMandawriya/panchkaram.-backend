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

export enum DayOfWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday',
}

@Table({
  tableName: 'doctor_time_slots',
  timestamps: true,
})
export class DoctorTimeSlot extends Model {
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
  doctorId!: number;

  @Column({
    type: DataType.ENUM(...Object.values(DayOfWeek)),
    allowNull: false,
  })
  dayOfWeek!: DayOfWeek;

  @Column({
    type: DataType.TIME,
    allowNull: false,
    comment: 'Specific time slot (e.g., 10:00:00, 10:30:00)'
  })
  timeSlot!: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  isAvailable!: boolean;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: 30,
    comment: 'Duration of this slot in minutes'
  })
  duration?: number;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  // Associations
  @BelongsTo(() => User, { foreignKey: 'doctorId' })
  doctor!: User;

  // Helper method to format time slot for display
  getFormattedTimeSlot(): string {
    const [hour, minute] = this.timeSlot.split(':');
    const hourNum = parseInt(hour);
    const hour12 = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
    const ampm = hourNum < 12 ? 'AM' : 'PM';
    return `${hour12.toString().padStart(2, '0')}:${minute}${ampm}`;
  }
}