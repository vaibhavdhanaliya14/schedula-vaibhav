import { DataSource } from 'typeorm';
import { CustomAvailability } from './availability/entities/custom-availability.entity';
import { RecurringAvailability } from './availability/entities/recurring-availability.entity';
import { Doctor } from './doctor/entities/doctor.entity';
import { Patient } from './patient/entities/patient.entity';
import { Appointment } from './scheduling/entities/appointment.entity';
import { DoctorSchedule } from './scheduling/entities/doctor-schedule.entity';
import { User } from './users/entities/user.entity';

const getDatabaseConnectionOptions = () => {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    const url = new URL(databaseUrl);

    return {
      type: 'postgres' as const,
      host: url.hostname,
      port: Number(url.port || 5432),
      username: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: decodeURIComponent(url.pathname.replace('/', '')),
      synchronize: false,
      logging: true,
      ssl:
        url.hostname !== 'localhost' && url.hostname !== '127.0.0.1'
          ? { rejectUnauthorized: false }
          : false,
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
    };
  }

  return {
    type: 'postgres' as const,
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'admin',
    database: process.env.DB_NAME || 'schedula_db',
    synchronize: false,
    logging: true,
    ssl:
      process.env.DB_HOST &&
      process.env.DB_HOST !== 'localhost' &&
      process.env.DB_HOST !== '127.0.0.1'
        ? { rejectUnauthorized: false }
        : false,
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
  };
};

export const AppDataSource = new DataSource(getDatabaseConnectionOptions());
