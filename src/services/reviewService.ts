import { Review } from '../models/Review';
import { User } from '../models/User';
import { UserRole } from '../types/auth';
import { 
  CreateReviewRequest, 
  UpdateReviewRequest, 
  ReviewFilters, 
  ReviewStatistics,
  ReviewWithUserDetails 
} from '../types/review';
import { logger } from '../utils/logger';
import { Op } from 'sequelize';

export class ReviewService {
  // Create a new review
  async createReview(patientId: number, reviewData: CreateReviewRequest) {
    try {
      // Check if doctor exists and is approved
      const doctor = await User.findOne({
        where: {
          id: reviewData.doctorId,
          role: UserRole.DOCTOR,
          isActive: true,
          isApproved: true,
        },
      });

      if (!doctor) {
        return {
          success: false,
          message: 'Doctor not found or not approved',
        };
      }

      // Check if patient has already reviewed this doctor
      const existingReview = await Review.findOne({
        where: {
          patientId,
          doctorId: reviewData.doctorId,
          isActive: true,
        },
      });

      if (existingReview) {
        return {
          success: false,
          message: 'You have already reviewed this doctor',
        };
      }

      const review = await Review.create({
        patientId,
        doctorId: reviewData.doctorId,
        rating: reviewData.rating,
        comment: reviewData.comment,
        isRecommended: reviewData.isRecommended,
        isActive: true,
      });

      return {
        success: true,
        message: 'Review created successfully',
        data: { review },
      };
    } catch (error) {
      logger.error('Create review service error:', error);
      return {
        success: false,
        message: 'Failed to create review',
      };
    }
  }

  // Get reviews with filters and pagination
  async getReviews(filters: ReviewFilters = {}) {
    try {
      const {
        doctorId,
        patientId,
        rating,
        isRecommended,
        startDate,
        endDate,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
      } = filters;

      const whereClause: any = {
        isActive: true,
      };

      if (doctorId) whereClause.doctorId = doctorId;
      if (patientId) whereClause.patientId = patientId;
      if (rating) whereClause.rating = rating;
      if (isRecommended !== undefined) whereClause.isRecommended = isRecommended;

      if (startDate || endDate) {
        whereClause.createdAt = {};
        if (startDate) whereClause.createdAt[Op.gte] = startDate;
        if (endDate) whereClause.createdAt[Op.lte] = endDate;
      }

      const offset = (page - 1) * limit;

      const { count, rows } = await Review.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'patient',
            attributes: ['id', 'fullName', 'profileImage'],
            where: { isActive: true },
            required: true,
          },
          {
            model: User,
            as: 'doctor',
            attributes: ['id', 'fullName', 'doctorId', 'departmentId', 'specialization', 'profileImage'],
            where: { isActive: true, isApproved: true },
            required: true,
          },
        ],
        order: [[sortBy, sortOrder]],
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
            currentPage: page,
            totalPages,
            totalItems: count,
            itemsPerPage: limit,
          },
        },
      };
    } catch (error) {
      logger.error('Get reviews service error:', error);
      return {
        success: false,
        message: 'Failed to retrieve reviews',
      };
    }
  }

  // Get review by ID
  async getReviewById(id: number) {
    try {
      const review = await Review.findOne({
        where: { id, isActive: true },
        include: [
          {
            model: User,
            as: 'patient',
            attributes: ['id', 'fullName', 'profileImage'],
            where: { isActive: true },
            required: true,
          },
          {
            model: User,
            as: 'doctor',
            attributes: ['id', 'fullName', 'doctorId', 'departmentId', 'specialization', 'profileImage'],
            where: { isActive: true, isApproved: true },
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
        data: { review },
      };
    } catch (error) {
      logger.error('Get review by ID service error:', error);
      return {
        success: false,
        message: 'Failed to retrieve review',
      };
    }
  }

  // Update review
  async updateReview(id: number, patientId: number, updateData: UpdateReviewRequest) {
    try {
      const review = await Review.findOne({
        where: { id, patientId, isActive: true },
      });

      if (!review) {
        return {
          success: false,
          message: 'Review not found or you are not authorized to update it',
        };
      }

      await review.update(updateData);

      return {
        success: true,
        message: 'Review updated successfully',
        data: { review },
      };
    } catch (error) {
      logger.error('Update review service error:', error);
      return {
        success: false,
        message: 'Failed to update review',
      };
    }
  }

  // Delete review (soft delete)
  async deleteReview(id: number, patientId: number) {
    try {
      const review = await Review.findOne({
        where: { id, patientId, isActive: true },
      });

      if (!review) {
        return {
          success: false,
          message: 'Review not found or you are not authorized to delete it',
        };
      }

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
  async getReviewStatistics(doctorId?: number) {
    try {
      const whereClause: any = { isActive: true };
      if (doctorId) whereClause.doctorId = doctorId;

      // Get current period statistics (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const currentStats = await Review.findAll({
        where: {
          ...whereClause,
          createdAt: { [Op.gte]: sevenDaysAgo },
        },
        attributes: [
          [Review.sequelize.fn('COUNT', Review.sequelize.col('id')), 'totalReviews'],
          [Review.sequelize.fn('COUNT', Review.sequelize.literal('CASE WHEN rating >= 4 THEN 1 END')), 'positiveReviews'],
          [Review.sequelize.fn('COUNT', Review.sequelize.literal('CASE WHEN rating <= 2 THEN 1 END')), 'negativeReviews'],
          [Review.sequelize.fn('AVG', Review.sequelize.col('rating')), 'averageRating'],
        ],
        raw: true,
      });

      // Get previous period statistics (7 days before that)
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

      const previousStats = await Review.findAll({
        where: {
          ...whereClause,
          createdAt: {
            [Op.between]: [fourteenDaysAgo, sevenDaysAgo],
          },
        },
        attributes: [
          [Review.sequelize.fn('COUNT', Review.sequelize.literal('CASE WHEN rating >= 4 THEN 1 END')), 'positiveReviews'],
          [Review.sequelize.fn('COUNT', Review.sequelize.literal('CASE WHEN rating <= 2 THEN 1 END')), 'negativeReviews'],
        ],
        raw: true,
      });

          const current = currentStats[0] as any || { totalReviews: 0, positiveReviews: 0, negativeReviews: 0, averageRating: 0 };
      const previous = previousStats[0] as any || { positiveReviews: 0, negativeReviews: 0 };

      const totalReviews = parseInt(current.totalReviews as string) || 0;
      const positiveReviews = parseInt(current.positiveReviews as string) || 0;
      const negativeReviews = parseInt(current.negativeReviews as string) || 0;
      const averageRating = parseFloat(current.averageRating as string) || 0;

      const positivePercentage = totalReviews > 0 ? (positiveReviews / totalReviews) * 100 : 0;
      const negativePercentage = totalReviews > 0 ? (negativeReviews / totalReviews) * 100 : 0;

      const previousPositive = parseInt(previous.positiveReviews as string) || 0;
      const previousNegative = parseInt(previous.negativeReviews as string) || 0;

      const positiveChange = previousPositive > 0 ? ((positiveReviews - previousPositive) / previousPositive) * 100 : 0;
      const negativeChange = previousNegative > 0 ? ((negativeReviews - previousNegative) / previousNegative) * 100 : 0;

      const statistics: ReviewStatistics = {
        totalReviews,
        positiveReviews,
        negativeReviews,
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
        positivePercentage: Math.round(positivePercentage * 10) / 10,
        negativePercentage: Math.round(negativePercentage * 10) / 10,
        positiveChange: Math.round(positiveChange * 10) / 10,
        negativeChange: Math.round(negativeChange * 10) / 10,
      };

      return {
        success: true,
        message: 'Review statistics retrieved successfully',
        data: { statistics },
      };
    } catch (error) {
      logger.error('Get review statistics service error:', error);
      return {
        success: false,
        message: 'Failed to retrieve review statistics',
      };
    }
  }

  // Get reviews by doctor
  async getReviewsByDoctor(doctorId: number, page = 1, limit = 10) {
    return this.getReviews({ doctorId, page, limit });
  }

  // Get reviews by patient
  async getReviewsByPatient(patientId: number, page = 1, limit = 10) {
    return this.getReviews({ patientId, page, limit });
  }
} 