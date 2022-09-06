import { Schedule, ScheduleHour } from '../../modules/user';

interface ScheduleDto extends Omit<Schedule, 'id'> {}

const orderedHours = [
  ScheduleHour.$6,
  ScheduleHour.$7,
  ScheduleHour.$8,
  ScheduleHour.$9,
  ScheduleHour.$10,
  ScheduleHour.$11,
  ScheduleHour.$12,
  ScheduleHour.$13,
  ScheduleHour.$14,
  ScheduleHour.$15,
  ScheduleHour.$16,
  ScheduleHour.$17,
  ScheduleHour.$18,
  ScheduleHour.$19,
  ScheduleHour.$20,
  ScheduleHour.$21,
  ScheduleHour.$22,
  ScheduleHour.$23,
  ScheduleHour.$0,
  ScheduleHour.$1,
  ScheduleHour.$2,
  ScheduleHour.$3,
  ScheduleHour.$4,
  ScheduleHour.$5,
];
const generateLabel = (hour: ScheduleHour) => {
  // get only last two digits (example: 013 -> 13, 01 -> 01)
  const labelHour = `0${hour}`.slice(-2);
  const start = `${labelHour}:00`;
  const end = `${labelHour}:59`;

  return `${start}-${end}`;
};

export const scheduleSeed: ScheduleDto[] = orderedHours.map((scheduleHour, index) => ({
  hour: scheduleHour,
  order: index + 1,
  label: generateLabel(scheduleHour),
}));
