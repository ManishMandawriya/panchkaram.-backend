import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
  Index,
} from 'sequelize-typescript';

export enum CodeType {
  PASSWORD_RESET = 'password_reset',
  PHONE_VERIFICATION = 'phone_verification',
  EMAIL_VERIFICATION = 'email_verification',
}

@Table({
  tableName: 'verification_codes',
  timestamps: true,
})
export class VerificationCode extends Model {
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
  email!: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
  })
  phoneNumber!: string;

  @Column({
    type: DataType.STRING(6),
    allowNull: false,
  })
  code!: string;

  @Column({
    type: DataType.ENUM(...Object.values(CodeType)),
    allowNull: false,
  })
  type!: CodeType;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isUsed!: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  expiresAt!: Date;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  attempts!: number;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  // Instance methods
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isValid(): boolean {
    return !this.isUsed && !this.isExpired();
  }

  markAsUsed(): void {
    this.isUsed = true;
  }

  incrementAttempts(): void {
    this.attempts = (this.attempts || 0) + 1;
  }

  // Static methods
  static async generateCode(): Promise<string> {
    const { OTPHelper } = await import('../utils/otpHelper');
    return OTPHelper.generateOTP();
  }

  static async createCode(
    email: string,
    phoneNumber: string,
    type: CodeType,
    expiresInMinutes: number = 10
  ): Promise<VerificationCode> {
    const code = await this.generateCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

    return this.create({
      email,
      phoneNumber,
      code,
      type,
      expiresAt,
      attempts: 0,
    });
  }

  static async verifyCode(
    email: string,
    phoneNumber: string,
    code: string,
    type: CodeType
  ): Promise<VerificationCode | null> {
    const verificationCode = await this.findOne({
      where: {
        email,
        phoneNumber,
        code,
        type,
        isUsed: false,
      },
    });

    if (!verificationCode || verificationCode.isExpired()) {
      return null;
    }

    return verificationCode;
  }

  static async cleanupExpiredCodes(): Promise<number> {
    const result = await this.destroy({
      where: {
        expiresAt: {
          [require('sequelize').Op.lt]: new Date(),
        },
      },
    });
    return result;
  }
} 