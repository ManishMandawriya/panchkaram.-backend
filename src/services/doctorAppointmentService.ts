import { Appointment } from '../models/Appointment';
import { User } from '../models/User';
import { AppointmentStatus, AppointmentFilters } from '../types/appointment';
import { logger } from '../utils/logger';
import { Op } from 'sequelize';

export class DoctorAppointmentService {
  // Get doctor's appointments with filters
  async getDoctorAppointments(doctorId: number, filters: AppointmentFilters) {
    try {
      const whereClause: any = {
        doctorId,
        isActive: true,
      };

      // Apply status filter
      if (filters.status) {
        whereClause.status = filters.status;
      }

      // Apply date range filter
      if (filters.startDate || filters.endDate) {
        whereClause.appointmentDate = {};
        if (filters.startDate) {
          whereClause.appointmentDate[Op.gte] = filters.startDate;
        }
        if (filters.endDate) {
          whereClause.appointmentDate[Op.lte] = filters.endDate;
        }
      }

      const offset = ((filters.page || 1) - 1) * (filters.limit || 10);
      const limit = filters.limit || 10;

      // Determine sort order
      let orderClause: any[] = [];
      if (filters.sortBy === 'patientName') {
        orderClause = [
          [{ model: User, as: 'patient' }, 'fullName', filters.sortOrder || 'ASC'],
          ['appointmentDate', 'ASC'],
          ['appointmentTime', 'ASC'],
        ];
      } else if (filters.sortBy === 'createdAt') {
        orderClause = [['createdAt', filters.sortOrder || 'ASC']];
      } else {
        // Default: appointmentDate
        orderClause = [
          ['appointmentDate', filters.sortOrder || 'ASC'],
          ['appointmentTime', 'ASC'],
        ];
      }

      const { count, rows } = await Appointment.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'patient',
            attributes: ['id', 'fullName', 'email', 'phoneNumber', 'gender', 'dateOfBirth', 'profileImage'],
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
        message: 'Appointments retrieved successfully',
        data: {
          appointments: rows,
          pagination: {
            currentPage: filters.page || 1,
            totalPages,
            totalItems: count,
            itemsPerPage: limit,
          },
        },
      };
    } catch (error) {
      logger.error('Get doctor appointments service error:', error);
      return {
        success: false,
        message: 'Failed to retrieve appointments',
      };
    }
  }

  // Get pending appointments
  async getPendingAppointments(doctorId: number, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;

      const { count, rows } = await Appointment.findAndCountAll({
        where: {
          doctorId,
          status: AppointmentStatus.PENDING,
          isActive: true,
        },
        include: [
          {
            model: User,
            as: 'patient',
            attributes: ['id', 'fullName', 'email', 'phoneNumber', 'gender', 'dateOfBirth', 'profileImage'],
            where: { isActive: true },
            required: true,
          },
        ],
        order: [['appointmentDate', 'ASC'], ['appointmentTime', 'ASC']],
        limit,
        offset,
      });

      const totalPages = Math.ceil(count / limit);

      return {
        success: true,
        message: 'Pending appointments retrieved successfully',
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
      logger.error('Get pending appointments service error:', error);
      return {
        success: false,
        message: 'Failed to retrieve pending appointments',
      };
    }
  }

  // Get upcoming appointments (confirmed and future date)
  async getUpcomingAppointments(doctorId: number, page = 1, limit = 10) {
    try {
      const now = new Date();
      const offset = (page - 1) * limit;

      const { count, rows } = await Appointment.findAndCountAll({
        where: {
          doctorId,
          status: AppointmentStatus.CONFIRMED,
          appointmentDate: {
            [Op.gte]: now,
          },
          isActive: true,
        },
        include: [
          {
            model: User,
            as: 'patient',
            attributes: ['id', 'fullName', 'email', 'phoneNumber', 'gender', 'dateOfBirth', 'profileImage'],
            where: { isActive: true },
            required: true,
          },
        ],
        order: [['appointmentDate', 'ASC'], ['appointmentTime', 'ASC']],
        limit,
        offset,
      });

      const totalPages = Math.ceil(count / limit);

      return {
        success: true,
        message: 'Upcoming appointments retrieved successfully',
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
      logger.error('Get upcoming appointments service error:', error);
      return {
        success: false,
        message: 'Failed to retrieve upcoming appointments',
      };
    }
  }

  // Get completed appointments
  async getCompletedAppointments(doctorId: number, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;

      const { count, rows } = await Appointment.findAndCountAll({
        where: {
          doctorId,
          status: AppointmentStatus.COMPLETED,
          isActive: true,
        },
        include: [
          {
            model: User,
            as: 'patient',
            attributes: ['id', 'fullName', 'email', 'phoneNumber', 'gender', 'dateOfBirth', 'profileImage'],
            where: { isActive: true },
            required: true,
          },
        ],
        order: [['appointmentDate', 'DESC'], ['appointmentTime', 'DESC']],
        limit,
        offset,
      });

      const totalPages = Math.ceil(count / limit);

      return {
        success: true,
        message: 'Completed appointments retrieved successfully',
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
      logger.error('Get completed appointments service error:', error);
      return {
        success: false,
        message: 'Failed to retrieve completed appointments',
      };
    }
  }

  // Get specific appointment by ID
  async getAppointmentById(doctorId: number, appointmentId: number) {
    try {
      const appointment = await Appointment.findOne({
        where: {
          id: appointmentId,
          doctorId,
          isActive: true,
        },
        include: [
          {
            model: User,
            as: 'patient',
            attributes: ['id', 'fullName', 'email', 'phoneNumber', 'gender', 'dateOfBirth', 'address', 'profileImage'],
            where: { isActive: true },
            required: false,
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
        data: {
          appointment,
        },
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
  async updateAppointmentStatus(doctorId: number, appointmentId: number, status: AppointmentStatus) {
    try {
      const appointment = await Appointment.findOne({
        where: {
          id: appointmentId,
          doctorId,
          isActive: true,
        },
      });

      if (!appointment) {
        return {
          success: false,
          message: 'Appointment not found',
        };
      }

      // Validate status transition
      const isValidTransition = this.validateStatusTransition(appointment.status, status);
      if (!isValidTransition) {
        return {
          success: false,
          message: `Invalid status transition from ${appointment.status} to ${status}`,
        };
      }

      // Update appointment
      await appointment.update({
        status,
      });

      return {
        success: true,
        message: `Appointment ${status} successfully`,
        data: {
          appointment,
        },
      };
    } catch (error) {
      logger.error('Update appointment status service error:', error);
      return {
        success: false,
        message: 'Failed to update appointment status',
      };
    }
  }

  // Accept appointment
  async acceptAppointment(doctorId: number, appointmentId: number) {
    return this.updateAppointmentStatus(doctorId, appointmentId, AppointmentStatus.CONFIRMED);
  }

  // Reject appointment
  async rejectAppointment(doctorId: number, appointmentId: number) {
    return this.updateAppointmentStatus(doctorId, appointmentId, AppointmentStatus.CANCELLED);
  }

  // Complete appointment
  async completeAppointment(doctorId: number, appointmentId: number) {
    try {
      const appointment = await Appointment.findOne({
        where: {
          id: appointmentId,
          doctorId,
          isActive: true,
        },
      });

      if (!appointment) {
        return {
          success: false,
          message: 'Appointment not found',
        };
      }

      // Check if appointment time has passed
      const appointmentDateTime = new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}`);
      const now = new Date();

      if (appointmentDateTime > now) {
        return {
          success: false,
          message: 'Cannot complete appointment before the scheduled time',
        };
      }

      // Update appointment
      await appointment.update({
        status: AppointmentStatus.COMPLETED,
      });

      return {
        success: true,
        message: 'Appointment marked as completed successfully',
        data: {
          appointment,
        },
      };
    } catch (error) {
      logger.error('Complete appointment service error:', error);
      return {
        success: false,
        message: 'Failed to complete appointment',
      };
    }
  }

  // Get appointment statistics
  async getAppointmentStats(doctorId: number) {
    try {
      const now = new Date();

      // Get counts for different statuses
      const [pendingCount, confirmedCount, completedCount, cancelledCount, totalCount] = await Promise.all([
        Appointment.count({
          where: {
            doctorId,
            status: AppointmentStatus.PENDING,
            isActive: true,
          },
        }),
        Appointment.count({
          where: {
            doctorId,
            status: AppointmentStatus.CONFIRMED,
            appointmentDate: {
              [Op.gte]: now,
            },
            isActive: true,
          },
        }),
        Appointment.count({
          where: {
            doctorId,
            status: AppointmentStatus.COMPLETED,
            isActive: true,
          },
        }),
        Appointment.count({
          where: {
            doctorId,
            status: AppointmentStatus.CANCELLED,
            isActive: true,
          },
        }),
        Appointment.count({
          where: {
            doctorId,
            isActive: true,
          },
        }),
      ]);

      // Get today's appointments
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayAppointments = await Appointment.count({
        where: {
          doctorId,
          appointmentDate: {
            [Op.gte]: today,
            [Op.lt]: tomorrow,
          },
          isActive: true,
        },
      });

      // Get this week's appointments
      const startOfWeek = new Date(today);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 7);

      const weekAppointments = await Appointment.count({
        where: {
          doctorId,
          appointmentDate: {
            [Op.gte]: startOfWeek,
            [Op.lt]: endOfWeek,
          },
          isActive: true,
        },
      });

      return {
        success: true,
        message: 'Appointment statistics retrieved successfully',
        data: {
          stats: {
            total: totalCount,
            pending: pendingCount,
            confirmed: confirmedCount,
            completed: completedCount,
            cancelled: cancelledCount,
            today: todayAppointments,
            thisWeek: weekAppointments,
          },
        },
      };
    } catch (error) {
      logger.error('Get appointment stats service error:', error);
      return {
        success: false,
        message: 'Failed to retrieve appointment statistics',
      };
    }
  }

  // Validate status transition
  private validateStatusTransition(currentStatus: AppointmentStatus, newStatus: AppointmentStatus): boolean {
    const validTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
      [AppointmentStatus.PENDING]: [AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED],
      [AppointmentStatus.CONFIRMED]: [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED],
      [AppointmentStatus.COMPLETED]: [], // No further transitions allowed
      [AppointmentStatus.CANCELLED]: [], // No further transitions allowed
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }
}
