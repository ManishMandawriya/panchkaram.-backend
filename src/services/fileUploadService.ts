import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger';
import { UPLOAD_PATH, MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from '../config/env';

export class FileUploadService {
  private uploadPath: string;
  private maxFileSize: number;
  private allowedFileTypes: string[];

  constructor() {
    this.uploadPath = UPLOAD_PATH;
    this.maxFileSize = MAX_FILE_SIZE;
    this.allowedFileTypes = ALLOWED_FILE_TYPES.split(',').map(type => type.trim());
    
    // Create upload directory if it doesn't exist
    this.ensureUploadDirectory();
  }

  private ensureUploadDirectory(): void {
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  private getFileExtension(filename: string): string {
    return path.extname(filename).toLowerCase();
  }

  private isFileTypeAllowed(filename: string): boolean {
    const extension = this.getFileExtension(filename);
    const extensionWithoutDot = extension.substring(1).toLowerCase();
    
    // Check if the extension is in the allowed types
    return this.allowedFileTypes.some(allowedType => {
      // Handle both MIME types and file extensions
      if (allowedType.startsWith('.')) {
        // It's a file extension
        return allowedType.substring(1).toLowerCase() === extensionWithoutDot;
      } else if (allowedType.includes('/')) {
        // It's a MIME type, map to common extensions
        const mimeToExtension: { [key: string]: string[] } = {
          'image/jpeg': ['jpg', 'jpeg'],
          'image/png': ['png'],
          'image/gif': ['gif'],
          'image/webp': ['webp'],
          'image/bmp': ['bmp'],
          'image/tiff': ['tiff', 'tif'],
          'image/svg+xml': ['svg'],
          'image/heic': ['heic'],
          'image/heif': ['heif'],
          'application/pdf': ['pdf'],
          'application/msword': ['doc'],
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx']
        };
        
        const allowedExtensions = mimeToExtension[allowedType] || [];
        return allowedExtensions.includes(extensionWithoutDot);
      }
      return false;
    });
  }

  private getAllowedExtensions(): string[] {
    const extensions: string[] = [];
    
    this.allowedFileTypes.forEach(allowedType => {
      if (allowedType.startsWith('.')) {
        extensions.push(allowedType);
      } else if (allowedType.includes('/')) {
        // It's a MIME type, map to common extensions
        const mimeToExtension: { [key: string]: string[] } = {
          'image/jpeg': ['.jpg', '.jpeg'],
          'image/png': ['.png'],
          'image/gif': ['.gif'],
          'image/webp': ['.webp'],
          'image/bmp': ['.bmp'],
          'image/tiff': ['.tiff', '.tif'],
          'image/svg+xml': ['.svg'],
          'image/heic': ['.heic'],
          'image/heif': ['.heif'],
          'application/pdf': ['.pdf'],
          'application/msword': ['.doc'],
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
        };
        
        const allowedExtensions = mimeToExtension[allowedType] || [];
        extensions.push(...allowedExtensions);
      }
    });
    
    return [...new Set(extensions)]; // Remove duplicates
  }

  private generateUniqueFilename(originalname: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = this.getFileExtension(originalname);
    return `${timestamp}_${randomString}${extension}`;
  }

  // Configure multer for single file upload
  getSingleUploadMiddleware(fieldName: string = 'document') {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, this.uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueFilename = this.generateUniqueFilename(file.originalname);
        cb(null, uniqueFilename);
      },
    });

    const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
      if (!this.isFileTypeAllowed(file.originalname)) {
        const allowedExtensions = this.getAllowedExtensions();
        cb(new Error(`File type not allowed. Allowed file extensions: ${allowedExtensions.join(', ')}`));
        return;
      }
      cb(null, true);
    };

    return multer({
      storage,
      fileFilter,
      limits: {
        fileSize: this.maxFileSize,
      },
    }).single(fieldName);
  }

  // Configure multer for multiple file uploads
  getMultipleUploadMiddleware(fieldName: string = 'documents', maxCount: number = 5) {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, this.uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueFilename = this.generateUniqueFilename(file.originalname);
        cb(null, uniqueFilename);
      },
    });

    const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
      if (!this.isFileTypeAllowed(file.originalname)) {
        const allowedExtensions = this.getAllowedExtensions();
        cb(new Error(`File type not allowed. Allowed file extensions: ${allowedExtensions.join(', ')}`));
        return;
      }
      cb(null, true);
    };

    return multer({
      storage,
      fileFilter,
      limits: {
        fileSize: this.maxFileSize,
        files: maxCount,
      },
    }).array(fieldName, maxCount);
  }

  // Upload single file
  async uploadSingleFile(file: Express.Multer.File): Promise<string> {
    try {
      if (!file) {
        throw new Error('No file provided');
      }

      if (!this.isFileTypeAllowed(file.originalname)) {
        const allowedExtensions = this.getAllowedExtensions();
        throw new Error(`File type not allowed. Allowed file extensions: ${allowedExtensions.join(', ')}`);
      }

      const uniqueFilename = this.generateUniqueFilename(file.originalname);
      const filePath = path.join(this.uploadPath, uniqueFilename);

      // Move file to destination
      fs.renameSync(file.path, filePath);

      logger.info(`File uploaded successfully: ${uniqueFilename}`);
      return uniqueFilename;
    } catch (error) {
      logger.error('File upload failed:', error);
      throw error;
    }
  }

  // Upload multiple files
  async uploadMultipleFiles(files: Express.Multer.File[]): Promise<string[]> {
    try {
      if (!files || files.length === 0) {
        throw new Error('No files provided');
      }

      const uploadedFiles: string[] = [];

      for (const file of files) {
        if (!this.isFileTypeAllowed(file.originalname)) {
          const allowedExtensions = this.getAllowedExtensions();
          throw new Error(`File type not allowed: ${file.originalname}. Allowed file extensions: ${allowedExtensions.join(', ')}`);
        }

        const uniqueFilename = this.generateUniqueFilename(file.originalname);
        const filePath = path.join(this.uploadPath, uniqueFilename);

        // Move file to destination
        fs.renameSync(file.path, filePath);
        uploadedFiles.push(uniqueFilename);

        logger.info(`File uploaded successfully: ${uniqueFilename}`);
      }

      return uploadedFiles;
    } catch (error) {
      logger.error('Multiple file upload failed:', error);
      throw error;
    }
  }

  // Delete file
  async deleteFile(filename: string): Promise<void> {
    try {
      const filePath = path.join(this.uploadPath, filename);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info(`File deleted successfully: ${filename}`);
      } else {
        logger.warn(`File not found for deletion: ${filename}`);
      }
    } catch (error) {
      logger.error('File deletion failed:', error);
      throw error;
    }
  }

  // Get file URL
  getFileUrl(filename: string): string {
    return `/uploads/${filename}`;
  }

  // Validate file
  validateFile(file: Express.Multer.File): { isValid: boolean; error?: string } {
    if (!file) {
      return { isValid: false, error: 'No file provided' };
    }

    if (file.size > this.maxFileSize) {
      return { 
        isValid: false, 
        error: `File size exceeds limit. Maximum size: ${this.maxFileSize / 1024 / 1024}MB` 
      };
    }

    if (!this.isFileTypeAllowed(file.originalname)) {
      return { 
        isValid: false, 
        error: `File type not allowed. Allowed types: ${this.allowedFileTypes.join(', ')}` 
      };
    }

    return { isValid: true };
  }
} 