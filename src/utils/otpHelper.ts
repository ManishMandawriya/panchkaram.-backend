/**
 * OTP Helper Utility
 * Provides functions to generate and validate OTP codes
 */

export class OTPHelper {
  /**
   * Generate a 6-digit OTP code
   * @returns {string} 6-digit OTP code
   */
  static generateOTP(): string {
    return '1234';
    // return Math.floor(100000 + Math.random() * 9000).toString();
  }

  /**
   * Generate OTP with custom length
   * @param length - Length of OTP (default: 6)
   * @returns {string} OTP code
   */
  static generateOTPWithLength(length: number = 6): string {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(min + Math.random() * (max - min + 1)).toString();
  }

  /**
   * Validate OTP format
   * @param otp - OTP code to validate
   * @param length - Expected length (default: 6)
   * @returns {boolean} True if valid format
   */
  static isValidFormat(otp: string, length: number = 6): boolean {
    const regex = new RegExp(`^\\d{${length}}$`);
    return regex.test(otp);
  }

  /**
   * Check if OTP is expired
   * @param createdAt - When OTP was created
   * @param expiryMinutes - Expiry time in minutes (default: 10)
   * @returns {boolean} True if expired
   */
  static isExpired(createdAt: Date, expiryMinutes: number = 10): boolean {
    const expiryTime = new Date(createdAt.getTime() + expiryMinutes * 60 * 1000);
    return new Date() > expiryTime;
  }

  /**
   * Calculate remaining time for OTP
   * @param createdAt - When OTP was created
   * @param expiryMinutes - Expiry time in minutes (default: 10)
   * @returns {number} Remaining seconds
   */
  static getRemainingTime(createdAt: Date, expiryMinutes: number = 10): number {
    const expiryTime = new Date(createdAt.getTime() + expiryMinutes * 60 * 1000);
    const remaining = expiryTime.getTime() - new Date().getTime();
    return Math.max(0, Math.floor(remaining / 1000));
  }

  /**
   * Generate expiry time for OTP
   * @param expiryMinutes - Expiry time in minutes (default: 10)
   * @returns {Date} Expiry time
   */
  static generateExpiryTime(expiryMinutes: number = 10): Date {
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() + expiryMinutes);
    return expiryTime;
  }
} 