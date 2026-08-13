import { Type } from 'class-transformer';
import { IsInt, IsISO8601, IsOptional, Min } from 'class-validator';

export class BookAppointmentDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  scheduleId: number;

  @IsOptional()
  @IsISO8601()
  slotStartAt?: string;
}
