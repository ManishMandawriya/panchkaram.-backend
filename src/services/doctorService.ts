import { User } from '../models/User';
import { Review } from '../models/Review';
import { Category } from '../models/Category';
import { DoctorService as DoctorServiceModel, ServiceType } from '../models/DoctorService';
import { DoctorAvailability } from '../models/DoctorAvailability';
import { DoctorTimeSlot } from '../models/DoctorTimeSlot';
import { Appointment } from '../models/Appointment';
import { UserRole } from '../types/auth';
import { logger } from '../utils/logger';
import { col, fn, Op } from 'sequelize';

export class DoctorService {
  // Helper method to generate time slots
  private generateTimeSlots(
    startTime: string,
    endTime: string,
    slotDuration: number = 30,
    breakTime: number = 0
  ): string[] {
    const slots: string[] = [];
    
    // Parse start and end times
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    let currentHour = startHour;
    let currentMin = startMin;
    
    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      // Format time as 12-hour format
      const hour12 = currentHour === 0 ? 12 : currentHour > 12 ? currentHour - 12 : currentHour;
      const ampm = currentHour < 12 ? 'AM' : 'PM';
      const formattedTime = `${hour12.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}${ampm}`;
      
      slots.push(formattedTime);
      
      // Add slot duration + break time
      currentMin += slotDuration + breakTime;
      
      // Handle minute overflow
      if (currentMin >= 60) {
        currentHour += Math.floor(currentMin / 60);
        currentMin = currentMin % 60;
      }
      
      // Break if we've exceeded end time
      if (currentHour > endHour || (currentHour === endHour && currentMin >= endMin)) {
        break;
      }
    }
    
    return slots;
  }

  // Get all approved doctors with optional filters
  async getDoctors(filters: any = {}) {
    try {
      const {
        categoryId,
        specialty,
        search,
        rating,
        experience,
        page = 1,
        limit = 10,
        sortBy = 'id',
        sortOrder = 'DESC',
      } = filters;

      const whereClause: any = {
        role: UserRole.DOCTOR,
        isActive: true,
        isApproved: true,
      };

      if (categoryId) whereClause.departmentId = categoryId;
      if (specialty) whereClause.specialization = { [Op.like]: `%${specialty}%` };

      const offset = (page - 1) * limit;

      // Build include array
      const include = [
        {
          model: Review,
          as: 'reviews',
          where: { isActive: true },
          required: false,
          attributes: ['rating'],
        },
        {
          model: Category,
          as: 'department',
          required: false,
          attributes: ['id', 'name', 'description'],
        },
      ];

      // If search is provided, also search in department name
      if (search) {
        // Search in User table fields
        whereClause[Op.or] = [
          { fullName: { [Op.like]: `%${search}%` } },
          { specialization: { [Op.like]: `%${search}%` } },
          { doctorId: { [Op.like]: `%${search}%` } },
        ];

        // Also search in department name by adding a condition to the include
        include[1] = {
          model: Category,
          as: 'department',
          required: false,
          attributes: ['id', 'name', 'description'],
          where: {
            name: { [Op.like]: `%${search}%` }
          } as any
        };
      }

      const { count, rows } = await User.findAndCountAll({
        where: whereClause,
        include,
        order: [['id', 'DESC']],
        limit,
        offset,
        attributes: [
          'id',
          'fullName',
          'doctorId',
          'departmentId',
          'specialization',
          'experience',
        ],
      });

      // Calculate ratings and review counts
      const doctors =Promise.all( rows.map(async (doctor: any) => {

        const result:any = await Review.findOne({
          attributes: [
            [fn("AVG", col("rating")), "averageRating"],
            [fn("COUNT", col("rating")), "ratingCount"]
          ],
          where: { doctorId: doctor.id, isActive: true }
        });
        const averageRating = parseFloat(result.get("averageRating") || 0);
        const totalRating = parseInt(result.get("ratingCount") || 0);

  
        // const reviews = doctor.reviews || [];
        // const totalRating = reviews.reduce((sum: number, review: any) => sum + review.rating, 0);
        // const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;
        // const patientsCount = Math.floor(Math.random() * 5000) + 1000; // Mock data

        return {
          id: doctor.id,
          fullName: doctor.fullName,
          doctorId: doctor.doctorId,
          specialty: doctor.specialization || (doctor.department?.name || 'General'),
          department: doctor.department?.name || 'General',
          departmentId: doctor.departmentId,
          experience: doctor.experience,
          rating: parseFloat(averageRating.toFixed(1)),
          reviewsCount: totalRating,
          // patientsCount,
          profileImage: (doctor as any).profileImage || null,
        };
      }));

      const totalPages = Math.ceil(count / limit);

      return {
        success: true,
        message: 'Doctors retrieved successfully',
        data: {
          doctors,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems: count,
            itemsPerPage: limit,
          },
        },
      };
    } catch (error) {
      logger.error('Get doctors service error:', error);
      return {
        success: false,
        message: 'Failed to retrieve doctors',
      };
    }
  }

  // Get doctor by ID with detailed information
  async getDoctorById(id: number) {
    try {
      const doctor = await User.findOne({
        where: {
          id,
          role: UserRole.DOCTOR,
          isActive: true,
          isApproved: true,
        },
        include: [
          // {
          //   model: Review,
          //   as: 'reviews',
          //   where: { isActive: true },
          //   required: false,
          //   attributes: ['rating', 'comment', 'createdAt'],
          //   limit: 5,
          //   order: [['createdAt', 'DESC']],
          // },
          {
            model: Category,
            as: 'department',
            required: false,
            attributes: ['id', 'name', 'description'],
          },
          {
            model: DoctorServiceModel,
            as: 'doctorServices',
            required: false,
            attributes: [
              'id', 'chatPrice', 'chatEnabled', 'chatDuration', 'chatDescription',
              'audioPrice', 'audioEnabled', 'audioDuration', 'audioDescription',
              'videoPrice', 'videoEnabled', 'videoDuration', 'videoDescription'
            ],
          },
          {
            model: DoctorTimeSlot,
            as: 'doctorTimeSlots',
            where: { isAvailable: true },
            required: false,
            attributes: ['id', 'dayOfWeek', 'timeSlot', 'isAvailable', 'duration'],
          },
        ],
        attributes: [
          'id',
          'fullName',
          'doctorId',
          'departmentId',
          'specialization',
          'experience',
          'qualifications',
          'profileImage',
        ],
      });

      if (!doctor) {
        return {
          success: false,
          message: 'Doctor not found',
        };
      }

      const result:any = await Review.findOne({
        attributes: [
          [fn("AVG", col("rating")), "averageRating"],
          [fn("COUNT", col("rating")), "ratingCount"]
        ],
        where: { doctorId: doctor.id, isActive: true }
      });
      const averageRating = parseFloat(result.get("averageRating") || 0);
      const totalRating = parseInt(result.get("ratingCount") || 0);
      const patientsCountResult = await Appointment.count({
        distinct: true,
        col: "patientId",
        where: {
          doctorId: doctor.id,
          status: { [Op.ne]: "cancelled" },
        },
      });
      const patientsCount = patientsCountResult || 0;



      // Format services for easy consumption from single record
      const doctorServicesRecord = (doctor as any).doctorServices;
      const services = doctorServicesRecord ? {
        chat: {
          price: doctorServicesRecord.chatPrice,
          isEnabled: doctorServicesRecord.chatEnabled,
          duration: doctorServicesRecord.chatDuration,
          description: doctorServicesRecord.chatDescription,
        },
        audioCall: {
          price: doctorServicesRecord.audioPrice,
          isEnabled: doctorServicesRecord.audioEnabled,
          duration: doctorServicesRecord.audioDuration,
          description: doctorServicesRecord.audioDescription,
        },
        videoCall: {
          price: doctorServicesRecord.videoPrice,
          isEnabled: doctorServicesRecord.videoEnabled,
          duration: doctorServicesRecord.videoDuration,
          description: doctorServicesRecord.videoDescription,
        },
      } : {
        chat: { price: 0, isEnabled: false, duration: 30, description: null },
        audioCall: { price: 0, isEnabled: false, duration: 30, description: null },
        videoCall: { price: 0, isEnabled: false, duration: 30, description: null },
      };

      // Get existing appointments for this doctor to filter out booked slots
      const existingAppointments = await Appointment.findAll({
        where: {
          doctorId: doctor.id,
          appointmentDate: {
            [Op.gte]: new Date(), // Only future appointments
          },
          status: {
            [Op.ne]: 'cancelled', // Exclude cancelled appointments
          },
          isActive: true,
        },
        attributes: ['appointmentDate', 'appointmentTime'],
      });

      // Create a set of booked time slots for quick lookup
      const bookedSlots = new Set();
      existingAppointments.forEach((appointment: any) => {
        const date = new Date(appointment.appointmentDate);
        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const key = `${dayOfWeek}-${appointment.appointmentTime}`;
        bookedSlots.add(key);
      });

      // Format availability by day with actual selectable time slots (excluding booked ones)
      const doctorTimeSlots = (doctor as any).doctorTimeSlots || [];
      const availability = doctorTimeSlots.reduce((acc: any, slot: any) => {
        if (!acc[slot.dayOfWeek]) {
          acc[slot.dayOfWeek] = {
            timeSlots: [],
          };
        }
        
        // Convert time slot to 12-hour format for display
        const [hour, minute] = slot.timeSlot.split(':');
        const hourNum = parseInt(hour);
        const hour12 = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
        const ampm = hourNum < 12 ? 'AM' : 'PM';
        const formattedTime = `${hour12.toString().padStart(2, '0')}:${minute}${ampm}`;
        
        // Check if this time slot is booked (for current week/future dates)
        const slotKey = `${slot.dayOfWeek}-${formattedTime}`;
        const isCurrentlyBooked = bookedSlots.has(slotKey);
        
        acc[slot.dayOfWeek].timeSlots.push({
          id: slot.id,
          time: formattedTime,
          time24: slot.timeSlot,
          isAvailable: slot.isAvailable && !isCurrentlyBooked, // Available only if slot is enabled AND not booked
          duration: slot.duration,
          isBooked: isCurrentlyBooked,
        });
        
        return acc;
      }, {});

      // Sort time slots for each day
      Object.keys(availability).forEach(day => {
        availability[day].timeSlots.sort((a: any, b: any) => a.time24.localeCompare(b.time24));
      });

      const doctorData = {
        id: doctor.id,
        fullName: doctor.fullName,
        doctorId: doctor.doctorId,
        specialty: doctor.specialization || (doctor.department?.name || 'General'),
        department: doctor.department?.name || 'General',
        departmentId: doctor.departmentId,
        experience: doctor.experience,
        rating: parseFloat(averageRating.toFixed(1)),
        reviewsCount: totalRating,
        patientsCount,
        profileImage: (doctor as any).profileImage || null,
        biography: doctor.qualifications || 'Experienced doctor with excellent patient care.',
        services,
        availability,
        workingHours: [
          {
            id: 1,
            day: 'Mon - Sat',
            startTime: '09:30AM',
            endTime: '09:00PM',
            isActive: true,
          },
        ],
      };

      return {
        success: true,
        message: 'Doctor retrieved successfully',
        data: { doctor: doctorData },
      };
    } catch (error) {
      logger.error('Get doctor by ID service error:', error);
      return {
        success: false,
        message: 'Failed to retrieve doctor',
      };
    }
  }

  // Search doctors
  async searchDoctors(searchData: any) {
    try {
      const { search, categoryIds, specialty, page = 1, limit = 10 } = searchData;

      const whereClause: any = {
        role: UserRole.DOCTOR,
        isActive: true,
        isApproved: true,
      };

      if (search) {
        whereClause[Op.or] = [
          { fullName: { [Op.like]: `%${search}%` } },
          { specialization: { [Op.like]: `%${search}%` } },
          { doctorId: { [Op.like]: `%${search}%` } },
        ];
      }

      if (categoryIds && categoryIds.length > 0) {
        whereClause.departmentId = { [Op.in]: categoryIds };
      }

      if (specialty) {
        whereClause.specialization = { [Op.like]: `%${specialty}%` };
      }

      const offset = (page - 1) * limit;

      const { count, rows } = await User.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Review,
            as: 'reviews',
            where: { isActive: true },
            required: false,
            attributes: ['rating'],
          },
          {
            model: Category,
            as: 'department',
            required: false,
            attributes: ['id', 'name', 'description'],
          },
        ],
        order: [['id', 'DESC']],
        limit,
        offset,
        attributes: [
          'id',
          'fullName',
          'doctorId',
          'departmentId',
          'specialization',
          'experience',
        ],
      });

      const doctors = rows.map((doctor: any) => {
        const reviews = doctor.reviews || [];
        const totalRating = reviews.reduce((sum: number, review: any) => sum + review.rating, 0);
        const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

        return {
          id: doctor.id,
          fullName: doctor.fullName,
          doctorId: doctor.doctorId,
          specialty: doctor.specialization || (doctor.department?.name || 'General'),
          department: doctor.department?.name || 'General',
          departmentId: doctor.departmentId,
          experience: doctor.experience,
          rating: parseFloat(averageRating.toFixed(1)),
          reviewsCount: reviews.length,
          profileImage: (doctor as any).profileImage || null,
        };
      });

      const totalPages = Math.ceil(count / limit);

      return {
        success: true,
        message: 'Doctors search completed successfully',
        data: {
          doctors,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems: count,
            itemsPerPage: limit,
          },
        },
      };
    } catch (error) {
      logger.error('Search doctors service error:', error);
      return {
        success: false,
        message: 'Failed to search doctors',
      };
    }
  }

  // Get top doctors
  async getTopDoctors(limit = 3) {
    try {
      const doctors = await User.findAll({
        where: {
          role: UserRole.DOCTOR,
          isActive: true,
          isApproved: true,
        },
        include: [
          {
            model: Review,
            as: 'reviews',
            where: { isActive: true },
            required: false,
            attributes: ['rating'],
          },
          {
            model: Category,
            as: 'department',
            required: false,
            attributes: ['id', 'name', 'description'],
          },
        ],
        order: [['id', 'DESC']],
        limit,
        attributes: [
          'id',
          'fullName',
          'doctorId',
          'departmentId',
          'specialization',
          'experience',
        ],
      });

      const topDoctors = Promise.all( doctors.map(async (doctor: any) => {
        // const reviews = doctor.reviews || [];
        // const totalRating = reviews.reduce((sum: number, review: any) => sum + review.rating, 0);
        // const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;
        const result:any = await Review.findOne({
          attributes: [
            [fn("AVG", col("rating")), "averageRating"],
            [fn("COUNT", col("rating")), "ratingCount"]
          ],
          where: { doctorId: doctor.id, isActive: true }
        });
        const averageRating = parseFloat(result.get("averageRating") || 0);
        const totalRating = parseInt(result.get("ratingCount") || 0);
  


        return {
          id: doctor.id,
          fullName: doctor.fullName,
          doctorId: doctor.doctorId,
          specialty: doctor.specialization || (doctor.department?.name || 'General'),
          department: doctor.department?.name || 'General',
          departmentId: doctor.departmentId,
          experience: doctor.experience,
          rating: parseFloat(averageRating.toFixed(1)),
          reviewsCount: totalRating,
          profileImage: (doctor as any).profileImage || null,
        };
      })); 

      return {
        success: true,
        message: 'Top doctors retrieved successfully',
        data: { doctors: topDoctors },
      };
    } catch (error) {
      logger.error('Get top doctors service error:', error);
      return {
        success: false,
        message: 'Failed to retrieve top doctors',
      };
    }
  }
} 