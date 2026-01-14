
import { utils, writeFile } from 'xlsx';
import { Computer, ViolationRecord, TeacherLog, ComputerStatus } from '../types';
import { STATUS_LABELS, formatDate, formatDateTime } from '../constants';

/**
 * Export all statistics to Excel file with 3 sheets
 */
export const exportAllStatistics = (
    violations: ViolationRecord[],
    computers: Computer[],
    teacherLogs: TeacherLog[]
) => {
    // Create workbook
    const wb = utils.book_new();

    // ========== SHEET 1: Vi phạm ==========
    const violationData = violations.map((v, index) => ({
        'STT': index + 1,
        'Lớp': v.class,
        'Họ tên học sinh': v.studentName,
        'Loại vi phạm': v.violationName,
        'Điểm trừ': v.points,
        'Mã máy': v.computerId,
        'Thời gian': formatDateTime(v.date),
        'Ghi chú': v.note || '',
        'Giáo viên': v.teacherName
    }));

    const wsViolations = utils.json_to_sheet(violationData);

    // Set column widths
    wsViolations['!cols'] = [
        { wch: 5 },   // STT
        { wch: 10 },  // Lớp
        { wch: 25 },  // Họ tên
        { wch: 20 },  // Loại vi phạm
        { wch: 10 },  // Điểm trừ
        { wch: 10 },  // Mã máy
        { wch: 20 },  // Thời gian
        { wch: 30 },  // Ghi chú
        { wch: 15 }   // Giáo viên
    ];

    utils.book_append_sheet(wb, wsViolations, 'Thống kê vi phạm');

    // ========== SHEET 2: Máy tính ==========
    // Calculate summary
    const totalComputers = computers.length;
    const workingCount = computers.filter(c => c.status === ComputerStatus.WORKING).length;
    const maintenanceCount = computers.filter(c => c.status === ComputerStatus.MAINTENANCE).length;
    const brokenCount = computers.filter(c => c.status === ComputerStatus.BROKEN || c.status === ComputerStatus.REPAIRING).length;

    // Create summary + detail data
    const computerSummary = [
        { 'Thống kê': 'TỔNG HỢP TRẠNG THÁI MÁY TÍNH', '': '', ' ': '', '  ': '' },
        { 'Thống kê': 'Tổng số máy', '': totalComputers, ' ': '', '  ': '' },
        { 'Thống kê': 'Máy hoạt động tốt', '': workingCount, ' ': '', '  ': '' },
        { 'Thống kê': 'Máy đang bảo trì', '': maintenanceCount, ' ': '', '  ': '' },
        { 'Thống kê': 'Máy hỏng/sửa chữa', '': brokenCount, ' ': '', '  ': '' },
        { 'Thống kê': '', '': '', ' ': '', '  ': '' },
        { 'Thống kê': 'CHI TIẾT TỪNG MÁY', '': '', ' ': '', '  ': '' },
    ];

    const computerDetail = computers.map((c, index) => ({
        'STT': index + 1,
        'Mã máy': c.id,
        'Tên máy': c.name,
        'Vị trí': c.location,
        'Trạng thái': STATUS_LABELS[c.status] || c.status,
        'Cấu hình': c.specs || '',
        'HS được gán': c.assignedStudentName || ''
    }));

    const wsComputers = utils.json_to_sheet([]);

    // Add summary first
    utils.sheet_add_json(wsComputers, computerSummary, { origin: 'A1', skipHeader: true });

    // Add detail with header
    utils.sheet_add_json(wsComputers, computerDetail, { origin: 'A9' });

    wsComputers['!cols'] = [
        { wch: 5 },   // STT
        { wch: 10 },  // Mã máy
        { wch: 15 },  // Tên máy
        { wch: 20 },  // Vị trí
        { wch: 15 },  // Trạng thái
        { wch: 20 },  // Cấu hình
        { wch: 25 }   // HS được gán
    ];

    utils.book_append_sheet(wb, wsComputers, 'Thống kê máy tính');

    // ========== SHEET 3: Tiết dạy ==========
    const teachingData = teacherLogs.map((log, index) => ({
        'STT': index + 1,
        'Ngày': formatDate(log.date),
        'Tiết': log.period,
        'Lớp': log.class,
        'HS có mặt': log.studentPresent,
        'Tổng HS': log.studentTotal,
        'Nội dung bài dạy': log.lessonContent || '',
        'Ghi chú': log.note || '',
        'Giáo viên': log.teacherName
    }));

    const wsTeaching = utils.json_to_sheet(teachingData);

    wsTeaching['!cols'] = [
        { wch: 5 },   // STT
        { wch: 12 },  // Ngày
        { wch: 10 },  // Tiết
        { wch: 10 },  // Lớp
        { wch: 10 },  // HS có mặt
        { wch: 10 },  // Tổng HS
        { wch: 40 },  // Nội dung
        { wch: 25 },  // Ghi chú
        { wch: 15 }   // Giáo viên
    ];

    utils.book_append_sheet(wb, wsTeaching, 'Lịch sử tiết dạy');

    // Generate filename with date
    const today = new Date();
    const dateStr = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;
    const filename = `ThongKe_PhongMay_${dateStr}.xlsx`;

    // Download file
    writeFile(wb, filename);
};
