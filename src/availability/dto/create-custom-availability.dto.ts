import { Matches } from 'class-validator';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CreateCustomAvailabilityDto {
  @Matches(DATE_PATTERN, {
    message: 'date must be in YYYY-MM-DD format',
  })
  date: string;

  @Matches(TIME_PATTERN, {
    message: 'startTime must be in HH:mm 24-hour format',
  })
  startTime: string;

  @Matches(TIME_PATTERN, {
    message: 'endTime must be in HH:mm 24-hour format',
  })
  endTime: string;
}
