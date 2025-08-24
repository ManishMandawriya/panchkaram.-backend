import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
  BeforeCreate,
  BeforeUpdate,
} from 'sequelize-typescript';
import { FILE_URL } from '../config/env';

export enum CategoryStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
}

@Table({
  tableName: 'categories',
  timestamps: true,

  getterMethods: {
    image() {
      return this.getDataValue('image') ? `${FILE_URL}${this.getDataValue('image')}` : null;
    },
  },
})
export class Category extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    unique: true,
  })
  name!: string;

  @Column({
    type: DataType.ENUM(...Object.values(CategoryStatus)),
    allowNull: false,
    defaultValue: CategoryStatus.PENDING,
  })
  status!: CategoryStatus;

  @Column({
    type: DataType.STRING(500),
    allowNull: true,
  })
  image?: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  isActive!: boolean;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description?: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: 0,
  })
  sortOrder?: number;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  // Instance methods
  get isActiveStatus(): boolean {
    return this.status === CategoryStatus.ACTIVE && this.isActive;
  }

  // Public profile (without sensitive data)
  toPublicJSON() {
    const category = this.toJSON();
    return category;
  }

  // Hooks
  @BeforeCreate
  @BeforeUpdate
  static async validateName(instance: Category) {
    if (instance.name) {
      instance.name = instance.name.trim();
    }
  }
} 