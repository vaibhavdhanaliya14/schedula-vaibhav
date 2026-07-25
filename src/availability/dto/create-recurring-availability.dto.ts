import { IsEnum, Matches } from 'class-validator';
import { DayOfWeek } from './day-of-week.enum';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CreateRecurringAvailabilityDto {
  @IsEnum(DayOfWeek)
  dayOfWeek: DayOfWeek;

  @Matches(TIME_PATTERN, {
    message: 'startTime must be in HH:mm 24-hour format',
  })
  startTime: string;

  @Matches(TIME_PATTERN, {
    message: 'endTime must be in HH:mm 24-hour format',
  })
  endTime: string;
}
