import { Service } from '../models/Service';
import { ServiceType } from '../types/service';
import { logger } from '../utils/logger';

export class ServiceService {
  // Get all active services
  async getServices() {
    try {
      const services = await Service.findAll({
        where: { isActive: true },
        order: [['price', 'ASC']],
      });

      return {
        success: true,
        message: 'Services retrieved successfully',
        data: { services },
      };
    } catch (error) {
      logger.error('Get services service error:', error);
      return {
        success: false,
        message: 'Failed to retrieve services',
      };
    }
  }

  // Get service by ID
  async getServiceById(id: number) {
    try {
      const service = await Service.findOne({
        where: { id, isActive: true },
      });

      if (!service) {
        return {
          success: false,
          message: 'Service not found',
        };
      }

      return {
        success: true,
        message: 'Service retrieved successfully',
        data: { service },
      };
    } catch (error) {
      logger.error('Get service by ID service error:', error);
      return {
        success: false,
        message: 'Failed to retrieve service',
      };
    }
  }

  // Get service by type
  async getServiceByType(type: ServiceType) {
    try {
      const service = await Service.findOne({
        where: { type, isActive: true },
      });

      if (!service) {
        return {
          success: false,
          message: 'Service not found',
        };
      }

      return {
        success: true,
        message: 'Service retrieved successfully',
        data: { service },
      };
    } catch (error) {
      logger.error('Get service by type service error:', error);
      return {
        success: false,
        message: 'Failed to retrieve service',
      };
    }
  }

  // Get service prices (for the booking screen)
  async getServicePrices() {
    try {
      const services = await Service.findAll({
        where: { isActive: true },
        order: [['price', 'ASC']],
        attributes: ['type', 'price', 'description'],
      });

      const prices = services.map(service => ({
        type: service.type,
        price: service.price,
        description: service.description,
      }));

      return {
        success: true,
        message: 'Service prices retrieved successfully',
        data: { prices },
      };
    } catch (error) {
      logger.error('Get service prices service error:', error);
      return {
        success: false,
        message: 'Failed to retrieve service prices',
      };
    }
  }

  // Initialize default services (for seeding)
  async initializeDefaultServices() {
    try {
      const defaultServices = [
        {
          name: 'Voice Call',
          description: 'Can Make a Voice Call with Doctor',
          price: 10.00,
          type: ServiceType.VOICE_CALL,
          isActive: true,
        },
        {
          name: 'Messaging',
          description: 'Can Messaging with Doctor',
          price: 6.00,
          type: ServiceType.MESSAGING,
          isActive: true,
        },
        {
          name: 'Video Call',
          description: 'Can Make a Video Call with Doctor',
          price: 14.00,
          type: ServiceType.VIDEO_CALL,
          isActive: true,
        },
      ];

      for (const serviceData of defaultServices) {
        const existingService = await Service.findOne({
          where: { type: serviceData.type },
        });

        if (!existingService) {
          await Service.create(serviceData);
        }
      }

      return {
        success: true,
        message: 'Default services initialized successfully',
      };
    } catch (error) {
      logger.error('Initialize default services service error:', error);
      return {
        success: false,
        message: 'Failed to initialize default services',
      };
    }
  }
} 