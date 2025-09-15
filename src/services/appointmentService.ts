import { Appointment } from '../models/Appointment';
import { User } from '../models/User';
import { Service } from '../models/Service';
import { DoctorService } from '../models/DoctorService';
import { DoctorTimeSlot } from '../models/DoctorTimeSlot';
import { Category } from '../models/Category';
import { Chat } from '../models/Chat';
import { ChatSession, SessionStatus, SessionType } from '../models/ChatSession';
import { 
  CreateAppointmentRequest, 
  AppointmentFilters, 
  AppointmentStatus,
  ServiceType,
  AvailableSlot 
} from '../types/appointment';
import { logger } from '../utils/logger';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export class AppointmentService {
  // Helper method to convert 12-hour time format to 24-hour format
  private convertTo24Hour(time12h: string): string {
    const [time, modifier] = time12h.split(/([AP]M)/);
    let [hours, minutes] = time.split(':');
    
    if (hours === '12') {
      hours = '00';
    }
    
    if (modifier === 'PM') {
      hours = (parseInt(hours, 10) + 12).toString();
    }
    
    return `${hours.padStart(2, '0')}:${minutes}:00`;
  }

  // Create a new appointment
  async createAppointment(patientId: number, appointmentData: CreateAppointmentRequest) {
    try {
      // Debug logging
      logger.info('Creating appointment', { 
        patientId, 
        doctorId: appointmentData.doctorId, 
        serviceType: appointmentData.serviceType 
      });
      // Check if doctor exists and is approved
      const doctor = await User.findOne({
        where: {
          id: appointmentData.doctorId,
          role: 'doctor',
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

      // Get doctor's service pricing
      const doctorServices = await DoctorService.findOne({
        where: {
          doctorId: appointmentData.doctorId,
        },
      });

      if (!doctorServices) {
        return {
          success: false,
          message: 'Doctor services not configured',
        };
      }

      // Get price and availability for the requested service type
      let servicePrice = 0;
      let serviceEnabled = false;
      let serviceDuration = 30;

      switch (appointmentData.serviceType) {
        case ServiceType.CHAT:
          servicePrice = doctorServices.chatPrice;
          serviceEnabled = doctorServices.chatEnabled;
          serviceDuration = doctorServices.chatDuration;
          break;
        case ServiceType.AUDIO_CALL:
          servicePrice = doctorServices.audioPrice;
          serviceEnabled = doctorServices.audioEnabled;
          serviceDuration = doctorServices.audioDuration;
          break;
        case ServiceType.VIDEO_CALL:
          servicePrice = doctorServices.videoPrice;
          serviceEnabled = doctorServices.videoEnabled;
          serviceDuration = doctorServices.videoDuration;
          break;
        default:
          return {
            success: false,
            message: 'Invalid service type',
          };
      }

      if (!serviceEnabled) {
        return {
          success: false,
          message: `${appointmentData.serviceType.replace('_', ' ')} service is not available for this doctor`,
        };
      }

      // First, check if the requested time slot exists and is available for this doctor
      const appointmentDate = new Date(appointmentData.appointmentDate);
      const dayOfWeek = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      
      // Convert appointment time to 24-hour format for database comparison
      const timeSlot24 = this.convertTo24Hour(appointmentData.appointmentTime);
      
      const availableTimeSlot = await DoctorTimeSlot.findOne({
        where: {
          doctorId: appointmentData.doctorId,
          dayOfWeek: dayOfWeek,
          timeSlot: timeSlot24,
          isAvailable: true,
        },
      });

      console.log('availableTimeSlot--------------------------->',availableTimeSlot);
      console.log('check--------------------------->', {
        doctorId: appointmentData.doctorId,
        dayOfWeek: dayOfWeek,
        timeSlot: timeSlot24,
        isAvailable: true,
      });
      
      if (!availableTimeSlot) {
        return {
          success: false,
          message: 'This time slot is not available for the selected doctor',
        };
      }

      // Check if time slot is already booked
      const existingAppointment = await Appointment.findOne({
        where: {
          doctorId: appointmentData.doctorId,
          appointmentDate,
          appointmentTime: appointmentData.appointmentTime,
          status: { [Op.ne]: 'cancelled' },
          isActive: true,
        },
      });

      if (existingAppointment) {
        return {
          success: false,
          message: 'This time slot is already booked',
        };
      }

      const appointment = await Appointment.create({
        patientId,
        doctorId: appointmentData.doctorId,
        appointmentDate,
        appointmentTime: appointmentData.appointmentTime,
        serviceType: appointmentData.serviceType,
        patientName: appointmentData.patientName,
        patientAge: appointmentData.patientAge,
        patientGender: appointmentData.patientGender,
        problemDescription: appointmentData.problemDescription,
        status: AppointmentStatus.PENDING,
        totalAmount: servicePrice,
        isActive: true,
      });

      // Create chat and chat session for this appointment
      try {
        // Create or find existing chat between doctor and patient
        const chat = await Chat.findOrCreateChat(appointmentData.doctorId, patientId);

        // Generate session ID (combination of doctor and patient IDs with timestamp)
        const sessionId = `${appointmentData.doctorId}-${patientId}-${Date.now()}`;

        // Determine session type based on service type
        let sessionType: SessionType;
        switch (appointmentData.serviceType) {
          case ServiceType.CHAT:
            sessionType = SessionType.CHAT;
            break;
          case ServiceType.AUDIO_CALL:
            sessionType = SessionType.AUDIO_CALL;
            break;
          case ServiceType.VIDEO_CALL:
            sessionType = SessionType.VIDEO_CALL;
            break;
          default:
            sessionType = SessionType.CHAT;
        }
        console.log('appointmentData--------------------------->', appointmentData);
        console.log('sessionType--------------------------->', sessionType);
// return
        // Create chat session
        const chatSession = await ChatSession.create({
          chatId: chat.id,
          sessionId,
          doctorId: appointmentData.doctorId,
          patientId,
          sessionType,
          sessionToken: uuidv4(), // Generate a unique session token
          status: SessionStatus.SCHEDULED,
          startTime: appointmentDate, // Use appointment date as start time
          isActive: true,
        });

        logger.info(`Chat session created for appointment ${appointment.id}: ${sessionId}`);
      } catch (chatError) {
        logger.error('Error creating chat session for appointment:', chatError);
        // Don't fail the appointment creation if chat session creation fails
        // The appointment is still valid, just without chat functionality
      }

      return {
        success: true,
        message: 'Appointment created successfully',
        data: { appointment },
      };
    } catch (error) {
      logger.error('Create appointment service error:', error?.message);
      return {
        success: false,
        message: 'Failed to create appointment',
      };
    }
  }

  // Get appointments with filters
  async getAppointments(filters: AppointmentFilters = {}) {
    try {
      const {
        doctorId,
        patientId,
        status,
        startDate,
        endDate,
        page = 1,
        limit = 10,
        sortBy = 'appointmentDate',
        sortOrder = 'ASC',
      } = filters;

      const whereClause: any = {
        isActive: true,
      };

      if (doctorId) whereClause.doctorId = doctorId;
      if (patientId) whereClause.patientId = patientId;
      if (status) whereClause.status = status;

      if (startDate || endDate) {
        whereClause.appointmentDate = {};
        if (startDate) whereClause.appointmentDate[Op.gte] = startDate;
        if (endDate) whereClause.appointmentDate[Op.lte] = endDate;
      }

      const offset = (page - 1) * limit;

      const { count, rows } = await Appointment.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'patient',
            attributes: ['id', 'fullName', 'email', 'profileImage'],
            where: { isActive: true },
            required: true,
          },
          {
            model: User,
            as: 'doctor',
            attributes: ['id', 'fullName', 'doctorId', 'departmentId', 'specialization', 'profileImage'],
            where: { isActive: true, isApproved: true },
            required: true,
            include: [
              {
                model: Category,
                as: 'department',
                required: false,
                attributes: ['id', 'name', 'description'],
              },
            ],
          },
        ],
        order: [[sortBy, sortOrder]],
        limit,
        offset,
      });

      const totalPages = Math.ceil(count / limit);

      return {
        success: true,
        message: 'Appointments retrieved successfully',
        data: {
          appointments: rows,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems: count,
            itemsPerPage: limit,
          },
        },
      };
    } catch (error) {
      logger.error('Get appointments service error:', error);
      return {
        success: false,
        message: 'Failed to retrieve appointments',
      };
    }
  }

  // Get available time slots for a doctor
  async getAvailableSlots(doctorId: number, date: string, timeOfDay: 'morning' | 'evening') {
    try {
      const appointmentDate = new Date(date);
      
      // Define time slots based on time of day
      const timeSlots = timeOfDay === 'morning' 
        ? ['09:00AM', '09:30AM', '10:00AM', '10:30AM', '11:00AM', '11:30AM']
        : ['02:00PM', '02:30PM', '03:00PM', '03:30PM', '04:00PM', '04:30PM'];

      // Get booked slots for this date
      const bookedAppointments = await Appointment.findAll({
        where: {
          doctorId,
          appointmentDate,
          status: { [Op.ne]: 'cancelled' },
          isActive: true,
        },
        attributes: ['appointmentTime'],
      });

      const bookedTimes = bookedAppointments.map(app => app.appointmentTime);

      // Create available slots
      const slots: AvailableSlot[] = timeSlots.map(time => ({
        time,
        isAvailable: !bookedTimes.includes(time),
      }));

      return {
        success: true,
        message: 'Available slots retrieved successfully',
        data: {
          slots,
          date,
          timeOfDay,
        },
      };
    } catch (error) {
      logger.error('Get available slots service error:', error);
      return {
        success: false,
        message: 'Failed to retrieve available slots',
      };
    }
  }

  // Get appointment by ID
  async getAppointmentById(id: number) {
    try {
      const appointment = await Appointment.findOne({
        where: { id, isActive: true },
        include: [
          {
            model: User,
            as: 'patient',
            attributes: ['id', 'fullName', 'email', 'profileImage'],
            where: { isActive: true },
            required: true,
          },
          {
            model: User,
            as: 'doctor',
            attributes: ['id', 'fullName', 'doctorId', 'departmentId', 'specialization', 'profileImage'],
            where: { isActive: true, isApproved: true },
            required: true,
            include: [
              {
                model: Category,
                as: 'department',
                required: false,
                attributes: ['id', 'name', 'description'],
              },
            ],
          },
        ],
      });

      if (!appointment) {
        return {
          success: false,
          message: 'Appointment not found',
        };
      }

      return {
        success: true,
        message: 'Appointment retrieved successfully',
        data: { appointment },
      };
    } catch (error) {
      logger.error('Get appointment by ID service error:', error);
      return {
        success: false,
        message: 'Failed to retrieve appointment',
      };
    }
  }

  // Update appointment status
  async updateAppointmentStatus(id: number, status: AppointmentStatus) {
    try {
      const appointment = await Appointment.findOne({
        where: { id, isActive: true },
      });

      if (!appointment) {
        return {
          success: false,
          message: 'Appointment not found',
        };
      }

      await appointment.update({ status });

      return {
        success: true,
        message: 'Appointment status updated successfully',
        data: { appointment },
      };
    } catch (error) {
      logger.error('Update appointment status service error:', error);
      return {
        success: false,
        message: 'Failed to update appointment status',
      };
    }
  }

  // Cancel appointment
  async cancelAppointment(id: number, patientId: number) {
    try {
      const appointment = await Appointment.findOne({
        where: { id, patientId, isActive: true },
      });

      if (!appointment) {
        return {
          success: false,
          message: 'Appointment not found or you are not authorized to cancel it',
        };
      }

      await appointment.update({ 
        status: AppointmentStatus.CANCELLED,
        isActive: false,
      });

      return {
        success: true,
        message: 'Appointment cancelled successfully',
      };
    } catch (error) {
      logger.error('Cancel appointment service error:', error);
      return {
        success: false,
        message: 'Failed to cancel appointment',
      };
    }
  }

  // Get my appointments (for current user)
  async getMyAppointments(patientId: number, page = 1, limit = 10, filter: 'all' | 'past' | 'future' = 'all') {
    try {
      const now = new Date();
      let dateFilter: any = {};

      switch (filter) {
        case 'past':
          dateFilter = {
            appointmentDate: {
              [Op.lt]: now,
            },
          };
          break;
        case 'future':
          dateFilter = {
            appointmentDate: {
              [Op.gte]: now,
            },
          };
          break;
        case 'all':
        default:
          break;
      }

      const whereClause = {
        patientId,
        isActive: true,
        ...dateFilter,
      };

      const offset = (page - 1) * limit;

             const { count, rows } = await Appointment.findAndCountAll({
         where: whereClause,
         include: [
           {
             model: User,
             as: 'patient',
             attributes: ['id', 'fullName', 'email', 'profileImage'],
             where: { isActive: true },
             required: true,
           },
           {
             model: User,
             as: 'doctor',
             attributes: ['id', 'fullName', 'doctorId', 'departmentId', 'specialization', 'profileImage'],
             where: { isActive: true, isApproved: true },
             required: true,
            include: [
              {
                model: Category,
                as: 'department',
                required: false,
                attributes: ['id', 'name', 'description'],
              },
            ],
          },
        ],
        order: [['appointmentDate', 'ASC'], ['appointmentTime', 'ASC']],
        limit,
        offset,
      });

      const totalPages = Math.ceil(count / limit);

      return {
        success: true,
        message: `${filter.charAt(0).toUpperCase() + filter.slice(1)} appointments retrieved successfully`,
        data: {
          appointments: rows,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems: count,
            itemsPerPage: limit,
          },
          filter,
        },
      };
    } catch (error) {
      logger.error('Get my appointments service error:', error);
      return {
        success: false,
        message: 'Failed to retrieve appointments',
      };
    }
  }

  // Get doctor appointments
  async getDoctorAppointments(doctorId: number, page = 1, limit = 10) {
    return this.getAppointments({ doctorId, page, limit });
  }
} 