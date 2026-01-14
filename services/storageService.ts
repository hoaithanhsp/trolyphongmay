
import { Computer, ComputerStatus, Student, ViolationRecord, TeacherLog, Class } from '../types';
import { MOCK_STUDENTS, MOCK_COMPUTERS_COUNT } from '../constants';

const STORAGE_KEYS = {
  COMPUTERS: 'labmanager_computers',
  STUDENTS: 'labmanager_students',
  CLASSES: 'labmanager_classes',
  VIOLATIONS: 'labmanager_violations',
  TEACHER_LOGS: 'labmanager_teacher_logs',
};

// Seed data if empty
const seedData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.COMPUTERS)) {
    const computers: Computer[] = [];
    for (let i = 1; i <= MOCK_COMPUTERS_COUNT; i++) {
      const id = `M${i.toString().padStart(2, '0')}`;
      let status = ComputerStatus.WORKING;

      // Randomly assign some bad statuses for demo
      if (i === 5 || i === 12) status = ComputerStatus.BROKEN;
      if (i === 3 || i === 20) status = ComputerStatus.MAINTENANCE;

      computers.push({
        id,
        name: `Máy ${i.toString().padStart(2, '0')}`,
        location: `Hàng ${Math.ceil(i / 5)} - Cột ${(i - 1) % 5 + 1}`,
        status,
        specs: 'Core i5, 8GB RAM',
        assignedStudentId: undefined,
        assignedStudentName: undefined
      });
    }
    localStorage.setItem(STORAGE_KEYS.COMPUTERS, JSON.stringify(computers));
  }

  // Ensure students array exists
  if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify([]));
  }

  // Ensure classes array exists
  if (!localStorage.getItem(STORAGE_KEYS.CLASSES)) {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify([
      { id: '1', name: '10A1', note: 'Lớp chọn' },
      { id: '2', name: '11B2', note: '' }
    ]));
  }
};

export const storageService = {
  init: () => seedData(),

  getComputers: (): Computer[] => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPUTERS) || '[]');
  },

  saveComputers: (computers: Computer[]) => {
    localStorage.setItem(STORAGE_KEYS.COMPUTERS, JSON.stringify(computers));
  },

  updateComputerStatus: (id: string, status: ComputerStatus) => {
    const computers = storageService.getComputers();
    const index = computers.findIndex(c => c.id === id);
    if (index !== -1) {
      computers[index].status = status;
      localStorage.setItem(STORAGE_KEYS.COMPUTERS, JSON.stringify(computers));
    }
  },

  addComputer: (computer: Computer) => {
    const computers = storageService.getComputers();
    computers.push(computer);
    localStorage.setItem(STORAGE_KEYS.COMPUTERS, JSON.stringify(computers));
  },

  deleteComputer: (id: string) => {
    let computers = storageService.getComputers();
    computers = computers.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.COMPUTERS, JSON.stringify(computers));
  },

  updateComputer: (updatedComputer: Computer) => {
    const computers = storageService.getComputers();
    const index = computers.findIndex(c => c.id === updatedComputer.id);
    if (index !== -1) {
      computers[index] = updatedComputer;
      localStorage.setItem(STORAGE_KEYS.COMPUTERS, JSON.stringify(computers));
    }
  },

  getStudents: (): Student[] => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS) || '[]');
  },

  getClasses: (): Class[] => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CLASSES) || '[]');
  },

  addClass: (newClass: Class) => {
    const classes = storageService.getClasses();
    classes.push(newClass);
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
  },

  updateClass: (updatedClass: Class) => {
    const classes = storageService.getClasses();
    const index = classes.findIndex(c => c.id === updatedClass.id);
    if (index !== -1) {
      // Also update student class names if name changed
      if (classes[index].name !== updatedClass.name) {
        const students = storageService.getStudents();
        const updatedStudents = students.map(s => s.class === classes[index].name ? { ...s, class: updatedClass.name } : s);
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(updatedStudents));
      }
      classes[index] = updatedClass;
      localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
    }
  },

  deleteClass: (id: string) => {
    let classes = storageService.getClasses();
    const classToDelete = classes.find(c => c.id === id);
    if (!classToDelete) return;

    classes = classes.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));

    // Remove students of this class
    let students = storageService.getStudents();
    students = students.filter(s => s.class !== classToDelete.name);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  },

  // This puts a specific class "into" the room (assigns students to computers)
  activateClass: (className: string) => {
    const computers = storageService.getComputers();
    const allStudents = storageService.getStudents();

    // Filter students for this class
    let classStudents = allStudents.filter(s => s.class === className);

    // Reset current assignments on all computers
    computers.forEach(c => {
      c.assignedStudentId = undefined;
      c.assignedStudentName = undefined;
    });

    // Check if students have explicit assignments (from Import STT)
    const hasExplicitAssignments = classStudents.some(s => s.assignedComputerId);

    if (hasExplicitAssignments) {
      // Priority 1: Use explicit assignments from Excel Import (STT -> Machine ID)
      classStudents.forEach(student => {
        if (student.assignedComputerId) {
          const comp = computers.find(c => c.id === student.assignedComputerId);
          if (comp) {
            comp.assignedStudentId = student.id;
            comp.assignedStudentName = student.name;
          }
        }
      });
    } else {
      // Priority 2: Fallback for manual data - Sort by Name and assign sequentially
      // Sort A-Z (Vietnamese)
      classStudents.sort((a, b) => a.name.localeCompare(b.name, 'vi'));

      classStudents.forEach((student, index) => {
        if (index < computers.length) {
          // Determine target ID based on order: 0 -> M01, 1 -> M02...
          const targetId = `M${(index + 1).toString().padStart(2, '0')}`;
          const comp = computers.find(c => c.id === targetId);
          if (comp) {
            comp.assignedStudentId = student.id;
            comp.assignedStudentName = student.name;

            // Update student record to remember this assignment
            student.assignedComputerId = targetId;
          }
        }
      });
      // Save the updated student assignments back to storage
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(allStudents));
    }

    storageService.saveComputers(computers);
  },

  importStudents: (data: any[], targetClassName: string) => {
    // Get existing students but filter OUT the students of the class we are overwriting
    let currentStudents = storageService.getStudents().filter(s => s.class !== targetClassName);

    const newStudents: Student[] = [];

    data.forEach((row, index) => {
      // Robust column finding
      const stt = row['STT'] || row['stt'] || row['Stt'] || row['No'] || row['No.'] || (index + 1);
      const name = row['Họ và tên'] || row['Họ tên'] || row['Name'] || row['Full Name'] || row['name'] || row['Tên'];
      const code = row['Mã HS'] || row['Code'] || row['Student ID'] || `HS${new Date().getTime()}${index}`;

      if (name) {
        const sttNum = parseInt(stt);
        let computerId = '';

        // Map STT to Computer ID (M01, M02...)
        if (!isNaN(sttNum)) {
          computerId = `M${sttNum.toString().padStart(2, '0')}`;
        } else {
          // If STT is not a number, fallback to index
          computerId = `M${(index + 1).toString().padStart(2, '0')}`;
        }

        const studentId = crypto.randomUUID();

        const newStudent: Student = {
          id: studentId,
          name: name.toString().trim(),
          class: targetClassName,
          code: code.toString().trim(),
          assignedComputerId: computerId, // Store mapping
          totalViolationPoints: 0
        };
        newStudents.push(newStudent);
      }
    });

    // Combine and save
    const finalStudentList = [...currentStudents, ...newStudents];
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(finalStudentList));
  },

  getViolations: (): ViolationRecord[] => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.VIOLATIONS) || '[]');
  },

  addViolation: (record: ViolationRecord) => {
    const violations = storageService.getViolations();
    violations.unshift(record); // Add to top
    localStorage.setItem(STORAGE_KEYS.VIOLATIONS, JSON.stringify(violations));

    // Update student points
    const students = storageService.getStudents();
    const studentIndex = students.findIndex(s => s.id === record.studentId);
    if (studentIndex !== -1) {
      students[studentIndex].totalViolationPoints += record.points;
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    }
  },

  getTeacherLogs: (): TeacherLog[] => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.TEACHER_LOGS) || '[]');
  },

  addTeacherLog: (log: TeacherLog) => {
    const logs = storageService.getTeacherLogs();
    logs.unshift(log);
    localStorage.setItem(STORAGE_KEYS.TEACHER_LOGS, JSON.stringify(logs));
  },

  // Full reset: clear everything and re-seed (with empty students)
  resetAll: () => {
    localStorage.clear();
    seedData();
    window.location.reload();
  }
};
