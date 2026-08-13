import { NotFoundException } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationType } from './notification-type.enum';

describe('NotificationService', () => {
  let notificationService: NotificationService;
  let notificationRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
  };
  let patientRepository: {
    findOne: jest.Mock;
  };

  const patient = {
    id: 11,
    user: { id: 2 },
  };

  beforeEach(() => {
    notificationRepository = {
      findOne: jest.fn(),
      create: jest.fn((body) => ({ ...body, id: 101 })),
      save: jest.fn((body) => Promise.resolve({ ...body, id: 101, createdAt: new Date('2100-01-04T00:00:00.000Z') })),
      find: jest.fn(),
    };

    patientRepository = {
      findOne: jest.fn().mockResolvedValue(patient),
    };

    notificationService = new NotificationService(
      notificationRepository as never,
      patientRepository as never,
    );
  });

  it('does not create duplicate notifications for the same appointment event', async () => {
    notificationRepository.findOne.mockResolvedValue({ id: 99, type: NotificationType.APPOINTMENT_BOOKED });

    const result = await notificationService.createAppointmentNotification(
      2,
      NotificationType.APPOINTMENT_BOOKED,
      'Appointment booked successfully',
      'Your appointment has been booked successfully.',
      42,
    );

    expect(result.id).toBe(99);
    expect(notificationRepository.save).not.toHaveBeenCalled();
  });

  it('returns notifications in newest-first order', async () => {
    notificationRepository.find.mockResolvedValue([
      { id: 2, createdAt: new Date('2100-01-03T00:00:00.000Z') },
      { id: 1, createdAt: new Date('2100-01-02T00:00:00.000Z') },
    ]);

    const result = await notificationService.getPatientNotifications(2);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(2);
    expect(result[1].id).toBe(1);
  });

  it('throws when patient profile is missing', async () => {
    patientRepository.findOne.mockResolvedValue(null);

    await expect(
      notificationService.createAppointmentNotification(
        99,
        NotificationType.APPOINTMENT_BOOKED,
        'Appointment booked successfully',
        'fallback message',
        42,
      ),
    ).rejects.toThrow(NotFoundException);
  });
});
