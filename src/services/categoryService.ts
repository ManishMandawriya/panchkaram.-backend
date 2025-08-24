import { Category, CategoryStatus } from '../models/Category';
import { FileUploadService } from './fileUploadService';
import { logger } from '../utils/logger';

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  sortOrder?: number;
  image?: Express.Multer.File;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  sortOrder?: number;
  image?: Express.Multer.File;
  status?: CategoryStatus;
  isActive?: boolean;
}

export interface CategoryResponse {
  success: boolean;
  message: string;
  data?: {
    category?: any;
    categories?: any[];
    total?: number;
    page?: number;
    limit?: number;
  };
}

export class CategoryService {
  private fileUploadService: FileUploadService;

  constructor() {
    this.fileUploadService = new FileUploadService();
  }

  // Create category
  async createCategory(data: CreateCategoryRequest): Promise<CategoryResponse> {
    try {
      // Check if category with same name already exists
      const existingCategory = await Category.findOne({
        where: { name: data.name },
      });

      if (existingCategory) {
        return {
          success: false,
          message: 'Category with this name already exists',
        };
      }

      // Handle image upload
      let imagePath: string | undefined;
      if (data.image) {
        const uploadedFiles = await this.fileUploadService.uploadMultipleFiles([data.image]);
        imagePath = uploadedFiles[0];
      }

      const category = await Category.create({
        name: data.name,
        description: data.description,
        sortOrder: data.sortOrder || 0,
        image: imagePath,
        status: CategoryStatus.PENDING,
        isActive: true,
      });

      logger.info(`Category created successfully: ${category.name}`);

      return {
        success: true,
        message: 'Category created successfully',
        data: {
          category: category.toPublicJSON(),
        },
      };
    } catch (error) {
      logger.error('Create category error:', error);
      return {
        success: false,
        message: 'Failed to create category. Please try again.',
      };
    }
  }

  // Get all categories (admin)
  async getAllCategories(page: number = 1, limit: number = 10, search?: string): Promise<CategoryResponse> {
    try {
      const offset = (page - 1) * limit;
      const whereClause: any = {};

      if (search) {
        whereClause.name = {
          [require('sequelize').Op.iLike]: `%${search}%`,
        };
      }

      const { count, rows } = await Category.findAndCountAll({
        where: whereClause,
        order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']],
        limit,
        offset,
      });

      return {
        success: true,
        message: 'Categories retrieved successfully',
        data: {
          categories: rows.map(category => category.toPublicJSON()),
          total: count,
          page,
          limit,
        },
      };
    } catch (error) {
      logger.error('Get all categories error:', error);
      return {
        success: false,
        message: 'Failed to retrieve categories. Please try again.',
      };
    }
  }

  // Get active categories (frontend)
  async getActiveCategories(): Promise<CategoryResponse> {
    try {
      const categories = await Category.findAll({
        where: {
          status: CategoryStatus.ACTIVE,
          isActive: true,
        },
        attributes: ['id', 'name', 'image'],
        order: [['sortOrder', 'ASC'], ['name', 'ASC']],
      });

      return {
        success: true,
        message: 'Active categories retrieved successfully',
        data: {
          categories: categories.map(category => category.toPublicJSON()),
        },
      };
    } catch (error) {
      logger.error('Get active categories error:', error);
      return {
        success: false,
        message: 'Failed to retrieve active categories. Please try again.',
      };
    }
  }

  // Get category by ID
  async getCategoryById(id: number): Promise<CategoryResponse> {
    try {
      const category = await Category.findByPk(id);

      if (!category) {
        return {
          success: false,
          message: 'Category not found',
        };
      }

      return {
        success: true,
        message: 'Category retrieved successfully',
        data: {
          category: category.toPublicJSON(),
        },
      };
    } catch (error) {
      logger.error('Get category by ID error:', error);
      return {
        success: false,
        message: 'Failed to retrieve category. Please try again.',
      };
    }
  }

  // Update category
  async updateCategory(id: number, data: UpdateCategoryRequest): Promise<CategoryResponse> {
    try {
      const category = await Category.findByPk(id);

      if (!category) {
        return {
          success: false,
          message: 'Category not found',
        };
      }

      // Check if name is being updated and if it already exists
      if (data.name && data.name !== category.name) {
        const existingCategory = await Category.findOne({
          where: { name: data.name },
        });

        if (existingCategory) {
          return {
            success: false,
            message: 'Category with this name already exists',
          };
        }
      }

      // Handle image upload if new image is provided
      if (data.image) {
        const uploadedFiles = await this.fileUploadService.uploadMultipleFiles([data.image]);
        data.image = uploadedFiles[0] as any;
      }

      // Update category
      await category.update(data);

      logger.info(`Category updated successfully: ${category.name}`);

      return {
        success: true,
        message: 'Category updated successfully',
        data: {
          category: category.toPublicJSON(),
        },
      };
    } catch (error) {
      logger.error('Update category error:', error);
      return {
        success: false,
        message: 'Failed to update category. Please try again.',
      };
    }
  }

  // Change category status
  async changeCategoryStatus(id: number, status: CategoryStatus): Promise<CategoryResponse> {
    try {
      const category = await Category.findByPk(id);

      if (!category) {
        return {
          success: false,
          message: 'Category not found',
        };
      }

      await category.update({ status });

      logger.info(`Category status changed successfully: ${category.name} -> ${status}`);

      return {
        success: true,
        message: 'Category status changed successfully',
        data: {
          category: category.toPublicJSON(),
        },
      };
    } catch (error) {
      logger.error('Change category status error:', error);
      return {
        success: false,
        message: 'Failed to change category status. Please try again.',
      };
    }
  }

  // Toggle category active status
  async toggleCategoryActive(id: number): Promise<CategoryResponse> {
    try {
      const category = await Category.findByPk(id);

      if (!category) {
        return {
          success: false,
          message: 'Category not found',
        };
      }

      await category.update({ isActive: !category.isActive });

      logger.info(`Category active status toggled: ${category.name} -> ${category.isActive}`);

      return {
        success: true,
        message: 'Category active status updated successfully',
        data: {
          category: category.toPublicJSON(),
        },
      };
    } catch (error) {
      logger.error('Toggle category active error:', error);
      return {
        success: false,
        message: 'Failed to update category active status. Please try again.',
      };
    }
  }

  // Delete category
  async deleteCategory(id: number): Promise<CategoryResponse> {
    try {
      const category = await Category.findByPk(id);

      if (!category) {
        return {
          success: false,
          message: 'Category not found',
        };
      }

      await category.destroy();

      logger.info(`Category deleted successfully: ${category.name}`);

      return {
        success: true,
        message: 'Category deleted successfully',
      };
    } catch (error) {
      logger.error('Delete category error:', error);
      return {
        success: false,
        message: 'Failed to delete category. Please try again.',
      };
    }
  }
} 