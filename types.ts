
export enum ComputerStatus {
  WORKING = 'working',
  MAINTENANCE = 'maintenance',
  BROKEN = 'broken',
  REPAIRING = 'repairing',
  DISABLED = 'disabled',
}

export enum ViolationType {
  LATE = 'late',
  FOOD = 'food',
  GAMING = 'gaming',
  NOISY = 'noisy',
  EQUIPMENT = 'equipment',
  OTHER = 'other',
}

export interface Class {
  id: string;
  name: string;
  note?: string;
}

export interface Computer {
  id: string; // M001
  name: string; // Máy 01
  location: string;
  ipAddress?: string;
  specs?: string;
  status: ComputerStatus;
  assignedStudentId?: string;
  assignedStudentName?: string; // Denormalized for easy access
}

export interface Student {
  id: string;
  name: string;
  class: string;
  code: string;
  assignedComputerId?: string;
  totalViolationPoints: number;
}

export interface ViolationRecord {
  id: string;
  date: string; // ISO String
  studentId: string;
  studentName: string;
  class: string;
  computerId: string;
  violationType: ViolationType;
  violationName: string;
  points: number;
  note: string;
  teacherName: string;
}

export interface TeacherLog {
  id: string;
  date: string;
  period: string; // "1-2"
  class: string;
  studentPresent: number;
  studentTotal: number;
  lessonContent: string;
  equipmentUsed: string[];
  note: string;
  teacherName: string;
}

export interface DashboardStats {
  totalComputers: number;
  workingComputers: number;
  maintenanceComputers: number;
  brokenComputers: number;
  repairingComputers: number;
  violationCountToday: number;
  violationPointsToday: number;
}
