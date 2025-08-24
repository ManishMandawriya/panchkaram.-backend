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
  tableName: 'doctor_availability',
  timestamps: true,
})
export class DoctorAvailability extends Model {
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
    defaultValue: '09:00:00',
  })
  startTime!: string;

  @Column({
    type: DataType.TIME,
    allowNull: false,
    defaultValue: '17:00:00',
  })
  endTime!: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  isAvailable!: boolean;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: 30,
    comment: 'Slot duration in minutes'
  })
  slotDuration?: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: 0,
    comment: 'Break time between slots in minutes'
  })
  breakTime?: number;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  // Associations
  @BelongsTo(() => User, { foreignKey: 'doctorId' })
  doctor!: User;
}