import { DataSource } from 'typeorm';
import { CustomAvailability } from './availability/entities/custom-availability.entity';
import { RecurringAvailability } from './availability/entities/recurring-availability.entity';
import { Doctor } from './doctor/entities/doctor.entity';
import { Patient } from './patient/entities/patient.entity';
import { Appointment } from './scheduling/entities/appointment.entity';
import { DoctorSchedule } from './scheduling/entities/doctor-schedule.entity';
import { User } from './users/entities/user.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
  database: process.env.DB_NAME || 'schedula_db',
  synchronize: false,
  logging: true,
  entities: [
    User,
    Doctor,
    Patient,
    RecurringAvailability,
    CustomAvailability,
    DoctorSchedule,
    Appointment,
  ],
  migrations: ['src/migrations/*.ts'],
});
