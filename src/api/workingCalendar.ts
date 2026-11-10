import { api } from "./axios";

export type CalendarExceptionType = "HOLIDAY" | "WORKING_DAY" | "EVENT";

export interface CalendarException {
  date: string;
  type: CalendarExceptionType;
  title: string;
  note?: string;
}

export interface WorkingCalendar {
  year: number;
  startDate: string;
  endDate: string;
  workingWeekdays: number[];
  exceptions: CalendarException[];
}

export type WorkingCalendarUpdate = Omit<WorkingCalendar, "year">;

export async function getWorkingCalendar(year: number) {
  return api.get<{
    success: boolean;
    message: string;
    data: WorkingCalendar;
  }>(`/working-calendar/${year}`);
}

export async function putWorkingCalendar(year: number, payload: WorkingCalendarUpdate) {
  return api.put<{
    success: boolean;
    message: string;
    data: WorkingCalendar;
  }>(`/working-calendar/${year}`, payload);
}
