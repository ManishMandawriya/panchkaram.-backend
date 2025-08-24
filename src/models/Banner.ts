import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';

@Table({
  tableName: 'banners',
  timestamps: true,
})
export class Banner extends Model {
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
  title!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    unique: true,
  })
  slug!: string;

  @Column({
    type: DataType.STRING(500),
    allowNull: false,
    comment: 'URL or path to banner image'
  })
  image!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description?: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    comment: 'Link URL when banner is clicked'
  })
  linkUrl?: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Display order (lower numbers show first)'
  })
  sortOrder!: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  isActive!: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: 'Banner start date (optional)'
  })
  startDate?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    comment: 'Banner end date (optional)'
  })
  endDate?: Date;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  // Helper method to check if banner is currently active
  isCurrentlyActive(): boolean {
    if (!this.isActive) return false;
    
    const now = new Date();
    
    if (this.startDate && now < this.startDate) return false;
    if (this.endDate && now > this.endDate) return false;
    
    return true;
  }
}