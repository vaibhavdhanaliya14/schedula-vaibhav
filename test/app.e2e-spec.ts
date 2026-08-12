import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { RolesGuard } from '../src/auth/guards/roles.guard';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { Role } from '../src/doctor/dto/role.enum';
import { SchedulingType } from '../src/scheduling/enums/scheduling-type.enum';
import { SchedulingController } from '../src/scheduling/scheduling.controller';
import { SchedulingService } from '../src/scheduling/scheduling.service';

describe('SchedulingController (e2e)', () => {
  let app: INestApplication<App>;
  const schedulingService = {
    createDoctorSchedule: jest.fn(),
    getDoctorAvailability: jest.fn(),
    bookAppointment: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SchedulingController],
      providers: [{ provide: SchedulingService, useValue: schedulingService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const request = context.switchToHttp().getRequest<{
            headers: Record<string, string | undefined>;
            user?: { id: number; email: string; role: Role };
          }>();
          request.user = {
            id: Number(request.headers['x-user-id'] ?? 1),
            email: 'test@example.com',
            role:
              (request.headers['x-role'] as Role | undefined) ?? Role.Patient,
          };
          return true;
        },
      })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('creates a doctor schedule', () => {
    schedulingService.createDoctorSchedule.mockResolvedValue({
      scheduleId: 1,
      schedulingType: SchedulingType.Stream,
      slots: [],
    });

    return request(app.getHttpServer())
      .post('/scheduling/doctor/schedules')
      .set('x-role', Role.Doctor)
      .set('x-user-id', '10')
      .send({
        schedulingType: SchedulingType.Stream,
        startAt: '2100-01-01T10:00:00.000Z',
        endAt: '2100-01-01T11:00:00.000Z',
        slotDurationMinutes: 15,
        bufferTimeMinutes: 5,
      })
      .expect(201)
      .expect({
        scheduleId: 1,
        schedulingType: SchedulingType.Stream,
        slots: [],
      });
  });

  it('returns doctor availability', () => {
    schedulingService.getDoctorAvailability.mockResolvedValue({
      doctorId: 7,
      schedules: [],
    });

    return request(app.getHttpServer())
      .get('/scheduling/doctors/7/availability')
      .set('x-role', Role.Patient)
      .expect(200)
      .expect({ doctorId: 7, schedules: [] });
  });

  it('books a patient appointment', () => {
    schedulingService.bookAppointment.mockResolvedValue({
      appointmentId: 2,
      schedulingType: SchedulingType.Wave,
      appointmentTime: {
        startAt: '2100-01-01T10:00:00.000Z',
        endAt: '2100-01-01T11:00:00.000Z',
      },
      tokenNumber: 1,
      status: 'BOOKED',
    });

    return request(app.getHttpServer())
      .post('/scheduling/patient/bookings')
      .set('x-role', Role.Patient)
      .set('x-user-id', '11')
      .send({ scheduleId: 1 })
      .expect(201)
      .expect({
        appointmentId: 2,
        schedulingType: SchedulingType.Wave,
        appointmentTime: {
          startAt: '2100-01-01T10:00:00.000Z',
          endAt: '2100-01-01T11:00:00.000Z',
        },
        tokenNumber: 1,
        status: 'BOOKED',
      });
  });
});
