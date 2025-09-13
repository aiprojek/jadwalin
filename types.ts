export type Day = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface TimeSlot {
  id: string;
  type: 'period' | 'break';
  label: string; // e.g., '07:30 - 08:15' or 'Break Time'
  startTime?: string;
  endTime?: string;
}

export interface EducationLevel {
  id: string;
  name: string;
  timeSlots: {
    regular: TimeSlot[];
    exam: TimeSlot[];
  };
  daysOff?: Day[]; // e.g., ['Saturday', 'Sunday']
}

export interface Subject {
  id: string;
  name: string;
  levelId: string; // Belongs to one education level
}

export interface Teacher {
  id: string;
  name: string;
  availableDays: Day[];
  canTeachSubjects: string[]; // array of subject ids
  canTeachInLevels: string[]; // array of education level ids
  maxHoursPerDay?: number; // Optional: max teaching hours per day
}

export interface Room {
  id:string;
  name: string;
  levelIds?: string[]; // Optional: restrict room to specific education levels
  classIds?: string[]; // Optional: restrict room to specific classes
}

export interface ClassSubject {
  subjectId: string;
  hoursPerWeek: number;
  teacherId: string; // Specific teacher for this subject in this class
  requiresRoom?: boolean; // Optional: defaults to true if not specified
  consecutiveHours?: number; // Optional: e.g., 2 for a double period
}

export interface Class {
  id: string;
  name: string;
  subjects: ClassSubject[];
  levelId: string; // Belongs to one education level
  homeroomTeacherId?: string; // Optional: homeroom teacher
}

export interface ScheduleEntry {
  subjectName: string;
  teacherName: string;
  roomName: string;
}

export type Schedule = {
  [className: string]: {
    [day in Day]?: {
      [timeSlot: string]: ScheduleEntry;
    };
  };
};

export interface GeminiError {
  conflicts: string[];
}

export interface PrintSettings {
  paperSize: 'A4' | 'F4' | 'Letter' | 'Legal';
  orientation: 'portrait' | 'landscape';
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  showHeader: boolean;
}

export interface InstitutionInfoItem {
  id: string;
  label: string;
  value: string;
  showInHeader: boolean;
}


export interface ArchivedSchedule {
  id: number;
  date: string;
  scheduleType: 'Regular' | 'Exam';
  levelName: string;
  schedule: Schedule;
  institutionInfo: InstitutionInfoItem[] | { foundation: string; institution: string; address: string; };
  academicYear: { masehi: string; hijri: string; };
  accentColor: string;
  timeSlots: TimeSlot[]; // Added to preserve schedule structure
  printSettings?: PrintSettings; // Added to preserve print settings
}

export type ToastType = 'success' | 'error' | 'info';
