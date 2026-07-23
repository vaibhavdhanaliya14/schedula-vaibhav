import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateDoctorProfileDto {
  @IsString()
  fullName: string;

  @IsString()
  specialization: string;

  @IsNumber()
  @Min(0)
  experience: number;

  @IsString()
  qualification: string;

  @IsNumber()
  @Min(0)
  consultationFee: number;

  @IsString()
  consultationHours: string;

  @IsOptional()
  @IsString()
  profileDetails?: string;
}