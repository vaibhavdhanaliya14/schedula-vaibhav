import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  Min,
  ValidateIf,
} from 'class-validator';
import { SchedulingType } from '../enums/scheduling-type.enum';

export class CreateScheduleDto {
  @IsEnum(SchedulingType, {
    message: 'schedulingType must be either STREAM or WAVE.',
  })
  schedulingType: SchedulingType;

  @IsISO8601()
  startAt: string;

  @IsISO8601()
  endAt: string;

  @ValidateIf(
    (dto: CreateScheduleDto) => dto.schedulingType === SchedulingType.Stream,
  )
  @Type(() => Number)
  @IsInt()
  @Min(1)
  slotDurationMinutes?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bufferTimeMinutes?: number;

  @ValidateIf(
    (dto: CreateScheduleDto) => dto.schedulingType === SchedulingType.Wave,
  )
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxPatients?: number;
}
