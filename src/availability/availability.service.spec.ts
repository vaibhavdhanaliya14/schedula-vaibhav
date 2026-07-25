import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { DayOfWeek } from './dto/day-of-week.enum';
import { CustomAvailability } from './entities/custom-availability.entity';
import { RecurringAvailability } from './entities/recurring-availability.entity';
import { Doctor } from '../doctor/entities/doctor.entity';

type MockRepository<T> = {
  findOne: jest.Mock<Promise<T | null>, unknown[]>;
  find: jest.Mock<Promise<T[]>, unknown[]>;
  create: jest.Mock<T, [T]>;
  save: jest.Mock<Promise<T>, [T]>;
  remove: jest.Mock<Promise<void>, [T]>;
};

function createMockRepository<T>(): MockRepository<T> {
  return {
    findOne: jest.fn() as jest.Mock<Promise<T | null>, unknown[]>,
    find: jest.fn() as jest.Mock<Promise<T[]>, unknown[]>,
    create: jest.fn((entity: T) => entity),
    save: jest.fn((entity: T) => Promise.resolve(entity)),
    remove: jest.fn(() => Promise.resolve()),
  };
}

describe('AvailabilityService', () => {
  let service: AvailabilityService;
  let doctorRepository: MockRepository<Doctor>;
  let recurringRepository: MockRepository<RecurringAvailability>;
  let customRepository: MockRepository<CustomAvailability>;

  const doctor = { id: 10, user: { id: 1 } } as Doctor;

  beforeEach(() => {
    doctorRepository = createMockRepository<Doctor>();
    recurringRepository = createMockRepository<RecurringAvailability>();
    customRepository = createMockRepository<CustomAvailability>();

    service = new AvailabilityService(
      doctorRepository as never,
      recurringRepository as never,
      customRepository as never,
    );
  });

  it('rejects invalid recurring time ranges', async () => {
    await expect(
      service.createRecurring(1, {
        dayOfWeek: DayOfWeek.Monday,
        startTime: '15:00',
        endTime: '13:00',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('requires a doctor profile before managing availability', async () => {
    doctorRepository.findOne.mockResolvedValue(null);

    await expect(
      service.createRecurring(1, {
        dayOfWeek: DayOfWeek.Monday,
        startTime: '10:00',
        endTime: '12:00',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects duplicate recurring availability', async () => {
    doctorRepository.findOne.mockResolvedValue(doctor);
    recurringRepository.find.mockResolvedValue([
      {
        id: 1,
        dayOfWeek: DayOfWeek.Monday,
        startTime: '10:00',
        endTime: '12:00',
      },
    ]);

    await expect(
      service.createRecurring(1, {
        dayOfWeek: DayOfWeek.Monday,
        startTime: '10:00',
        endTime: '12:00',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects overlapping recurring availability', async () => {
    doctorRepository.findOne.mockResolvedValue(doctor);
    recurringRepository.find.mockResolvedValue([
      {
        id: 1,
        dayOfWeek: DayOfWeek.Monday,
        startTime: '10:00',
        endTime: '12:00',
      },
    ]);

    await expect(
      service.createRecurring(1, {
        dayOfWeek: DayOfWeek.Monday,
        startTime: '11:00',
        endTime: '13:00',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('allows adjacent recurring availability slots', async () => {
    const savedSlot = {
      id: 2,
      dayOfWeek: DayOfWeek.Monday,
      startTime: '12:00',
      endTime: '13:00',
      doctor,
    } as RecurringAvailability;

    doctorRepository.findOne.mockResolvedValue(doctor);
    recurringRepository.find.mockResolvedValue([
      {
        id: 1,
        dayOfWeek: DayOfWeek.Monday,
        startTime: '10:00',
        endTime: '12:00',
      },
    ]);
    recurringRepository.create.mockReturnValue(savedSlot);
    recurringRepository.save.mockResolvedValue(savedSlot);

    await expect(
      service.createRecurring(1, {
        dayOfWeek: DayOfWeek.Monday,
        startTime: '12:00',
        endTime: '13:00',
      }),
    ).resolves.toBe(savedSlot);
  });

  it('rejects invalid custom availability dates', async () => {
    await expect(
      service.createCustomOverride(1, {
        date: '2026-02-31',
        startTime: '14:00',
        endTime: '15:00',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('uses custom availability instead of recurring availability for the same date', async () => {
    const customSlot = {
      id: 3,
      date: '2026-06-15',
      startTime: '14:00',
      endTime: '15:00',
    } as CustomAvailability;

    doctorRepository.findOne.mockResolvedValue(doctor);
    customRepository.find.mockResolvedValue([customSlot]);

    await expect(service.findForDate(1, '2026-06-15')).resolves.toEqual({
      date: '2026-06-15',
      source: 'CUSTOM_OVERRIDE',
      availability: [customSlot],
    });
    expect(recurringRepository.find).not.toHaveBeenCalled();
  });

  it('falls back to recurring availability when no custom override exists', async () => {
    const recurringSlot = {
      id: 4,
      dayOfWeek: DayOfWeek.Monday,
      startTime: '13:00',
      endTime: '15:00',
    } as RecurringAvailability;

    doctorRepository.findOne.mockResolvedValue(doctor);
    customRepository.find.mockResolvedValue([]);
    recurringRepository.find.mockResolvedValue([recurringSlot]);

    await expect(service.findForDate(1, '2026-06-15')).resolves.toEqual({
      date: '2026-06-15',
      dayOfWeek: DayOfWeek.Monday,
      source: 'RECURRING',
      availability: [recurringSlot],
    });
  });

  it('returns not found for an unavailable date', async () => {
    doctorRepository.findOne.mockResolvedValue(doctor);
    customRepository.find.mockResolvedValue([]);
    recurringRepository.find.mockResolvedValue([]);

    await expect(service.findForDate(1, '2026-06-16')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('deletes a custom override that belongs to the doctor', async () => {
    const customSlot = {
      id: 5,
      date: '2026-06-15',
      startTime: '14:00',
      endTime: '15:00',
    } as CustomAvailability;

    doctorRepository.findOne.mockResolvedValue(doctor);
    customRepository.findOne.mockResolvedValue(customSlot);

    await expect(service.removeCustomOverride(1, 5)).resolves.toEqual({
      message: 'Custom availability override deleted successfully.',
    });
    expect(customRepository.remove).toHaveBeenCalledWith(customSlot);
  });
});
