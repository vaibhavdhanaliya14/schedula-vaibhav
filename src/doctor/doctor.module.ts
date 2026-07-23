import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorController } from './doctor.controller'; // 1. Import Controller
import { DoctorService } from './doctor.service';
import { Doctor } from './entities/doctor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Doctor])],
  controllers: [DoctorController], // 2. ⚠️ MUST BE LISTED HERE
  providers: [DoctorService],
  exports: [DoctorService],
})
export class DoctorModule {}
