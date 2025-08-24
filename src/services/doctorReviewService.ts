import { Review } from '../models/Review';
import { User } from '../models/User';
import { logger } from '../utils/logger';
import { Op } from 'sequelize';

interface ReviewFilters {
  page?: number;
  limit?: number;
  rating?: number;
  sortBy?: 'createdAt' | 'rating';
  sortOrder?: 'ASC' | 'DESC';
}

export class DoctorReviewService {
  // Get doctor's reviews with filters
  async getDoctorReviews(doctorId: number, filters: ReviewFilters) {
    try {
      const whereClause: any = {
        doctorId,
        isActive: true,
      };

      // Apply rating filter
      if (filters.rating) {
        whereClause.rating = filters.rating;
      }

      const offset = ((filters.page || 1) - 1) * (filters.limit || 10);
      const limit = filters.limit || 10;

      // Determine sort order
      let orderClause: any[] = [];
      if (filters.sortBy === 'rating') {
        orderClause = [['rating', filters.sortOrder || 'DESC']];
      } else {
        // Default: createdAt
        orderClause = [['createdAt', filters.sortOrder || 'DESC']];
      }

      const { count, rows } = await Review.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'patient',
            attributes: ['id', 'fullName', 'email', 'phoneNumber'],
            where: { isActive: true },
            required: true,
          },
        ],
        order: orderClause,
        limit,
        offset,
      });

      const totalPages = Math.ceil(count / limit);

      return {
        success: true,
        message: 'Reviews retrieved successfully',
        data: {
          reviews: rows,
          pagination: {
            currentPage: filters.page || 1,
            totalPages,
            totalItems: count,
            itemsPerPage: limit,
          },
        },
      };
    } catch (error) {
      logger.error('Get doctor reviews service error:', error);
      return {
        success: false,
        message: 'Failed to retrieve reviews',
      };
    }
  }

  // Get specific review by ID
  async getReviewById(doctorId: number, reviewId: number) {
    try {
      const review = await Review.findOne({
        where: {
          id: reviewId,
          doctorId,
          isActive: true,
        },
        include: [
          {
            model: User,
            as: 'patient',
            attributes: ['id', 'fullName', 'email', 'phoneNumber'],
            where: { isActive: true },
            required: true,
          },
        ],
      });

      if (!review) {
        return {
          success: false,
          message: 'Review not found',
        };
      }

      return {
        success: true,
        message: 'Review retrieved successfully',
        data: {
          review,
        },
      };
    } catch (error) {
      logger.error('Get review by ID service error:', error);
      return {
        success: false,
        message: 'Failed to retrieve review',
      };
    }
  }

  // Delete review
  async deleteReview(doctorId: number, reviewId: number) {
    try {
      const review = await Review.findOne({
        where: {
          id: reviewId,
          doctorId,
          isActive: true,
        },
      });

      if (!review) {
        return {
          success: false,
          message: 'Review not found',
        };
      }

      // Soft delete by setting isActive to false
      await review.update({ isActive: false });

      return {
        success: true,
        message: 'Review deleted successfully',
      };
    } catch (error) {
      logger.error('Delete review service error:', error);
      return {
        success: false,
        message: 'Failed to delete review',
      };
    }
  }

  // Get review statistics
  async getReviewStatistics(doctorId: number) {
    try {
      const [
        totalReviews,
        averageRating,
        ratingDistribution,
        recentReviews,
      ] = await Promise.all([
        // Total reviews
        Review.count({
          where: {
            doctorId,
            isActive: true,
          },
        }),
        // Average rating
        Review.findOne({
          where: {
            doctorId,
            isActive: true,
          },
          attributes: [
            [Review.sequelize.fn('AVG', Review.sequelize.col('rating')), 'averageRating'],
          ],
        }),
        // Rating distribution
        Review.findAll({
          where: {
            doctorId,
            isActive: true,
          },
          attributes: [
            'rating',
            [Review.sequelize.fn('COUNT', Review.sequelize.col('id')), 'count'],
          ],
          group: ['rating'],
          order: [['rating', 'DESC']],
        }),
        // Recent reviews (last 5)
        Review.findAll({
          where: {
            doctorId,
            isActive: true,
          },
          include: [
            {
              model: User,
              as: 'patient',
              attributes: ['id', 'fullName'],
              where: { isActive: true },
              required: true,
            },
          ],
          order: [['createdAt', 'DESC']],
          limit: 5,
        }),
      ]);

      const avgRating = averageRating?.getDataValue('averageRating') || 0;
      const ratingStats = ratingDistribution.map((item) => ({
        rating: item.rating,
        count: parseInt(item.getDataValue('count')),
      }));

      return {
        success: true,
        message: 'Review statistics retrieved successfully',
        data: {
          statistics: {
            totalReviews,
            averageRating: parseFloat(avgRating.toFixed(1)),
            ratingDistribution: ratingStats,
          },
          recentReviews,
        },
      };
    } catch (error) {
      logger.error('Get review statistics service error:', error);
      return {
        success: false,
        message: 'Failed to retrieve review statistics',
      };
    }
  }
}
