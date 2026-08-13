import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AvailabilityModule } from './availability/availability.module';
import { AuthModule } from './auth/auth.module';
import { DoctorModule } from './doctor/doctor.module';
import { PatientModule } from './patient/patient.module';
import { SchedulingModule } from './scheduling/scheduling.module';
import { NotificationModule } from './notification/notification.module';
import { UsersModule } from './users/users.module';

const getDatabaseConfig = (configService: ConfigService) => {
  const databaseUrl = configService.get<string>('DATABASE_URL');

  if (databaseUrl) {
    const url = new URL(databaseUrl);

    return {
      type: 'postgres' as const,
      host: url.hostname,
      port: Number(url.port || 5432),
      username: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: decodeURIComponent(url.pathname.replace('/', '')),
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false,
      ssl:
        url.hostname !== 'localhost' && url.hostname !== '127.0.0.1'
          ? { rejectUnauthorized: false }
          : false,
    };
  }

  return {
    type: 'postgres' as const,
    host: configService.get<string>('DB_HOST', 'localhost'),
    port: configService.get<number>('DB_PORT', 5432),
    username: configService.get<string>('DB_USERNAME', 'postgres'),
    password: configService.get<string>('DB_PASSWORD', 'admin'),
    database: configService.get<string>('DB_NAME', 'schedula_db'),
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    synchronize: false,
    ssl:
      configService.get<string>('DB_HOST') !== 'localhost' &&
      configService.get<string>('DB_HOST') !== '127.0.0.1'
        ? { rejectUnauthorized: false }
        : false,
  };
};

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => getDatabaseConfig(configService),
    }),
    AuthModule,
    UsersModule,
    DoctorModule,
    PatientModule,
<<<<<<< HEAD
    AvailabilityModule,
=======
>>>>>>> 2a75b99 (feat: implement advanced stream and wave scheduling)
    SchedulingModule,
    NotificationModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
