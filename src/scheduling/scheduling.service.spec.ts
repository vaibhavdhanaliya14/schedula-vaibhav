import { BadRequestException, ConflictException } from '@nestjs/common';
import { AppointmentStatus } from './enums/appointment-status.enum';
import { SchedulingType } from './enums/scheduling-type.enum';
import { SchedulingService } from './scheduling.service';

const futureStart = new Date('2100-01-01T10:00:00.000Z');
const futureEnd = new Date('2100-01-01T11:00:00.000Z');

describe('SchedulingService', () => {
  let service: SchedulingService;
  let scheduleRepository: ReturnType<typeof createScheduleRepositoryMock>;
  let appointmentRepository: ReturnType<typeof createAppointmentRepositoryMock>;
  let doctorRepository: ReturnType<typeof createDoctorRepositoryMock>;
  let patientRepository: ReturnType<typeof createPatientRepositoryMock>;

  const doctor = { id: 7, fullName: 'Dr Stream', user: { id: 1 } };
  const patient = { id: 11, fullName: 'Patient One', user: { id: 2 } };

  const createScheduleRepositoryMock = () => ({
    create: jest.fn((schedule: Record<string, unknown>) => ({
      id: 20,
      ...schedule,
    })),
    save: jest.fn((schedule: Record<string, unknown>) =>
      Promise.resolve(schedule),
    ),
    find: jest.fn(() => Promise.resolve([] as Record<string, unknown>[])),
    findOne: jest.fn(),
  });

  const createAppointmentRepositoryMock = () => ({
    create: jest.fn((appointment: Record<string, unknown>) => ({
      id: 30,
      ...appointment,
    })),
    save: jest.fn((appointment: Record<string, unknown>) =>
      Promise.resolve(appointment),
    ),
  });

  const createDoctorRepositoryMock = () => ({
    findOne: jest.fn(() => Promise.resolve(doctor)),
  });

  const createPatientRepositoryMock = () => ({
    findOne: jest.fn(() => Promise.resolve(patient)),
  });

  beforeEach(() => {
    scheduleRepository = createScheduleRepositoryMock();
    appointmentRepository = createAppointmentRepositoryMock();
    doctorRepository = createDoctorRepositoryMock();
    patientRepository = createPatientRepositoryMock();

    service = new SchedulingService(
      scheduleRepository as never,
      appointmentRepository as never,
      doctorRepository as never,
      patientRepository as never,
    );
  });

  it('creates a stream schedule with exact slots and buffer time', async () => {
    const result = await service.createDoctorSchedule(1, {
      schedulingType: SchedulingType.Stream,
      startAt: futureStart.toISOString(),
      endAt: futureEnd.toISOString(),
      slotDurationMinutes: 15,
      bufferTimeMinutes: 5,
    });

    expect(result).toMatchObject({
      scheduleId: 20,
      schedulingType: SchedulingType.Stream,
      slotDurationMinutes: 15,
      bufferTimeMinutes: 5,
    });
    expect(result.slots).toHaveLength(3);
    expect(result.slots[1]).toMatchObject({
      startAt: '2100-01-01T10:20:00.000Z',
      endAt: '2100-01-01T10:35:00.000Z',
      isBooked: false,
    });
  });

  it('books a stream appointment for one exact slot', async () => {
    scheduleRepository.findOne.mockResolvedValue({
      id: 20,
      doctor,
      schedulingType: SchedulingType.Stream,
      startAt: futureStart,
      endAt: futureEnd,
      slotDurationMinutes: 15,
      bufferTimeMinutes: 5,
      appointments: [],
    });

    const result = await service.bookAppointment(2, {
      scheduleId: 20,
      slotStartAt: futureStart.toISOString(),
    });

    expect(result).toMatchObject({
      appointmentId: 30,
      schedulingType: SchedulingType.Stream,
      tokenNumber: null,
      status: AppointmentStatus.Booked,
    });
    expect(result.appointmentTime).toEqual({
      startAt: '2100-01-01T10:00:00.000Z',
      endAt: '2100-01-01T10:15:00.000Z',
    });
  });

  it('assigns the next token number for wave booking', async () => {
    scheduleRepository.findOne.mockResolvedValue({
      id: 21,
      doctor,
      schedulingType: SchedulingType.Wave,
      startAt: futureStart,
      endAt: futureEnd,
      maxPatients: 5,
      appointments: [
        {
          id: 1,
          patient: { id: 99 },
          tokenNumber: 1,
          startAt: futureStart,
          endAt: futureEnd,
        },
      ],
    });

    const result = await service.bookAppointment(2, { scheduleId: 21 });

    expect(result).toMatchObject({
      appointmentId: 30,
      schedulingType: SchedulingType.Wave,
      tokenNumber: 2,
    });
    expect(result.appointmentTime).toEqual({
      startAt: '2100-01-01T10:00:00.000Z',
      endAt: '2100-01-01T11:00:00.000Z',
    });
  });

  it('blocks wave overbooking when capacity is full', async () => {
    scheduleRepository.findOne.mockResolvedValue({
      id: 21,
      doctor,
      schedulingType: SchedulingType.Wave,
      startAt: futureStart,
      endAt: futureEnd,
      maxPatients: 1,
      appointments: [{ id: 1, patient: { id: 99 } }],
    });

    await expect(
      service.bookAppointment(2, { scheduleId: 21 }),
    ).rejects.toThrow(ConflictException);
  });

  it('blocks duplicate patient booking in the same schedule', async () => {
    scheduleRepository.findOne.mockResolvedValue({
      id: 21,
      doctor,
      schedulingType: SchedulingType.Wave,
      startAt: futureStart,
      endAt: futureEnd,
      maxPatients: 5,
      appointments: [{ id: 1, patient }],
    });

    await expect(
      service.bookAppointment(2, { scheduleId: 21 }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects invalid stream configurations that generate no slots', async () => {
    await expect(
      service.createDoctorSchedule(1, {
        schedulingType: SchedulingType.Stream,
        startAt: futureStart.toISOString(),
        endAt: new Date('2100-01-01T10:10:00.000Z').toISOString(),
        slotDurationMinutes: 15,
        bufferTimeMinutes: 0,
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
