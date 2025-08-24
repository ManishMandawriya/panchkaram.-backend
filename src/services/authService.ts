import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { VerificationCode, CodeType } from '../models/VerificationCode';
import { EmailService } from './emailService';
import { SMSService } from './smsService';
import { FileUploadService } from './fileUploadService';
import { OTPHelper } from '../utils/otpHelper';
import {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRES_IN,
  BCRYPT_SALT_ROUNDS,
} from '../config/env';
import {
  UserRole,
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyCodeRequest,
  ChangePasswordRequest,
  UpdateProfileRequest,
  AuthResponse,
  JwtPayload,
} from '../types/auth';
import { logger } from '../utils/logger';

export class AuthService {
  private emailService: EmailService;
  private smsService: SMSService;
  private fileUploadService: FileUploadService;

  constructor() {
    this.emailService = new EmailService();
    this.smsService = new SMSService();
    this.fileUploadService = new FileUploadService();
  }

  // Generate JWT tokens
  private generateTokens(userId: number, email: string, role: UserRole) {
    const accessToken = (jwt as any).sign(
      { userId, email, role, type: 'access' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const refreshToken = (jwt as any).sign(
      { userId, email, role, type: 'refresh' },
      JWT_REFRESH_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRES_IN }
    );

    return { accessToken, refreshToken };
  }

  // User registration
  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({
        where: { phoneNumber: data?.phoneNumber },
      });

      if (existingUser) {
        if (!existingUser?.isPhoneVerified) {
          await existingUser.destroy();
        } else {
          return {
            success: false,
            message: 'User with this phone number already exists',
          };
        };
      }

      // Validate password confirmation
      if (data.password !== data.confirmPassword) {
        return {
          success: false,
          message: 'Passwords do not match',
        };
      }

      // Handle file uploads for doctors and clinics
      let documents: string[] = [];
      if (data.documents && (data.role === UserRole.DOCTOR || data.role === UserRole.CLINIC)) {
        documents = await this.fileUploadService.uploadMultipleFiles(data.documents);
      }

      // Generate phone verification code using OTP helper
      const phoneVerificationCode = OTPHelper.generateOTP();
      const phoneVerificationExpires = OTPHelper.generateExpiryTime(10); // 10 minutes

      // Create user based on role
      const userData: any = {
        email: data.email,
        password: data.password,
        phoneNumber: data.phoneNumber,
        role: data.role,
        documents,
        phoneVerificationCode,
        phoneVerificationExpires,
        isPhoneVerified: false,
      };

      switch (data.role) {
        case UserRole.PATIENT:
          userData.fullName = data.fullName;
          break;
        case UserRole.DOCTOR:
          userData.fullName = data.fullName;
          userData.doctorId = data.doctorId;
          userData.departmentId = data.departmentId;
          userData.experience = data.experience;
          userData.specializations = data.specializations || [];
          userData.isApproved = false;
          break;
        case UserRole.CLINIC:
          userData.clinicName = data.clinicName;
          userData.departmentId = data.departmentId;
          userData.experience = data.experience;
          userData.address = data.address;
          userData.licenseNumber = data.licenseNumber;
          userData.isApproved = false;
          break;
        // case UserRole.ADMIN:
        //   userData.fullName = data.fullName;
        //   userData.permissions = data.permissions || ['all'];
        //   break;
        default:
          return {
            success: false,
            message: 'Invalid user role',
          };
      }

      const user = await User.create(userData);

      // Send verification SMS
      await this.smsService.sendVerificationCode(user.phoneNumber);

      logger.info(`User registered successfully: ${user.phoneNumber}`);

      return {
        success: true,
        message: 'Registration successful. Please check your phone for verification code.',
        data: {
          // user: user.toPublicJSON(),
          message: 'Please verify your phone number to continue',
        },
      };
    } catch (error) {
      logger.error('Registration error:', error);
      return {
        success: false,
        message: 'Registration failed. Please try again.',
      };
    }
  }

  // User login
  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      const user = await User.findOne({
        where: { phoneNumber: data.phoneNumber },
      });

      if (!user) {
        return {
          success: false,
          message: 'Invalid phone number or password',
        };
      }

      if (!user.isActive) {
        return {
          success: false,
          message: 'Account is deactivated. Please contact support.',
        };
      }

      if (!user.isPhoneVerified) {
        return {
          success: false,
          message: 'Please verify your phone number before logging in',
        };
      }

      const isPasswordValid = await user.comparePassword(data.password);
      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Invalid phone number or password',
        };
      }

      // Check if healthcare provider is approved
      if (user.isHealthcareProvider && !user.isApproved) {
        return {
          success: false,
          message: 'Your account is pending approval. Please wait for admin approval.',
        };
      }

      // Generate tokens
      const { accessToken, refreshToken } = this.generateTokens(
        user.id,
        user.email,
        user.role
      );

      logger.info(`User logged in successfully: ${user.phoneNumber}`);

      return {
        success: true,
        message: 'Login successful',
        data: {
          user: user.toPublicJSON(),
          token: accessToken,
          refreshToken,
        },
      };
    } catch (error) {
      logger.error('Login error:', error);
      return {
        success: false,
        message: 'Login failed. Please try again.',
      };
    }
  }

  // Forgot password
  async forgotPassword(data: ForgotPasswordRequest): Promise<AuthResponse> {
    try {
      const user = await User.findOne({
        where: { phoneNumber: data.phoneNumber },
      });

      if (!user) {
        return {
          success: false,
          message: 'No user found with the provided phone number',
        };
      }

      // Create verification code
      await VerificationCode.createCode(
        user.email,
        data.phoneNumber,
        CodeType.PASSWORD_RESET,
        10
      );

      // Send SMS with verification code
      await this.smsService.sendVerificationCode(data.phoneNumber);

      logger.info(`Password reset code sent to: ${data.phoneNumber}`);

      return {
        success: true,
        message: 'Verification code sent to your phone number',
      };
    } catch (error) {
      logger.error('Forgot password error:', error);
      return {
        success: false,
        message: 'Failed to send verification code. Please try again.',
      };
    }
  }

  // Verify code
  async verifyCode(data: VerifyCodeRequest): Promise<AuthResponse> {
    try {
      const user = await User.findOne({
        where: { phoneNumber: data.phoneNumber },
      });

      if (!user) {
        return {
          success: false,
          message: 'No user found with the provided phone number',
        };
      }

      const verificationCode = await VerificationCode.verifyCode(
        user.email,
        data.phoneNumber,
        data.code,
        CodeType.PASSWORD_RESET
      );

      if (!verificationCode) {
        return {
          success: false,
          message: 'Invalid or expired verification code',
        };
      }

      // Mark code as used
      verificationCode.markAsUsed();
      await verificationCode.save();

      return {
        success: true,
        message: 'Code verified successfully',
      };
    } catch (error) {
      logger.error('Verify code error:', error);
      return {
        success: false,
        message: 'Code verification failed. Please try again.',
      };
    }
  }

  // Reset password
  async resetPassword(data: ResetPasswordRequest): Promise<AuthResponse> {
    try {
      if (data.newPassword !== data.confirmPassword) {
        return {
          success: false,
          message: 'Passwords do not match',
        };
      }

      const user = await User.findOne({
        where: { phoneNumber: data.phoneNumber },
      });

      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      // Verify the code was used
      const verificationCode = await VerificationCode.findOne({
        where: {
          email: user.email,
          code: data.code,
          type: CodeType.PASSWORD_RESET,
          isUsed: true,
        },
      });

      if (!verificationCode) {
        return {
          success: false,
          message: 'Invalid verification code',
        };
      }

      // Update password
      user.password = data.newPassword;
      await user.save();

      logger.info(`Password reset successful for: ${data.phoneNumber}`);

      return {
        success: true,
        message: 'Password reset successful',
      };
    } catch (error) {
      logger.error('Reset password error:', error);
      return {
        success: false,
        message: 'Password reset failed. Please try again.',
      };
    }
  }

  // Change password (for authenticated users)
  async changePassword(userId: number, data: ChangePasswordRequest): Promise<AuthResponse> {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(data.currentPassword);
      if (!isCurrentPasswordValid) {
        return {
          success: false,
          message: 'Current password is incorrect',
        };
      }

      // Check if new password matches confirmation
      if (data.newPassword !== data.confirmPassword) {
        return {
          success: false,
          message: 'New passwords do not match',
        };
      }

      // Update password
      user.password = data.newPassword;
      await user.save();

      logger.info(`Password changed successfully for user: ${user.email}`);

      return {
        success: true,
        message: 'Password changed successfully',
      };
    } catch (error) {
      logger.error('Change password error:', error);
      return {
        success: false,
        message: 'Password change failed. Please try again.',
      };
    }
  }

  // Send verification code
  async sendVerificationCode(email: string, phoneNumber: string, type: CodeType): Promise<void> {
    try {
      await VerificationCode.createCode(email, phoneNumber, type);

      if (type === CodeType.PASSWORD_RESET) {
        await this.smsService.sendVerificationCode(phoneNumber);
      } else if (type === CodeType.PHONE_VERIFICATION) {
        // For phone verification, we need to get the code from the user record
        const user = await User.findOne({ where: { phoneNumber } });
        if (user && user.phoneVerificationCode) {
          await this.smsService.sendVerificationCode(phoneNumber);
        }
      }
    } catch (error) {
      logger.error('Send verification code error:', error);
      throw error;
    }
  }

  // Verify JWT token
  async verifyToken(token: string): Promise<JwtPayload | null> {
    try {
      const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
      const decoded = (jwt as any).verify(token, jwtSecret) as JwtPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  // Get user by ID
  async getUserById(userId: number): Promise<any> {
    try {
      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password'] },
      });
      return user ? user.toPublicJSON() : null;
    } catch (error) {
      logger.error('Get user by ID error:', error);
      return null;
    }
  }

  // Update user profile
  async updateUserProfile(userId: number, updateData: UpdateProfileRequest, userRole: string): Promise<AuthResponse> {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      // Check if email is being changed and if it's already taken
      // if (updateData.email !== user.email) {
      //   const existingUser = await User.findOne({
      //     where: { email: updateData.email },
      //   });
      //   if (existingUser) {
      //     return {
      //       success: false,
      //       message: 'Email address is already registered',
      //     };
      //   }
      // }

      // Check if phone number is being changed and if it's already taken
      // if (updateData.phoneNumber !== user.phoneNumber) {
      //   const existingUser = await User.findOne({
      //     where: { phoneNumber: updateData.phoneNumber },
      //   });
      //   if (existingUser) {
      //     return {
      //       success: false,
      //       message: 'Phone number is already registered',
      //     };
      //   }
      // }

      // Prepare update object - all fields are required based on the UI
      const updateObject: any = {
        fullName: updateData.fullName,
        // email: updateData.email,
        // phoneNumber: updateData.phoneNumber,
        address: updateData.location, // Map location to address field in database
        gender: updateData.gender,
        dateOfBirth: new Date(updateData.dateOfBirth),
      };

      // Add aboutYourself field for doctors
      if (userRole === UserRole.DOCTOR && updateData.aboutYourself !== undefined) {
        updateObject.aboutYourself = updateData.aboutYourself;
      }

      // console.log('updateData----------------------------->',updateData);
      
      // Handle profile image upload if provided
      if (updateData.profileImage) {
        // Store the file path in the database
        // updateObject.profileImage = updateData.profileImage.filename;
        updateObject.profileImage = `uploads/${updateData?.profileImage?.filename}`;
      }
      // console.log('updateObject----------------------------->',updateObject);


      // Update the user
      await user.update(updateObject);

      // Return updated user data (without password)
      const updatedUser = await User.findByPk(userId, {
        attributes: { exclude: ['password'] },
      });

      return {
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: updatedUser ? updatedUser.toPublicJSON() : null,
        },
      };
    } catch (error) {
      logger.error('Update user profile error:', error);
      return {
        success: false,
        message: 'Failed to update profile. Please try again.',
      };
    }
  }

  // Refresh token
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const refreshSecret = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret';
      const decoded = (jwt as any).verify(refreshToken, refreshSecret) as JwtPayload;

      if (decoded.type !== 'refresh') {
        return {
          success: false,
          message: 'Invalid refresh token',
        };
      }

      const user = await User.findByPk(decoded.userId);
      if (!user || !user.isActive) {
        return {
          success: false,
          message: 'User not found or inactive',
        };
      }

      const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(
        user.id,
        user.email,
        user.role
      );

      return {
        success: true,
        message: 'Token refreshed successfully',
        data: {
          user: user.toPublicJSON(),
          token: accessToken,
          refreshToken: newRefreshToken,
        },
      };
    } catch (error) {
      logger.error('Refresh token error:', error);
      return {
        success: false,
        message: 'Token refresh failed',
      };
    }
  }

  // Phone verification
  async verifyPhone(phoneNumber: string, code: string): Promise<AuthResponse> {
    try {
      const user = await User.findOne({
        where: { phoneNumber },
      });

      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      if (user.isPhoneVerified) {
        return {
          success: false,
          message: 'Phone number is already verified',
        };
      }

      if (user.phoneVerificationCode !== code) {
        return {
          success: false,
          message: 'Invalid verification code',
        };
      }

      if (user.phoneVerificationExpires && OTPHelper.isExpired(user.phoneVerificationExpires, 10)) {
        return {
          success: false,
          message: 'Verification code has expired',
        };
      }

      // Mark phone as verified
      user.isPhoneVerified = true;
      user.phoneVerificationCode = null;
      user.phoneVerificationExpires = null;
      await user.save();

      // Generate tokens
      const { accessToken, refreshToken } = this.generateTokens(
        user.id,
        user.email,
        user.role
      );

      return {
        success: true,
        message: 'Phone number verified successfully',
        data: {
          user: user.toPublicJSON(),
          token: accessToken,
          refreshToken,
        },
      };
    } catch (error) {
      logger.error('Phone verification error:', error);
      return {
        success: false,
        message: 'Phone verification failed',
      };
    }
  }

  // Resend phone verification
  async resendPhoneVerification(phoneNumber: string): Promise<AuthResponse> {
    try {
      const user = await User.findOne({
        where: { phoneNumber },
      });

      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      if (user.isPhoneVerified) {
        return {
          success: false,
          message: 'Phone number is already verified',
        };
      }

      // Generate new verification code using OTP helper
      const phoneVerificationCode = OTPHelper.generateOTP();
      const phoneVerificationExpires = OTPHelper.generateExpiryTime(10); // 10 minutes

      user.phoneVerificationCode = phoneVerificationCode;
      user.phoneVerificationExpires = phoneVerificationExpires;
      await user.save();

      // Send new verification SMS
      await this.smsService.sendVerificationCode(phoneNumber);

      return {
        success: true,
        message: 'Verification SMS sent successfully',
      };
    } catch (error) {
      logger.error('Resend phone verification error:', error);
      return {
        success: false,
        message: 'Failed to send verification SMS',
      };
    }
  }

  // Resend OTP for forgot password
  async resendOTP(phoneNumber: string): Promise<AuthResponse> {
    try {
      const user = await User.findOne({
        where: { phoneNumber },
      });

      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      // Send new OTP
      await this.sendVerificationCode(user.email, phoneNumber, CodeType.PASSWORD_RESET);

      return {
        success: true,
        message: 'OTP sent successfully',
      };
    } catch (error) {
      logger.error('Resend OTP error:', error);
      return {
        success: false,
        message: 'Failed to send OTP',
      };
    }
  }

  // Get users by role for chat testing
  async getUsersByRole(role: string): Promise<{ success: boolean; message: string; data: any[] }> {
    try {
      const users = await User.findAll({
        where: {
          role: role as UserRole,
          isActive: true
        },
        attributes: ['id', 'fullName', 'email', 'phoneNumber', 'role', 'profileImage'],
        order: [['fullName', 'ASC']]
      });

      return {
        success: true,
        message: `${role}s retrieved successfully`,
        data: users.map((u) => u.toPublicJSON())
      };
    } catch (error) {
      logger.error('Error getting users by role:', error);
      return {
        success: false,
        message: 'Failed to retrieve users',
        data: []
      };
    }
  }

  // Generate token for specific user
  async generateTokenForUser(userId: number): Promise<AuthResponse> {
    try {
      const user = await User.findByPk(userId);

      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      if (!user.isActive) {
        return {
          success: false,
          message: 'User account is not active'
        };
      }

      // Generate JWT token
      const { accessToken } = this.generateTokens(user.id, user.email, user.role);

      return {
        success: true,
        message: 'Token generated successfully',
        data: {
          token: accessToken,
          user: user.toPublicJSON()
        }
      };
    } catch (error) {
      logger.error('Error generating token for user:', error);
      return {
        success: false,
        message: 'Failed to generate token'
      };
    }
  }
} 