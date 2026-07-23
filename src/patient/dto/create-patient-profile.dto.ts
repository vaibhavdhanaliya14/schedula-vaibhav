import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreatePatientProfileDto {
  @IsString()
  fullName: string;

  @IsNumber()
  @Min(0)
  age: number;

  @IsString()
  gender: string;

  @IsString()
  contactDetails: string;

  @IsOptional()
  @IsString()
  basicHealthInformation?: string;
}