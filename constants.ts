
import { ComputerStatus, ViolationType } from './types';
import { Monitor, AlertTriangle, XCircle, Wrench, Slash } from 'lucide-react';

export const STATUS_COLORS = {
  [ComputerStatus.WORKING]: 'bg-secondary',
  [ComputerStatus.MAINTENANCE]: 'bg-warning',
  [ComputerStatus.BROKEN]: 'bg-danger',
  [ComputerStatus.REPAIRING]: 'bg-orange-500',
  [ComputerStatus.DISABLED]: 'bg-gray-400',
};

export const STATUS_LABELS = {
  [ComputerStatus.WORKING]: 'Hoạt động tốt',
  [ComputerStatus.MAINTENANCE]: 'Cần bảo trì',
  [ComputerStatus.BROKEN]: 'Hỏng',
  [ComputerStatus.REPAIRING]: 'Đang sửa',
  [ComputerStatus.DISABLED]: 'Không dùng',
};

export const VIOLATION_TYPES = [
  { type: ViolationType.LATE, label: 'Đi trễ (>5p)', points: -1 },
  { type: ViolationType.FOOD, label: 'Mang đồ ăn/uống', points: -2 },
  { type: ViolationType.GAMING, label: 'Chơi game', points: -3 },
  { type: ViolationType.NOISY, label: 'Gây ồn/Mất trật tự', points: -2 },
  { type: ViolationType.EQUIPMENT, label: 'Tự ý tháo lắp thiết bị', points: -5 },
  { type: ViolationType.OTHER, label: 'Khác', points: -1 },
];

export const MOCK_STUDENTS = [
  { id: 'S001', name: 'Nguyễn Văn An', class: '10A1', code: 'HS001' },
  { id: 'S002', name: 'Trần Thị Bình', class: '10A1', code: 'HS002' },
  { id: 'S003', name: 'Lê Văn Cường', class: '10A2', code: 'HS003' },
  { id: 'S004', name: 'Phạm Thị Dung', class: '11B1', code: 'HS004' },
  { id: 'S005', name: 'Hoàng Văn Em', class: '12C3', code: 'HS005' },
];

export const MOCK_COMPUTERS_COUNT = 50;

// Helper to format date as dd/mm/yyyy
export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
};

// Helper to format date time as HH:mm dd/mm/yyyy
export const formatDateTime = (date: Date | string): string => {
  const d = new Date(date);
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour12: false
  }).format(d);
};

export const formatTime = (date: Date | string): string => {
  const d = new Date(date);
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
};
