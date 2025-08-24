import { Router } from 'express';
import { AuthController } from '../../controllers/api/authController';
import { authMiddleware } from '../../middleware/authMiddleware';
import { validateRequest } from '../../middleware/validateRequest';
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  verifyCodeSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
} from '../../validations/authValidation';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/register', validateRequest(registerSchema), authController.register.bind(authController));
router.post('/login', validateRequest(loginSchema), authController.login.bind(authController));
router.post('/forgot-password', validateRequest(forgotPasswordSchema), authController.forgotPassword.bind(authController));
router.post('/verify-code', validateRequest(verifyCodeSchema), authController.verifyCode.bind(authController));
router.post('/reset-password', validateRequest(resetPasswordSchema), authController.resetPassword.bind(authController));
router.post('/refresh-token', authController.refreshToken.bind(authController));

// Test routes (for development only)
router.post('/test-token', authController.generateTestToken.bind(authController));
router.get('/users/:role', authController.getUsersByRole.bind(authController));
router.post('/generate-token/:userId', authController.generateTokenForUser.bind(authController));

// Phone verification routes
router.post('/verify-phone', authController.verifyPhone.bind(authController));
router.post('/resend-phone-verification', authController.resendPhoneVerification.bind(authController));
router.post('/resend-otp', authController.resendOTP.bind(authController));

// Protected routes
router.use(authMiddleware);
router.get('/profile', authController.getProfile.bind(authController));
router.put('/profile', authController.updateProfile.bind(authController));
router.post('/change-password', validateRequest(changePasswordSchema), authController.changePassword.bind(authController));
router.post('/logout', authController.logout.bind(authController));

export default router; 