import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from '../doctor/entities/doctor.entity';
import { Patient } from '../patient/entities/patient.entity';
import { BookAppointmentDto } from './dto/book-appointment.dto';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { Appointment } from './entities/appointment.entity';
import { DoctorSchedule } from './entities/doctor-schedule.entity';
import { AppointmentStatus } from './enums/appointment-status.enum';
import { SchedulingType } from './enums/scheduling-type.enum';

type GeneratedStreamSlot = {
  startAt: Date;
  endAt: Date;
};

@Injectable()
export class SchedulingService {
  constructor(
    @InjectRepository(DoctorSchedule)
    private readonly scheduleRepository: Repository<DoctorSchedule>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
  ) {}

  async createDoctorSchedule(userId: number, dto: CreateScheduleDto) {
    const doctor = await this.findDoctorProfileByUser(userId);
    const startAt = this.parseDate(dto.startAt, 'startAt');
    const endAt = this.parseDate(dto.endAt, 'endAt');

    await this.validateScheduleConfig(doctor.id, dto, startAt, endAt);

    const schedule = this.scheduleRepository.create({
      doctor,
      schedulingType: dto.schedulingType,
      startAt,
      endAt,
      slotDurationMinutes:
        dto.schedulingType === SchedulingType.Stream
          ? dto.slotDurationMinutes
          : null,
      bufferTimeMinutes:
        dto.schedulingType === SchedulingType.Stream
          ? (dto.bufferTimeMinutes ?? 0)
          : 0,
      maxPatients:
        dto.schedulingType === SchedulingType.Wave ? dto.maxPatients : null,
    });

    const savedSchedule = await this.scheduleRepository.save(schedule);
    return this.toScheduleResponse(savedSchedule, []);
  }

  async getDoctorAvailability(doctorId: number) {
    const doctor = await this.doctorRepository.findOne({
      where: { id: doctorId },
    });
    if (!doctor) {
      throw new NotFoundException('Doctor not found.');
    }

    const schedules = await this.scheduleRepository.find({
      where: { doctor: { id: doctorId } },
      relations: { appointments: true },
      order: { startAt: 'ASC' },
    });

    return {
      doctorId,
      schedules: schedules.map((schedule) =>
        this.toScheduleResponse(schedule, schedule.appointments ?? []),
      ),
    };
  }

  async getPatientAppointments(patientUserId: number) {
    const patient = await this.findPatientProfileByUser(patientUserId);

    const appointments = await this.appointmentRepository.find({
      where: { patient: { id: patient.id } },
      relations: { doctor: true, patient: true },
      order: { startAt: 'DESC' },
    });

    return appointments.map((appointment) =>
      this.toPatientAppointmentResponse(appointment),
    );
  }

  async getDoctorAppointments(doctorUserId: number) {
    const doctor = await this.findDoctorProfileByUser(doctorUserId);

    const appointments = await this.appointmentRepository.find({
      where: { doctor: { id: doctor.id } },
      relations: { doctor: true, patient: true },
      order: { startAt: 'DESC' },
    });

    return appointments.map((appointment) =>
      this.toDoctorAppointmentResponse(appointment),
    );
  }

  async cancelAppointment(patientUserId: number, appointmentId: number) {
    const patient = await this.findPatientProfileByUser(patientUserId);

    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId },
      relations: { doctor: true, patient: true },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found.');
    }

    if (appointment.patient.id !== patient.id) {
      throw new ForbiddenException(
        'You are not allowed to cancel this appointment.',
      );
    }

    if (appointment.status === AppointmentStatus.Cancelled) {
      throw new ConflictException('Appointment is already cancelled.');
    }

    if (this.isWithinThirtyMinuteCutoff(appointment.startAt)) {
      throw new BadRequestException(
        'Appointments starting within 30 minutes cannot be cancelled.',
      );
    }

    appointment.status = AppointmentStatus.Cancelled;

    const savedAppointment = await this.appointmentRepository.save(appointment);
    return this.toAppointmentResponse(savedAppointment);
  }

  async rescheduleAppointment(
    patientUserId: number,
    appointmentId: number,
    dto: BookAppointmentDto,
  ) {
    const patient = await this.findPatientProfileByUser(patientUserId);

    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId },
      relations: { doctor: true, patient: true, schedule: true },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found.');
    }

    if (appointment.patient.id !== patient.id) {
      throw new ForbiddenException(
        'You are not allowed to reschedule this appointment.',
      );
    }

    if (appointment.status === AppointmentStatus.Cancelled) {
      throw new ConflictException('Cancelled appointments cannot be rescheduled.');
    }

    if (appointment.startAt <= new Date()) {
      throw new BadRequestException('Past appointments cannot be rescheduled.');
    }

    if (this.isWithinThirtyMinuteCutoff(appointment.startAt)) {
      throw new BadRequestException(
        'Appointments starting within 30 minutes cannot be rescheduled.',
      );
    }

    const targetSchedule = await this.scheduleRepository.findOne({
      where: { id: dto.scheduleId },
      relations: { doctor: true, appointments: { patient: true } },
    });

    if (!targetSchedule) {
      throw new NotFoundException('Schedule not found.');
    }

    if (targetSchedule.schedulingType !== appointment.schedulingType) {
      throw new BadRequestException('Invalid scheduling type for this appointment.');
    }

    if (appointment.schedulingType === SchedulingType.Stream) {
      return this.rescheduleStreamAppointment(patient, appointment, targetSchedule, dto);
    }

    return this.rescheduleWaveAppointment(patient, appointment, targetSchedule);
  }

  async bookAppointment(patientUserId: number, dto: BookAppointmentDto) {
    const patient = await this.findPatientProfileByUser(patientUserId);
    const schedule = await this.scheduleRepository.findOne({
      where: { id: dto.scheduleId },
      relations: { doctor: true, appointments: { patient: true } },
    });
    if (!schedule) {
      throw new NotFoundException('Schedule not found.');
    }

    const appointments = schedule.appointments ?? [];
    if (
      appointments.some((appointment) => appointment.patient?.id === patient.id)
    ) {
      throw new ConflictException(
        'Duplicate booking is not allowed for the same schedule.',
      );
    }

    if (schedule.schedulingType === SchedulingType.Stream) {
      return this.bookStreamAppointment(patient, schedule, appointments, dto);
    }

    return this.bookWaveAppointment(patient, schedule, appointments);
  }

  private async bookStreamAppointment(
    patient: Patient,
    schedule: DoctorSchedule,
    appointments: Appointment[],
    dto: BookAppointmentDto,
  ) {
    if (!dto.slotStartAt) {
      throw new BadRequestException(
        'slotStartAt is required for STREAM scheduling.',
      );
    }

    const requestedStartAt = this.parseDate(dto.slotStartAt, 'slotStartAt');
    const slots = this.generateStreamSlots(schedule);
    const selectedSlot = slots.find(
      (slot) => slot.startAt.getTime() === requestedStartAt.getTime(),
    );

    if (!selectedSlot) {
      throw new BadRequestException(
        'Requested stream slot does not exist for this schedule.',
      );
    }

    if (selectedSlot.startAt <= new Date()) {
      throw new BadRequestException('Past slots cannot be booked.');
    }

    if (
      appointments.some(
        (appointment) =>
          appointment.startAt.getTime() === selectedSlot.startAt.getTime(),
      )
    ) {
      throw new ConflictException('This stream slot is already booked.');
    }

    const appointment = this.appointmentRepository.create({
      schedule,
      doctor: schedule.doctor,
      patient,
      schedulingType: SchedulingType.Stream,
      startAt: selectedSlot.startAt,
      endAt: selectedSlot.endAt,
      tokenNumber: null,
      status: AppointmentStatus.Booked,
    });

    const savedAppointment = await this.appointmentRepository.save(appointment);
    return this.toAppointmentResponse(savedAppointment);
  }

  private async bookWaveAppointment(
    patient: Patient,
    schedule: DoctorSchedule,
    appointments: Appointment[],
  ) {
    if (schedule.startAt <= new Date()) {
      throw new BadRequestException('Past waves cannot be booked.');
    }

    const bookedCount = appointments.length;
    const maxPatients = schedule.maxPatients ?? 0;
    if (bookedCount >= maxPatients) {
      throw new ConflictException('Wave is full.');
    }

    const appointment = this.appointmentRepository.create({
      schedule,
      doctor: schedule.doctor,
      patient,
      schedulingType: SchedulingType.Wave,
      startAt: schedule.startAt,
      endAt: schedule.endAt,
      tokenNumber: bookedCount + 1,
      status: AppointmentStatus.Booked,
    });

    const savedAppointment = await this.appointmentRepository.save(appointment);
    return this.toAppointmentResponse(savedAppointment);
  }

  private async rescheduleStreamAppointment(
    patient: Patient,
    appointment: Appointment,
    targetSchedule: DoctorSchedule,
    dto: BookAppointmentDto,
  ) {
    if (!dto.slotStartAt) {
      throw new BadRequestException(
        'slotStartAt is required for STREAM scheduling.',
      );
    }

    if (appointment.schedule.id === targetSchedule.id) {
      const sameSlot = appointment.startAt.getTime() === new Date(dto.slotStartAt).getTime();
      if (sameSlot) {
        throw new ConflictException('Rescheduling to the same slot/time is not allowed.');
      }
    }

    const requestedStartAt = this.parseDate(dto.slotStartAt, 'slotStartAt');
    const targetSlots = this.generateStreamSlots(targetSchedule);
    const selectedSlot = targetSlots.find(
      (slot) => slot.startAt.getTime() === requestedStartAt.getTime(),
    );

    if (!selectedSlot) {
      const suggestion = this.findNextAvailableStreamSlot(targetSchedule, appointment.id);
      return {
        message: 'Requested stream slot is unavailable. Next available appointment suggestion:',
        suggestedAppointment: suggestion,
      };
    }

    if (selectedSlot.startAt <= new Date()) {
      const suggestion = this.findNextAvailableStreamSlot(targetSchedule, appointment.id);
      return {
        message: 'Requested stream slot is unavailable. Next available appointment suggestion:',
        suggestedAppointment: suggestion,
      };
    }

    const isAlreadyBooked = (targetSchedule.appointments ?? []).some(
      (existingAppointment) =>
        existingAppointment.id !== appointment.id &&
        existingAppointment.startAt.getTime() === selectedSlot.startAt.getTime(),
    );

    if (isAlreadyBooked) {
      const suggestion = this.findNextAvailableStreamSlot(targetSchedule, appointment.id);
      return {
        message: 'Requested stream slot is unavailable. Next available appointment suggestion:',
        suggestedAppointment: suggestion,
      };
    }

    appointment.schedule = targetSchedule;
    appointment.doctor = targetSchedule.doctor;
    appointment.startAt = selectedSlot.startAt;
    appointment.endAt = selectedSlot.endAt;
    appointment.status = AppointmentStatus.Booked;

    const savedAppointment = await this.appointmentRepository.save(appointment);
    return this.toAppointmentResponse(savedAppointment);
  }

  private async rescheduleWaveAppointment(
    patient: Patient,
    appointment: Appointment,
    targetSchedule: DoctorSchedule,
  ) {
    if (appointment.schedule.id === targetSchedule.id) {
      if (
        appointment.startAt.getTime() === targetSchedule.startAt.getTime() &&
        appointment.endAt.getTime() === targetSchedule.endAt.getTime()
      ) {
        throw new ConflictException('Rescheduling to the same slot/time is not allowed.');
      }
    }

    if (targetSchedule.startAt <= new Date()) {
      throw new BadRequestException('Past waves cannot be rescheduled.');
    }

    const bookedCount = (targetSchedule.appointments ?? []).filter(
      (existingAppointment) => existingAppointment.id !== appointment.id,
    ).length;
    const maxPatients = targetSchedule.maxPatients ?? 0;

    if (bookedCount >= maxPatients) {
      return {
        message: 'Requested wave is unavailable. Next available appointment suggestion:',
        suggestedAppointment: this.findNextAvailableWaveSuggestion(targetSchedule, appointment.id),
      };
    }

    appointment.schedule = targetSchedule;
    appointment.doctor = targetSchedule.doctor;
    appointment.startAt = targetSchedule.startAt;
    appointment.endAt = targetSchedule.endAt;
    appointment.tokenNumber = bookedCount + 1;
    appointment.status = AppointmentStatus.Booked;

    const savedAppointment = await this.appointmentRepository.save(appointment);
    return this.toAppointmentResponse(savedAppointment);
  }

  private isWithinThirtyMinuteCutoff(date: Date) {
    const now = new Date();
    const cutoffMs = 30 * 60 * 1000;
    return date.getTime() - now.getTime() <= cutoffMs;
  }

  private findNextAvailableStreamSlot(schedule: DoctorSchedule, ignoredAppointmentId?: number) {
    const now = new Date();
    const alternatives = this.generateStreamSlots(schedule)
      .filter((slot) => slot.startAt > now)
      .filter(
        (slot) =>
          !(schedule.appointments ?? []).some(
            (existingAppointment) =>
              existingAppointment.id !== ignoredAppointmentId &&
              existingAppointment.startAt.getTime() === slot.startAt.getTime(),
          ),
      );

    const next = alternatives[0];
    if (!next) {
      return null;
    }

    return {
      startAt: next.startAt.toISOString(),
      endAt: next.endAt.toISOString(),
    };
  }

  private findNextAvailableWaveSuggestion(schedule: DoctorSchedule, ignoredAppointmentId?: number) {
    const occupied = (schedule.appointments ?? []).filter(
      (existingAppointment) => existingAppointment.id !== ignoredAppointmentId,
    ).length;
    const remaining = (schedule.maxPatients ?? 0) - occupied;

    if (remaining <= 0) {
      return null;
    }

    return {
      startAt: schedule.startAt.toISOString(),
      endAt: schedule.endAt.toISOString(),
    };
  }

  private async validateScheduleConfig(
    doctorId: number,
    dto: CreateScheduleDto,
    startAt: Date,
    endAt: Date,
  ) {
    if (startAt >= endAt) {
      throw new BadRequestException('startAt must be before endAt.');
    }

    if (startAt <= new Date()) {
      throw new BadRequestException('Schedule cannot start in the past.');
    }

    const existingSchedules = await this.scheduleRepository.find({
      where: { doctor: { id: doctorId } },
    });
    const hasConflict = existingSchedules.some(
      (schedule) => startAt < schedule.endAt && endAt > schedule.startAt,
    );
    if (hasConflict) {
      throw new ConflictException(
        'Conflicting schedule already exists for this doctor.',
      );
    }

    if (dto.schedulingType === SchedulingType.Stream) {
      const slotDuration = dto.slotDurationMinutes ?? 0;
      const bufferTime = dto.bufferTimeMinutes ?? 0;
      if (slotDuration <= 0) {
        throw new BadRequestException(
          'slotDurationMinutes must be greater than 0 for STREAM scheduling.',
        );
      }
      if (bufferTime < 0) {
        throw new BadRequestException('bufferTimeMinutes cannot be negative.');
      }
      if (
        this.generateStreamSlotsFromConfig(
          startAt,
          endAt,
          slotDuration,
          bufferTime,
        ).length === 0
      ) {
        throw new BadRequestException(
          'Stream configuration does not produce any valid slots.',
        );
      }
    }

    if (dto.schedulingType === SchedulingType.Wave) {
      if (!dto.maxPatients || dto.maxPatients <= 0) {
        throw new BadRequestException(
          'maxPatients must be greater than 0 for WAVE scheduling.',
        );
      }
    }
  }

  private async findDoctorProfileByUser(userId: number) {
    const doctor = await this.doctorRepository.findOne({
      where: { user: { id: userId } },
    });
    if (!doctor) {
      throw new NotFoundException('Doctor profile not found.');
    }
    return doctor;
  }

  private async findPatientProfileByUser(userId: number) {
    const patient = await this.patientRepository.findOne({
      where: { user: { id: userId } },
    });
    if (!patient) {
      throw new NotFoundException('Patient profile not found.');
    }
    return patient;
  }

  private parseDate(value: string, fieldName: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${fieldName} must be a valid date.`);
    }
    return date;
  }

  private generateStreamSlots(schedule: DoctorSchedule) {
    return this.generateStreamSlotsFromConfig(
      schedule.startAt,
      schedule.endAt,
      schedule.slotDurationMinutes ?? 0,
      schedule.bufferTimeMinutes ?? 0,
    );
  }

  private generateStreamSlotsFromConfig(
    startAt: Date,
    endAt: Date,
    slotDurationMinutes: number,
    bufferTimeMinutes: number,
  ): GeneratedStreamSlot[] {
    const slots: GeneratedStreamSlot[] = [];
    let cursor = new Date(startAt);
    const slotMs = slotDurationMinutes * 60 * 1000;
    const bufferMs = bufferTimeMinutes * 60 * 1000;

    while (cursor.getTime() + slotMs <= endAt.getTime()) {
      const slotStartAt = new Date(cursor);
      const slotEndAt = new Date(cursor.getTime() + slotMs);
      slots.push({ startAt: slotStartAt, endAt: slotEndAt });
      cursor = new Date(slotEndAt.getTime() + bufferMs);
    }

    return slots;
  }

  private toScheduleResponse(
    schedule: DoctorSchedule,
    appointments: Appointment[],
  ) {
    if (schedule.schedulingType === SchedulingType.Stream) {
      const slots = this.generateStreamSlots(schedule).map((slot) => ({
        startAt: slot.startAt.toISOString(),
        endAt: slot.endAt.toISOString(),
        isBooked: appointments.some(
          (appointment) =>
            appointment.startAt.getTime() === slot.startAt.getTime(),
        ),
      }));

      return {
        scheduleId: schedule.id,
        schedulingType: SchedulingType.Stream,
        availability: {
          startAt: schedule.startAt.toISOString(),
          endAt: schedule.endAt.toISOString(),
        },
        slotDurationMinutes: schedule.slotDurationMinutes,
        bufferTimeMinutes: schedule.bufferTimeMinutes,
        slots,
      };
    }

    const booked = appointments.length;
    const capacity = schedule.maxPatients ?? 0;

    return {
      scheduleId: schedule.id,
      schedulingType: SchedulingType.Wave,
      window: {
        startAt: schedule.startAt.toISOString(),
        endAt: schedule.endAt.toISOString(),
      },
      tokenBased: true,
      capacity,
      booked,
      available: Math.max(capacity - booked, 0),
    };
  }

  private toPatientAppointmentResponse(appointment: Appointment) {
    return {
      appointmentId: appointment.id,
      schedulingType: appointment.schedulingType,
      doctor: {
        id: appointment.doctor.id,
        fullName: appointment.doctor.fullName,
        specialization: appointment.doctor.specialization,
      },
      appointmentTime: {
        startAt: appointment.startAt.toISOString(),
        endAt: appointment.endAt.toISOString(),
      },
      status: appointment.status,
    };
  }

  private toDoctorAppointmentResponse(appointment: Appointment) {
    return {
      appointmentId: appointment.id,
      schedulingType: appointment.schedulingType,
      patient: {
        id: appointment.patient.id,
        fullName: appointment.patient.fullName,
      },
      appointmentTime: {
        startAt: appointment.startAt.toISOString(),
        endAt: appointment.endAt.toISOString(),
      },
      status: appointment.status,
    };
  }

  private toAppointmentResponse(appointment: Appointment) {
    return {
      appointmentId: appointment.id,
      schedulingType: appointment.schedulingType,
      appointmentTime: {
        startAt: appointment.startAt.toISOString(),
        endAt: appointment.endAt.toISOString(),
      },
      tokenNumber: appointment.tokenNumber,
      status: appointment.status,
    };
  }
}
