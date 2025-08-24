import { Request, Response } from 'express';
import { DoctorService, ServiceType } from '../../models/DoctorService';
import { DoctorAvailability, DayOfWeek } from '../../models/DoctorAvailability';
import { User } from '../../models/User';
import { Category } from '../../models/Category';
import { UserRole } from '../../types/auth';
import { logger } from '../../utils/logger';

export class DoctorServiceController {
  // Get doctor services and pricing
  static async getDoctorServices(req: Request, res: Response) {
    try {
      const { doctorId } = req.params;

      const doctor = await User.findOne({
        where: { id: doctorId, role: UserRole.DOCTOR },
        include: [
          {
            model: DoctorService,
            as: 'doctorServices',
          },
        ],
      });

      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found',
        });
      }

      const services = doctor.doctorServices ? doctor.doctorServices.getServicesObject() : {
        chat: { price: 0, isEnabled: false, duration: 30, description: null },
        audioCall: { price: 0, isEnabled: false, duration: 30, description: null },
        videoCall: { price: 0, isEnabled: false, duration: 30, description: null },
      };

      return res.status(200).json({
        success: true,
        message: 'Doctor services retrieved successfully',
        data: {
          doctorId: doctor.id,
          doctorName: doctor.fullName,
          services: services,
        },
      });
    } catch (error) {
      logger.error('Get doctor services error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve doctor services',
      });
    }
  }

  // Update doctor services and pricing
  static async updateDoctorServices(req: Request, res: Response) {
    try {
      const { doctorId } = req.params;
      const { chat, audioCall, videoCall } = req.body;

      // Verify doctor exists
      const doctor = await User.findOne({
        where: { id: doctorId, role: UserRole.DOCTOR },
      });

      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found',
        });
      }

      // Prepare update data
      const updateData: any = { doctorId: parseInt(doctorId) };

      if (chat) {
        updateData.chatPrice = chat.price || 0;
        updateData.chatEnabled = chat.isEnabled !== undefined ? chat.isEnabled : true;
        updateData.chatDuration = chat.duration || 30;
        updateData.chatDescription = chat.description || null;
      }

      if (audioCall) {
        updateData.audioPrice = audioCall.price || 0;
        updateData.audioEnabled = audioCall.isEnabled !== undefined ? audioCall.isEnabled : true;
        updateData.audioDuration = audioCall.duration || 30;
        updateData.audioDescription = audioCall.description || null;
      }

      if (videoCall) {
        updateData.videoPrice = videoCall.price || 0;
        updateData.videoEnabled = videoCall.isEnabled !== undefined ? videoCall.isEnabled : true;
        updateData.videoDuration = videoCall.duration || 30;
        updateData.videoDescription = videoCall.description || null;
      }

      // Update or create single service record
      const [serviceRecord] = await DoctorService.upsert(updateData);

      return res.status(200).json({
        success: true,
        message: 'Doctor services updated successfully',
        data: serviceRecord.getServicesObject(),
      });
    } catch (error) {
      logger.error('Update doctor services error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update doctor services',
      });
    }
  }

  // Get doctor availability
  static async getDoctorAvailability(req: Request, res: Response) {
    try {
      const { doctorId } = req.params;

      const doctor = await User.findOne({
        where: { id: doctorId, role: UserRole.DOCTOR },
        include: [
          {
            model: DoctorAvailability,
            as: 'doctorAvailability',
          },
        ],
      });

      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Doctor availability retrieved successfully',
        data: {
          doctorId: doctor.id,
          doctorName: doctor.fullName,
          availability: doctor.doctorAvailability,
        },
      });
    } catch (error) {
      logger.error('Get doctor availability error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve doctor availability',
      });
    }
  }

  // Update doctor availability
  static async updateDoctorAvailability(req: Request, res: Response) {
    try {
      const { doctorId } = req.params;
      const { availability } = req.body;

      // Verify doctor exists
      const doctor = await User.findOne({
        where: { id: doctorId, role: UserRole.DOCTOR },
      });

      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found',
        });
      }

      // Update or create availability
      for (const availabilityData of availability) {
        const { dayOfWeek, startTime, endTime, isAvailable, slotDuration, breakTime } = availabilityData;

        await DoctorAvailability.upsert({
          doctorId: parseInt(doctorId),
          dayOfWeek,
          startTime,
          endTime,
          isAvailable,
          slotDuration,
          breakTime,
        });
      }

      // Get updated availability
      const updatedAvailability = await DoctorAvailability.findAll({
        where: { doctorId },
      });

      return res.status(200).json({
        success: true,
        message: 'Doctor availability updated successfully',
        data: updatedAvailability,
      });
    } catch (error) {
      logger.error('Update doctor availability error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update doctor availability',
      });
    }
  }

  // Get doctor profile with services and availability (for user view)
  static async getDoctorProfile(req: Request, res: Response) {
    try {
      const { doctorId } = req.params;

      const doctor = await User.findOne({
        where: { id: doctorId, role: UserRole.DOCTOR, isActive: true, isApproved: true },
        include: [
          {
            model: DoctorService,
            as: 'doctorServices',
            required: false,
          },
          {
            model: DoctorAvailability,
            as: 'doctorAvailability',
            where: { isAvailable: true },
            required: false,
          },
          {
            model: Category,
            as: 'department',
            required: false,
            attributes: ['id', 'name', 'description'],
          },
        ],
        attributes: [
          'id',
          'fullName',
          'doctorId',
          'departmentId',
          'experience',
          'qualifications',
          'specialization',
          'aboutYourself',
          'degrees',
          'specializations',
          'rating',
          'profileImage',
        ],
      });

      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found or not available',
        });
      }

      // Format services for easy consumption from single record
      const doctorServicesRecord = doctor.doctorServices;
      const services = doctorServicesRecord ? doctorServicesRecord.getServicesObject() : {
        chat: { price: 0, isEnabled: false, duration: 30, description: null },
        audioCall: { price: 0, isEnabled: false, duration: 30, description: null },
        videoCall: { price: 0, isEnabled: false, duration: 30, description: null },
      };

      // Format availability by day
      const availability = doctor.doctorAvailability?.reduce((acc: any, slot) => {
        acc[slot.dayOfWeek] = {
          startTime: slot.startTime,
          endTime: slot.endTime,
          slotDuration: slot.slotDuration,
          breakTime: slot.breakTime,
        };
        return acc;
      }, {});

      return res.status(200).json({
        success: true,
        message: 'Doctor profile retrieved successfully',
        data: {
          doctor: {
            id: doctor.id,
            fullName: doctor.fullName,
            doctorId: doctor.doctorId,
            departmentId: doctor.departmentId,
            department: doctor.department ? {
              id: doctor.department.id,
              name: doctor.department.name,
              description: doctor.department.description,
            } : null,
            experience: doctor.experience,
            qualifications: doctor.qualifications,
            specialization: doctor.specialization,
            aboutYourself: doctor.aboutYourself,
            degrees: doctor.degrees || [],
            specializations: doctor.specializations || [],
            rating: doctor.rating,
            profileImage: doctor.profileImage,
          },
          services,
          availability,
        },
      });
    } catch (error) {
      logger.error('Get doctor profile error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve doctor profile',
      });
    }
  }

  // Update doctor degrees
  static async updateDegrees(req: Request, res: Response) {
    try {
      const { doctorId } = req.params;
      const { degrees } = req.body;

      // Verify doctor exists
      const doctor = await User.findOne({
        where: { id: doctorId, role: UserRole.DOCTOR },
      });

      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found',
        });
      }

      // Update degrees array
      await doctor.update({ degrees: degrees || [] });

      return res.status(200).json({
        success: true,
        message: 'Degrees updated successfully',
        data: { degrees: doctor.degrees },
      });
    } catch (error) {
      logger.error('Update degrees error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update degrees',
      });
    }
  }

  // Update doctor specializations
  static async updateSpecializations(req: Request, res: Response) {
    try {
      const { doctorId } = req.params;
      const { specializations } = req.body;

      // Verify doctor exists
      const doctor = await User.findOne({
        where: { id: doctorId, role: UserRole.DOCTOR },
      });

      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found',
        });
      }

      // Update specializations array
      await doctor.update({ specializations: specializations || [] });

      return res.status(200).json({
        success: true,
        message: 'Specializations updated successfully',
        data: { specializations: doctor.specializations },
      });
    } catch (error) {
      logger.error('Update specializations error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update specializations',
      });
    }
  }

  // Initialize default services for a doctor
  static async initializeDoctorServices(req: Request, res: Response) {
    try {
      const { doctorId } = req.params;

      // Verify doctor exists
      const doctor = await User.findOne({
        where: { id: doctorId, role: UserRole.DOCTOR },
      });

      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found',
        });
      }

      // Create default services
      const defaultServices = [
        { serviceType: ServiceType.CHAT, price: 200, isEnabled: true, duration: 30 },
        { serviceType: ServiceType.AUDIO_CALL, price: 500, isEnabled: true, duration: 30 },
        { serviceType: ServiceType.VIDEO_CALL, price: 800, isEnabled: false, duration: 30 },
      ];

      const createdServices = [];
      for (const service of defaultServices) {
        const [doctorService, created] = await DoctorService.findOrCreate({
          where: {
            doctorId: parseInt(doctorId),
            serviceType: service.serviceType,
          },
          defaults: service,
        });
        createdServices.push(doctorService);
      }

      // Create default availability (Monday to Friday, 9 AM to 5 PM)
      const defaultAvailability = [
        { dayOfWeek: DayOfWeek.MONDAY, startTime: '09:00:00', endTime: '17:00:00', isAvailable: true },
        { dayOfWeek: DayOfWeek.TUESDAY, startTime: '09:00:00', endTime: '17:00:00', isAvailable: true },
        { dayOfWeek: DayOfWeek.WEDNESDAY, startTime: '09:00:00', endTime: '17:00:00', isAvailable: true },
        { dayOfWeek: DayOfWeek.THURSDAY, startTime: '09:00:00', endTime: '17:00:00', isAvailable: true },
        { dayOfWeek: DayOfWeek.FRIDAY, startTime: '09:00:00', endTime: '17:00:00', isAvailable: true },
        { dayOfWeek: DayOfWeek.SATURDAY, startTime: '09:00:00', endTime: '17:00:00', isAvailable: false },
        { dayOfWeek: DayOfWeek.SUNDAY, startTime: '09:00:00', endTime: '17:00:00', isAvailable: false },
      ];

      const createdAvailability = [];
      for (const availability of defaultAvailability) {
        const [doctorAvailability, created] = await DoctorAvailability.findOrCreate({
          where: {
            doctorId: parseInt(doctorId),
            dayOfWeek: availability.dayOfWeek,
          },
          defaults: availability,
        });
        createdAvailability.push(doctorAvailability);
      }

      return res.status(201).json({
        success: true,
        message: 'Doctor services and availability initialized successfully',
        data: {
          services: createdServices,
          availability: createdAvailability,
        },
      });
    } catch (error) {
      logger.error('Initialize doctor services error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to initialize doctor services',
      });
    }
  }
}