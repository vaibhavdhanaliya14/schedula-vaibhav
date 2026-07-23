import { Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  IsPositive,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreatePatientProfileDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  fullName: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @Min(1)
  @Max(120)
  age: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  gender: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  contactDetails: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  basicHealthInformation?: string;
}
