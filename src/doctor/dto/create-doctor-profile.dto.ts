import { Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  IsPositive,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateDoctorProfileDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  fullName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  specialization: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  experience: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  qualification: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  consultationFee: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  availability: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  profileDetails?: string;
}
