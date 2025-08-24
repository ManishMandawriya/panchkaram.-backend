import { Request, Response } from 'express';
import { Banner } from '../../models/Banner';
import { logger } from '../../utils/logger';
import { Op } from 'sequelize';

export class BannerController {
  // GET /api/banners - Get all active banners for frontend
  static async getBanners(req: Request, res: Response): Promise<void> {
    try {
      const { 
        includeInactive = false,
        limit = 10,
        page = 1 
      } = req.query;

      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      
      // Build where clause
      const whereClause: any = {};
      
      if (!includeInactive || includeInactive === 'false') {
        whereClause.isActive = true;
        
        // Also check date range if specified
        const now = new Date();
        whereClause[Op.and] = [
          {
            [Op.or]: [
              { startDate: null },
              { startDate: { [Op.lte]: now } }
            ]
          },
          {
            [Op.or]: [
              { endDate: null },
              { endDate: { [Op.gte]: now } }
            ]
          }
        ];
      }

      const banners = await Banner.findAll({
        where: whereClause,
        order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']],
        limit: parseInt(limit as string),
        offset: offset,
        attributes: [
          'id',
          'title',
          'slug',
          'image',
          'description',
          'linkUrl',
          'sortOrder',
          'isActive',
          'startDate',
          'endDate',
          'createdAt'
        ],
      });

      // Get total count for pagination
      const totalCount = await Banner.count({ where: whereClause });

      res.status(200).json({
        success: true,
        message: 'Banners retrieved successfully',
        data: {
          banners,
          pagination: {
            currentPage: parseInt(page as string),
            totalPages: Math.ceil(totalCount / parseInt(limit as string)),
            totalCount,
            limit: parseInt(limit as string),
          },
        },
      });
    } catch (error) {
      logger.error('Get banners controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve banners. Please try again.',
      });
    }
  }

  // GET /api/banners/:slug - Get banner by slug
  static async getBannerBySlug(req: Request, res: Response): Promise<void> {
    try {
      const { slug } = req.params;

      const banner = await Banner.findOne({
        where: {
          slug,
          isActive: true,
        },
      });

      if (!banner) {
        res.status(404).json({
          success: false,
          message: 'Banner not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Banner retrieved successfully',
        data: { banner },
      });
    } catch (error) {
      logger.error('Get banner by slug controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve banner. Please try again.',
      });
    }
  }

  // POST /api/banners - Create new banner (admin only)
  static async createBanner(req: Request, res: Response): Promise<void> {
    try {
      const {
        title,
        slug,
        image,
        description,
        linkUrl,
        sortOrder = 0,
        isActive = true,
        startDate,
        endDate,
      } = req.body;

      // Check if slug already exists
      const existingBanner = await Banner.findOne({ where: { slug } });
      if (existingBanner) {
        res.status(400).json({
          success: false,
          message: 'Banner with this slug already exists',
        });
        return;
      }

      const banner = await Banner.create({
        title,
        slug,
        image,
        description,
        linkUrl,
        sortOrder,
        isActive,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      });

      res.status(201).json({
        success: true,
        message: 'Banner created successfully',
        data: { banner },
      });
    } catch (error) {
      logger.error('Create banner controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create banner. Please try again.',
      });
    }
  }

  // PUT /api/banners/:id - Update banner (admin only)
  static async updateBanner(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        title,
        slug,
        image,
        description,
        linkUrl,
        sortOrder,
        isActive,
        startDate,
        endDate,
      } = req.body;

      const banner = await Banner.findByPk(id);
      if (!banner) {
        res.status(404).json({
          success: false,
          message: 'Banner not found',
        });
        return;
      }

      // Check if slug already exists (excluding current banner)
      if (slug && slug !== banner.slug) {
        const existingBanner = await Banner.findOne({ 
          where: { 
            slug,
            id: { [Op.ne]: id }
          } 
        });
        if (existingBanner) {
          res.status(400).json({
            success: false,
            message: 'Banner with this slug already exists',
          });
          return;
        }
      }

      await banner.update({
        title: title || banner.title,
        slug: slug || banner.slug,
        image: image || banner.image,
        description: description !== undefined ? description : banner.description,
        linkUrl: linkUrl !== undefined ? linkUrl : banner.linkUrl,
        sortOrder: sortOrder !== undefined ? sortOrder : banner.sortOrder,
        isActive: isActive !== undefined ? isActive : banner.isActive,
        startDate: startDate !== undefined ? (startDate ? new Date(startDate) : null) : banner.startDate,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : banner.endDate,
      });

      res.status(200).json({
        success: true,
        message: 'Banner updated successfully',
        data: { banner },
      });
    } catch (error) {
      logger.error('Update banner controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update banner. Please try again.',
      });
    }
  }

  // DELETE /api/banners/:id - Delete banner (admin only)
  static async deleteBanner(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const banner = await Banner.findByPk(id);
      if (!banner) {
        res.status(404).json({
          success: false,
          message: 'Banner not found',
        });
        return;
      }

      await banner.destroy();

      res.status(200).json({
        success: true,
        message: 'Banner deleted successfully',
      });
    } catch (error) {
      logger.error('Delete banner controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete banner. Please try again.',
      });
    }
  }
}