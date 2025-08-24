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
import { ChatSession } from './ChatSession';

@Table({
  tableName: 'chats',
  timestamps: true,
})
export class Chat extends Model {
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
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  isActive!: boolean;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  // Associations
  @BelongsTo(() => User, { foreignKey: 'doctorId', as: 'doctor' })
  doctor!: User;

  @BelongsTo(() => User, { foreignKey: 'patientId', as: 'patient' })
  patient!: User;

  @HasMany(() => ChatSession, { foreignKey: 'chatId', as: 'sessions' })
  sessions!: ChatSession[];

  // Helper methods
  static async findOrCreateChat(doctorId: number, patientId: number): Promise<Chat> {
    const [chat] = await Chat.findOrCreate({
      where: {
        doctorId,
        patientId,
        isActive: true,
      },
      defaults: {
        doctorId,
        patientId,
        isActive: true,
      },
    });
    return chat;
  }
}
