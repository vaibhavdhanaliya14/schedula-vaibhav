import { PartialType } from '@nestjs/mapped-types';
import { CreateDoctorProfileDto } from './create-doctor-profile.dto';

// You might need to run: npm install @nestjs/mapped-types
export class UpdateDoctorProfileDto extends PartialType(CreateDoctorProfileDto) {}