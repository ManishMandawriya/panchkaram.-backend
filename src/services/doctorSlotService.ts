import { DoctorAvailability, DayOfWeek } from '../models/DoctorAvailability';
import { DoctorTimeSlot } from '../models/DoctorTimeSlot';
import { Appointment } from '../models/Appointment';
import { logger } from '../utils/logger';
import { Op } from 'sequelize';

interface TimeRange {
  startTime: string;
  endTime: string;
  slotDuration: number;
}

interface DaySchedule {
  day: string;
  isAvailable: boolean;
  timeRanges: TimeRange[];
}

interface WeekSchedule {
  weekSchedule: DaySchedule[];
}

export class DoctorSlotService {
  // Get doctor's time slots
  async getTimeSlots(doctorId: number) {
    try {
      const availability = await DoctorAvailability.findAll({
        where: { doctorId },
        order: [['dayOfWeek', 'ASC']],
      });

      // Get all time slots for this doctor
      const timeSlots = await DoctorTimeSlot.findAll({
        where: { doctorId },
        order: [['dayOfWeek', 'ASC'], ['timeSlot', 'ASC']],
      });

      // Convert to week schedule format
      const weekSchedule: DaySchedule[] = [];
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

      for (let i = 0; i < 7; i++) {
        const dayName = dayNames[i];
        const dayAvailability = availability.find(a => a.dayOfWeek === dayName);
        const dayTimeSlots = timeSlots.filter(slot => slot.dayOfWeek === dayName);
        
        if (dayAvailability) {
          const timeRanges: TimeRange[] = [];
          
          // Group time slots into ranges
          if (dayTimeSlots.length > 0) {
            let currentRange: TimeRange | null = null;
            
            for (const slot of dayTimeSlots) {
              if (!currentRange) {
                currentRange = {
                  startTime: this.convertTo12Hour(slot.timeSlot),
                  endTime: this.convertTo12Hour(this.addMinutes(slot.timeSlot, slot.duration)),
                  slotDuration: slot.duration,
                };
              } else {
                const slotEndTime = this.addMinutes(slot.timeSlot, slot.duration);
                const currentEndTime = this.convertFrom12Hour(currentRange.endTime);
                
                if (slotEndTime === currentEndTime) {
                  // Extend current range
                  currentRange.endTime = this.convertTo12Hour(slotEndTime);
                } else {
                  // End current range and start new one
                  timeRanges.push(currentRange);
                  currentRange = {
                    startTime: this.convertTo12Hour(slot.timeSlot),
                    endTime: this.convertTo12Hour(slotEndTime),
                    slotDuration: slot.duration,
                  };
                }
              }
            }
            
            if (currentRange) {
              timeRanges.push(currentRange);
            }
          }

          weekSchedule.push({
            day: dayName,
            isAvailable: dayAvailability.isAvailable,
            timeRanges,
          });
        } else {
          weekSchedule.push({
            day: dayName,
            isAvailable: false,
            timeRanges: [],
          });
        }
      }

      return {
        success: true,
        message: 'Time slots retrieved successfully',
        data: {
          weekSchedule,
        },
      };
    } catch (error) {
      logger.error('Get time slots service error:', error);
      return {
        success: false,
        message: 'Failed to retrieve time slots',
      };
    }
  }

  // Create or update doctor's time slots
  async createOrUpdateTimeSlots(doctorId: number, weekSchedule: DaySchedule[]) {
    try {
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      
      // Clear existing time slots for this doctor
      await DoctorTimeSlot.destroy({
        where: { doctorId },
      });

      // Clear existing availability
      await DoctorAvailability.destroy({
        where: { doctorId },
      });

      // Process each day in the week schedule
      for (const daySchedule of weekSchedule) {
        const dayOfWeek = daySchedule.day as DayOfWeek;

        // Create availability record
        await DoctorAvailability.create({
          doctorId,
          dayOfWeek,
          startTime: daySchedule.timeRanges.length > 0 ? this.convertFrom12Hour(daySchedule.timeRanges[0].startTime) : '00:00:00',
          endTime: daySchedule.timeRanges.length > 0 ? this.convertFrom12Hour(daySchedule.timeRanges[daySchedule.timeRanges.length - 1].endTime) : '00:00:00',
          isAvailable: daySchedule.isAvailable,
          slotDuration: daySchedule.timeRanges.length > 0 ? daySchedule.timeRanges[0].slotDuration : 30,
          breakTime: 0,
        });

        // Generate time slots for each time range
        for (const timeRange of daySchedule.timeRanges) {
          const timeSlots = this.generateTimeSlotsFromRange(
            timeRange.startTime,
            timeRange.endTime,
            timeRange.slotDuration
          );

          // Create time slot records
          const slotRecords = timeSlots.map((timeSlot) => ({
            doctorId,
            dayOfWeek: dayOfWeek,
            timeSlot,
            isAvailable: daySchedule.isAvailable,
            duration: timeRange.slotDuration,
          }));

          await DoctorTimeSlot.bulkCreate(slotRecords);
        }
      }

      return {
        success: true,
        message: 'Time slots created/updated successfully',
        data: {
          weekSchedule,
        },
      };
    } catch (error) {
      logger.error('Create/Update time slots service error:', error);
      return {
        success: false,
        message: 'Failed to create/update time slots',
      };
    }
  }

  // Helper method to generate time slots from a time range
  private generateTimeSlotsFromRange(startTime: string, endTime: string, slotDuration: number): string[] {
    const timeSlots: string[] = [];
    const start = this.convertFrom12Hour(startTime);
    const end = this.convertFrom12Hour(endTime);
    const current = new Date(`2000-01-01 ${start}`);

    while (current < new Date(`2000-01-01 ${end}`)) {
      timeSlots.push(current.toTimeString().slice(0, 5));
      current.setMinutes(current.getMinutes() + slotDuration);
    }

    return timeSlots;
  }

  // Helper method to convert 24-hour time to 12-hour format
  private convertTo12Hour(time24: string): string {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${hours12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  // Helper method to convert 12-hour time to 24-hour format
  private convertFrom12Hour(time12: string): string {
    const [time, period] = time12.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    
    let hours24 = hours;
    if (period === 'PM' && hours !== 12) {
      hours24 = hours + 12;
    } else if (period === 'AM' && hours === 12) {
      hours24 = 0;
    }
    
    return `${hours24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
  }

  // Helper method to add minutes to a time string
  private addMinutes(time: string, minutes: number): string {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}:00`;
  }
}

