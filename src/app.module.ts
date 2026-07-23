import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorModule } from './doctor/doctor.module';
import { PatientModule } from './patient/patient.module';
// ... your other imports (AuthModule, UsersModule, etc.)

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres', // Replace with your Postgres username
      password: 'admin', // Replace with your Postgres password
      database: 'schedula_db', // The database you created
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false, // ⚠️ CRITICAL: Must be false for Day 3
    }),
    DoctorModule,
    PatientModule,
    // ... AuthModule, UsersModule, etc.
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
