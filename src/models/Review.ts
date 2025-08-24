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

@Table({
  tableName: 'reviews',
  timestamps: true,
})
export class Review extends Model {
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

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  patientId!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5,
    },
  })
  rating!: number;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  comment!: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  isActive!: boolean;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  // Associations
  @BelongsTo(() => User, { as: 'doctor', foreignKey: 'doctorId' })
  doctor!: User;

  @BelongsTo(() => User, { as: 'patient', foreignKey: 'patientId' })
  patient!: User;

  // Indexes for better query performance
  @Index(['doctorId', 'isActive'])
  @Index(['patientId', 'isActive'])
  @Index(['rating'])
  @Index(['createdAt'])

  // Instance methods
  toPublicJSON() {
    const review = this.toJSON();
    return review;
  }
} 