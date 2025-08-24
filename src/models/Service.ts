import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
  Index,
} from 'sequelize-typescript';
import { ServiceType } from '../types/service';

@Table({
  tableName: 'services',
  timestamps: true,
})
export class Service extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  name!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  description!: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  })
  price!: number;

  @Column({
    type: DataType.ENUM(...Object.values(ServiceType)),
    allowNull: false,
  })
  type!: ServiceType;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  isActive!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  toPublicJSON!: boolean;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  // Indexes for better query performance - temporarily disabled to fix startup
  // @Index(['type', 'isActive'])
  // @Index(['price'])
  // @Index(['toPublicJSON'])

  // Public JSON
  toPublicJSONMethod() {
    const service = this.toJSON();
    return service;
  }
} 