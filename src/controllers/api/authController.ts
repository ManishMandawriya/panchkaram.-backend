import { Request, Response } from 'express';
import { AuthService } from '../../services/authService';
import { FileUploadService } from '../../services/fileUploadService';
import {
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyCodeRequest,
  ChangePasswordRequest,
  UpdateProfileRequest,
  UserRole,
} from '../../types/auth';
import { logger } from '../../utils/logger';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../config/env';
import { updateProfileSchema } from '../../validations/authValidation';

export class AuthController {
  private authService: AuthService;
  private fileUploadService: FileUploadService;

  constructor() {
    this.authService = new AuthService();
    this.fileUploadService = new FileUploadService();
  }

  // POST /api/auth/register
  async register(req: Request, res: Response): Promise<void> {
    try {
      const uploadMiddleware = this.fileUploadService.getMultipleUploadMiddleware('documents', 5);
      
      uploadMiddleware(req, res, async (err: any) => {
        if (err) {
          logger.error('File upload error:', err);
          res.status(400).json({
            success: false,
            message: err.message || 'File upload failed',
          });
          return;
        }

        try {
          const {
            role,
            email,
            password,
            confirmPassword,
            phoneNumber,
            fullName,
            clinicName,
            doctorId,
            departmentId,
            experience,
          } = req.body;

          // Validate required fields based on role
          if (!role || !email || !password || !phoneNumber) {
            res.status(400).json({
              success: false,
              message: 'Missing required fields',
            });
            return;
          }

          // if (password !== confirmPassword) {
          //   res.status(400).json({
          //     success: false,
          //     message: 'Passwords do not match',
          //   });
          //   return;
          // }

          // Role-specific validation
          if (role === UserRole.PATIENT && !fullName) {
            res.status(400).json({
              success: false,
              message: 'Full name is required for patients',
            });
            return;
          }

          if (role === UserRole.DOCTOR && (!fullName || !doctorId || !departmentId || !experience)) {
            res.status(400).json({
              success: false,
              message: 'Doctor ID, department ID, and experience are required for doctors',
            });
            return;
          }

          if (role === UserRole.CLINIC && (!clinicName || !doctorId || !departmentId || !experience)) {
            res.status(400).json({
              success: false,
              message: 'Clinic name, doctor ID, department ID, and experience are required for clinics',
            });
            return;
          }

          const registerData: RegisterRequest = {
            role,
            email,
            password,
            confirmPassword,
            phoneNumber,
            fullName,
            clinicName,
            doctorId,
            departmentId,
            experience,
            documents: req.files as Express.Multer.File[],
          };

          const result = await this.authService.register(registerData);
          res.status(result.success ? 201 : 400).json(result);
        } catch (error) {
          logger.error('Registration controller error:', error);
          res.status(500).json({
            success: false,
            message: 'Registration failed. Please try again.',
          });
        }
      });
    } catch (error) {
      logger.error('Registration controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed. Please try again.',
      });
    }
  }

  // POST /api/auth/login
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { phoneNumber, password }: LoginRequest = req.body;

      if (!phoneNumber || !password) {
        res.status(400).json({
          success: false,
          message: 'Phone number and password are required',
        });
        return;
      }

      const result = await this.authService.login({ phoneNumber, password });
      res.status(result.success ? 200 : 401).json(result);
    } catch (error) {
      logger.error('Login controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed. Please try again.',
      });
    }
  }

  // POST /api/auth/forgot-password
  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { phoneNumber }: ForgotPasswordRequest = req.body;

      if (!phoneNumber) {
        res.status(400).json({
          success: false,
          message: 'Phone number is required',
        });
        return;
      }

      const result = await this.authService.forgotPassword({ phoneNumber });
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Forgot password controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process forgot password request. Please try again.',
      });
    }
  }

  // POST /api/auth/verify-code
  async verifyCode(req: Request, res: Response): Promise<void> {
    try {
      const { phoneNumber, code }: VerifyCodeRequest = req.body;

      if (!phoneNumber || !code) {
        res.status(400).json({
          success: false,
          message: 'Phone number and verification code are required',
        });
        return;
      }

      const result = await this.authService.verifyCode({ phoneNumber, code });
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Verify code controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Code verification failed. Please try again.',
      });
    }
  }

  // POST /api/auth/reset-password
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { phoneNumber, code, newPassword, confirmPassword }: ResetPasswordRequest = req.body;

      if (!phoneNumber || !code || !newPassword || !confirmPassword) {
        res.status(400).json({
          success: false,
          message: 'Phone number, code, new password, and confirm password are required',
        });
        return;
      }

      if (newPassword !== confirmPassword) {
        res.status(400).json({
          success: false,
          message: 'Passwords do not match',
        });
        return;
      }

      const result = await this.authService.resetPassword({
        phoneNumber,
        code,
        newPassword,
        confirmPassword,
      });
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Reset password controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Password reset failed. Please try again.',
      });
    }
  }

  // POST /api/auth/change-password
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const { currentPassword, newPassword, confirmPassword }: ChangePasswordRequest = req.body;
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      if (!currentPassword || !newPassword || !confirmPassword) {
        res.status(400).json({
          success: false,
          message: 'Current password, new password, and confirm password are required',
        });
        return;
      }

      const result = await this.authService.changePassword(userId, {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Change password controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Password change failed. Please try again.',
      });
    }
  }

  // POST /api/auth/refresh-token
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: 'Refresh token is required',
        });
        return;
      }

      const result = await this.authService.refreshToken(refreshToken);
      res.status(result.success ? 200 : 401).json(result);
    } catch (error) {
      logger.error('Refresh token controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Token refresh failed. Please try again.',
      });
    }
  }

  // GET /api/auth/profile
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const user = await this.authService.getUserById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        data: user,
      });
    } catch (error) {
      logger.error('Get profile controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve profile. Please try again.',
      });
    }
  }

  // PUT /api/auth/profile
  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      // Use multer middleware for file upload
      const uploadMiddleware = this.fileUploadService.getSingleUploadMiddleware('profileImage');
      
      uploadMiddleware(req, res, async (err: any) => {
        if (err) {
          logger.error('File upload error:', err);
          res.status(400).json({
            success: false,
            message: err.message || 'File upload failed',
          });
          return;
        }

        try {
          // Validate the request data
          const { error } = updateProfileSchema.validate(req.body);
          if (error) {
            res.status(400).json({
              success: false,
              message: error.details[0].message,
            });
            return;
          }

          const updateData: UpdateProfileRequest = {
            ...req.body,
            profileImage: req.file, // Add the uploaded file to the request data
          };

          const result = await this.authService.updateUserProfile(userId, updateData, userRole);
          res.status(result.success ? 200 : 400).json(result);
        } catch (error) {
          logger.error('Update profile controller error:', error);
          res.status(500).json({
            success: false,
            message: 'Failed to update profile. Please try again.',
          });
        }
      });
    } catch (error) {
      logger.error('Update profile controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile. Please try again.',
      });
    }
  }

  // POST /api/auth/logout
  async logout(req: Request, res: Response): Promise<void> {
    try {
      // In a real implementation, you might want to blacklist the token
      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      logger.error('Logout controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Logout failed. Please try again.',
      });
    }
  }

  // POST /api/auth/verify-phone
  async verifyPhone(req: Request, res: Response): Promise<void> {
    try {
      const { phoneNumber, code } = req.body;

      if (!phoneNumber || !code) {
        res.status(400).json({
          success: false,
          message: 'Phone number and verification code are required',
        });
        return;
      }

      const result = await this.authService.verifyPhone(phoneNumber, code);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Phone verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Phone verification failed',
      });
    }
  }

  // POST /api/auth/resend-phone-verification
  async resendPhoneVerification(req: Request, res: Response): Promise<void> {
    try {
      const { phoneNumber } = req.body;

      if (!phoneNumber) {
        res.status(400).json({
          success: false,
          message: 'Phone number is required',
        });
        return;
      }

      const result = await this.authService.resendPhoneVerification(phoneNumber);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Resend phone verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to resend verification SMS',
      });
    }
  }

  // POST /api/auth/resend-otp
  async resendOTP(req: Request, res: Response): Promise<void> {
    try {
      const { phoneNumber } = req.body;

      if (!phoneNumber) {
        res.status(400).json({
          success: false,
          message: 'Phone number is required',
        });
        return;
      }

      const result = await this.authService.resendOTP(phoneNumber);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Resend OTP error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to resend OTP',
      });
    }
  }

  // GET /api/auth/users/:role
  async getUsersByRole(req: Request, res: Response): Promise<void> {
    try {
      const { role } = req.params;
      
      if (!role || !['patient', 'doctor'].includes(role)) {
        res.status(400).json({
          success: false,
          message: 'Valid role (patient or doctor) is required'
        });
        return;
      }

      const result = await this.authService.getUsersByRole(role);
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Get users by role controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve users'
      });
    }
  }

  // POST /api/auth/generate-token/:userId
  async generateTokenForUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      
      if (!userId || isNaN(parseInt(userId))) {
        res.status(400).json({
          success: false,
          message: 'Valid user ID is required'
        });
        return;
      }

      const result = await this.authService.generateTokenForUser(parseInt(userId));
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Generate token for user controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate token'
      });
    }
  }

  // Test endpoint for generating chat test tokens
  async generateTestToken(req: Request, res: Response) {
    try {
      const { role = 'patient', userId = 1 } = req.body;
      
      // Create a test user payload
      const testUser = {
        userId: userId,
        email: `${role}@test.com`,
        role: role,
        type: 'access'
      };

      // Generate JWT token
      const token = (jwt as any).sign(testUser, JWT_SECRET, { expiresIn: '24h' });

      res.json({
        success: true,
        message: 'Test token generated successfully',
        data: {
          token,
          user: testUser
        }
      });
    } catch (error) {
      logger.error('Error generating test token:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate test token'
      });
    }
  }
} 