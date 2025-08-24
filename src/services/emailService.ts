import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger';
import { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD, EMAIL_FROM } from '../config/env';
import 'dotenv/config';

console.log('process.env.EMAIL_PORT',process.env.EMAIL_PORT);
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: EMAIL_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD,
      },
    });
  }

  private async loadTemplate(templateName: string): Promise<string> {
    const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.hbs`);
    return fs.readFileSync(templatePath, 'utf-8');
  }

  private async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      const mailOptions = {
        from: EMAIL_FROM,
        to,
        subject,
        html,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to: ${to}`);
    } catch (error) {
      logger.error('Email sending failed:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    try {
      const template = await this.loadTemplate('welcome');
      const compiledTemplate = handlebars.compile(template);
      
      const html = compiledTemplate({
        name,
        logoUrl: 'https://panchakarma.com/logo.png',
        supportEmail: 'support@panchakarma.com',
        year: new Date().getFullYear(),
      });

      await this.sendEmail(
        email,
        'Welcome to Panchakarma - Healthy Lifestyle with Ayurveda',
        html
      );
    } catch (error) {
      logger.error('Welcome email failed:', error);
      throw error;
    }
  }

  async sendVerificationEmail(email: string, verificationCode: string): Promise<void> {
    try {
      const template = await this.loadTemplate('verification');
      const compiledTemplate = handlebars.compile(template);
      
      const html = compiledTemplate({
        verificationCode,
        logoUrl: 'https://panchakarma.com/logo.png',
        supportEmail: 'support@panchakarma.com',
        year: new Date().getFullYear(),
      });

      await this.sendEmail(
        email,
        'Verify Your Email - Panchakarma',
        html
      );
    } catch (error) {
      logger.error('Verification email failed:', error);
      throw error;
    }
  }

  async sendPasswordResetEmail(email: string, resetLink: string): Promise<void> {
    try {
      const template = await this.loadTemplate('password-reset');
      const compiledTemplate = handlebars.compile(template);
      
      const html = compiledTemplate({
        resetLink,
        logoUrl: 'https://panchakarma.com/logo.png',
        supportEmail: 'support@panchakarma.com',
        year: new Date().getFullYear(),
      });

      await this.sendEmail(
        email,
        'Password Reset Request - Panchakarma',
        html
      );
    } catch (error) {
      logger.error('Password reset email failed:', error);
      throw error;
    }
  }

  async sendAccountApprovalEmail(email: string, name: string, isApproved: boolean): Promise<void> {
    try {
      const templateName = isApproved ? 'account-approved' : 'account-rejected';
      const template = await this.loadTemplate(templateName);
      const compiledTemplate = handlebars.compile(template);
      
      const html = compiledTemplate({
        name,
        isApproved,
        logoUrl: 'https://panchakarma.com/logo.png',
        supportEmail: 'support@panchakarma.com',
        year: new Date().getFullYear(),
      });

      const subject = isApproved 
        ? 'Account Approved - Panchakarma'
        : 'Account Status Update - Panchakarma';

      await this.sendEmail(email, subject, html);
    } catch (error) {
      logger.error('Account approval email failed:', error);
      throw error;
    }
  }

  async sendNotificationEmail(email: string, subject: string, message: string): Promise<void> {
    try {
      const template = await this.loadTemplate('notification');
      const compiledTemplate = handlebars.compile(template);
      
      const html = compiledTemplate({
        message,
        logoUrl: 'https://panchakarma.com/logo.png',
        supportEmail: 'support@panchakarma.com',
        year: new Date().getFullYear(),
      });

      await this.sendEmail(email, subject, html);
    } catch (error) {
      logger.error('Notification email failed:', error);
      throw error;
    }
  }
} 