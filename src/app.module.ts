import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DoctorModule } from './doctor/doctor.module';
import { PatientModule } from './patient/patient.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres', 
      password: 'admin', // Make sure this matches your Postgres password
      database: 'schedula_db', 
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false, // ⚠️ CRITICAL: Must be false for Day 3
    }),
    AuthModule,
    UsersModule,
    DoctorModule,
    PatientModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}