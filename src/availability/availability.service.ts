import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Doctor } from '../doctor/entities/doctor.entity';
import { CreateCustomAvailabilityDto } from './dto/create-custom-availability.dto';
import { CreateRecurringAvailabilityDto } from './dto/create-recurring-availability.dto';
import { DayOfWeek } from './dto/day-of-week.enum';
import { UpdateRecurringAvailabilityDto } from './dto/update-recurring-availability.dto';
import { CustomAvailability } from './entities/custom-availability.entity';
import { RecurringAvailability } from './entities/recurring-availability.entity';

const WEEK_DAYS = [
  DayOfWeek.Sunday,
  DayOfWeek.Monday,
  DayOfWeek.Tuesday,
  DayOfWeek.Wednesday,
  DayOfWeek.Thursday,
  DayOfWeek.Friday,
  DayOfWeek.Saturday,
];

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
    @InjectRepository(RecurringAvailability)
    private readonly recurringRepository: Repository<RecurringAvailability>,
    @InjectRepository(CustomAvailability)
    private readonly customRepository: Repository<CustomAvailability>,
  ) {}

  async createRecurring(
    userId: number,
    createAvailabilityDto: CreateRecurringAvailabilityDto,
  ) {
    this.validateTimeRange(
      createAvailabilityDto.startTime,
      createAvailabilityDto.endTime,
    );

    const doctor = await this.findDoctorProfile(userId);
    await this.ensureNoRecurringConflict(doctor.id, createAvailabilityDto);

    const availability = this.recurringRepository.create({
      ...createAvailabilityDto,
      doctor,
    });

    try {
      return await this.recurringRepository.save(availability);
    } catch (error) {
      this.handleAvailabilitySaveError(error);
    }
  }

  async findRecurring(userId: number) {
    const doctor = await this.findDoctorProfile(userId);

    return this.recurringRepository.find({
      where: { doctor: { id: doctor.id } },
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
  }

  async updateRecurring(
    userId: number,
    availabilityId: number,
    updateAvailabilityDto: UpdateRecurringAvailabilityDto,
  ) {
    const hasUpdatableField =
      updateAvailabilityDto.dayOfWeek !== undefined ||
      updateAvailabilityDto.startTime !== undefined ||
      updateAvailabilityDto.endTime !== undefined;

    if (!hasUpdatableField) {
      throw new BadRequestException(
        'At least one availability field is required to update.',
      );
    }

    const doctor = await this.findDoctorProfile(userId);
    const availability = await this.recurringRepository.findOne({
      where: {
        id: availabilityId,
        doctor: { id: doctor.id },
      },
    });

    if (!availability) {
      throw new NotFoundException('Recurring availability not found.');
    }

    const candidate = {
      dayOfWeek: updateAvailabilityDto.dayOfWeek ?? availability.dayOfWeek,
      startTime: updateAvailabilityDto.startTime ?? availability.startTime,
      endTime: updateAvailabilityDto.endTime ?? availability.endTime,
    };

    this.validateTimeRange(candidate.startTime, candidate.endTime);
    await this.ensureNoRecurringConflict(doctor.id, candidate, availability.id);

    availability.dayOfWeek = candidate.dayOfWeek;
    availability.startTime = this.normalizeTime(candidate.startTime);
    availability.endTime = this.normalizeTime(candidate.endTime);

    try {
      return await this.recurringRepository.save(availability);
    } catch (error) {
      this.handleAvailabilitySaveError(error);
    }
  }

  async removeRecurring(userId: number, availabilityId: number) {
    const doctor = await this.findDoctorProfile(userId);
    const availability = await this.recurringRepository.findOne({
      where: {
        id: availabilityId,
        doctor: { id: doctor.id },
      },
    });

    if (!availability) {
      throw new NotFoundException('Recurring availability not found.');
    }

    await this.recurringRepository.remove(availability);

    return {
      message: 'Recurring availability deleted successfully.',
    };
  }

  async createCustomOverride(
    userId: number,
    createAvailabilityDto: CreateCustomAvailabilityDto,
  ) {
    this.validateDate(createAvailabilityDto.date);
    this.validateTimeRange(
      createAvailabilityDto.startTime,
      createAvailabilityDto.endTime,
    );

    const doctor = await this.findDoctorProfile(userId);
    await this.ensureNoCustomConflict(doctor.id, createAvailabilityDto);

    const availability = this.customRepository.create({
      ...createAvailabilityDto,
      doctor,
    });

    try {
      return await this.customRepository.save(availability);
    } catch (error) {
      this.handleAvailabilitySaveError(error);
    }
  }

  async removeCustomOverride(userId: number, availabilityId: number) {
    const doctor = await this.findDoctorProfile(userId);
    const availability = await this.customRepository.findOne({
      where: {
        id: availabilityId,
        doctor: { id: doctor.id },
      },
    });

    if (!availability) {
      throw new NotFoundException('Custom availability override not found.');
    }

    await this.customRepository.remove(availability);

    return {
      message: 'Custom availability override deleted successfully.',
    };
  }

  async findForDate(userId: number, date: string) {
    this.validateDate(date);

    const doctor = await this.findDoctorProfile(userId);
    const customAvailability = await this.customRepository.find({
      where: { doctor: { id: doctor.id }, date },
      order: { startTime: 'ASC' },
    });

    if (customAvailability.length > 0) {
      return {
        date,
        source: 'CUSTOM_OVERRIDE',
        availability: customAvailability,
      };
    }

    const dayOfWeek = this.getDayOfWeek(date);
    const recurringAvailability = await this.recurringRepository.find({
      where: { doctor: { id: doctor.id }, dayOfWeek },
      order: { startTime: 'ASC' },
    });

    if (recurringAvailability.length === 0) {
      throw new NotFoundException('No availability found for this date.');
    }

    return {
      date,
      dayOfWeek,
      source: 'RECURRING',
      availability: recurringAvailability,
    };
  }

  private async findDoctorProfile(userId: number) {
    const doctor = await this.doctorRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!doctor) {
      throw new NotFoundException(
        'Doctor profile not found. Create a doctor profile before managing availability.',
      );
    }

    return doctor;
  }

  private async ensureNoRecurringConflict(
    doctorId: number,
    candidate: Pick<
      RecurringAvailability,
      'dayOfWeek' | 'startTime' | 'endTime'
    >,
    excludeId?: number,
  ) {
    const existingSlots = await this.recurringRepository.find({
      where: {
        doctor: { id: doctorId },
        dayOfWeek: candidate.dayOfWeek,
      },
    });

    this.ensureNoSlotConflict(existingSlots, candidate, excludeId);
  }

  private async ensureNoCustomConflict(
    doctorId: number,
    candidate: Pick<CustomAvailability, 'date' | 'startTime' | 'endTime'>,
  ) {
    const existingSlots = await this.customRepository.find({
      where: {
        doctor: { id: doctorId },
        date: candidate.date,
      },
    });

    this.ensureNoSlotConflict(existingSlots, candidate);
  }

  private ensureNoSlotConflict(
    existingSlots: Array<{
      id: number;
      startTime: string;
      endTime: string;
    }>,
    candidate: { startTime: string; endTime: string },
    excludeId?: number,
  ) {
    const candidateStart = this.toMinutes(candidate.startTime);
    const candidateEnd = this.toMinutes(candidate.endTime);

    for (const slot of existingSlots) {
      if (slot.id === excludeId) {
        continue;
      }

      const existingStart = this.toMinutes(slot.startTime);
      const existingEnd = this.toMinutes(slot.endTime);
      const isDuplicate =
        candidateStart === existingStart && candidateEnd === existingEnd;
      const isOverlapping =
        candidateStart < existingEnd && candidateEnd > existingStart;

      if (isDuplicate) {
        throw new ConflictException('Duplicate availability slot.');
      }

      if (isOverlapping) {
        throw new ConflictException(
          'Availability slot overlaps with an existing slot.',
        );
      }
    }
  }

  private validateTimeRange(startTime: string, endTime: string) {
    if (this.toMinutes(startTime) >= this.toMinutes(endTime)) {
      throw new BadRequestException('startTime must be earlier than endTime.');
    }
  }

  private validateDate(date: string) {
    const [year, month, day] = date.split('-').map(Number);
    const parsedDate = new Date(Date.UTC(year, month - 1, day));

    const isValidDate =
      parsedDate.getUTCFullYear() === year &&
      parsedDate.getUTCMonth() === month - 1 &&
      parsedDate.getUTCDate() === day;

    if (!isValidDate) {
      throw new BadRequestException(
        'date must be a valid calendar date in YYYY-MM-DD format.',
      );
    }
  }

  private getDayOfWeek(date: string): DayOfWeek {
    const [year, month, day] = date.split('-').map(Number);
    const dayIndex = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    return WEEK_DAYS[dayIndex];
  }

  private toMinutes(time: string): number {
    const [hour, minute] = this.normalizeTime(time).split(':').map(Number);
    return hour * 60 + minute;
  }

  private normalizeTime(time: string): string {
    return time.slice(0, 5);
  }

  private handleAvailabilitySaveError(error: unknown): never {
    if (
      error instanceof QueryFailedError &&
      (error as QueryFailedError & { code?: string }).code === '23505'
    ) {
      throw new ConflictException('Duplicate availability slot.');
    }

    throw error;
  }
}
