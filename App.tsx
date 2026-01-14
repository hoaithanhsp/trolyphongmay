
import React, { useState, useEffect, useRef } from 'react';
import { Computer, TeacherLog, ViolationRecord, ComputerStatus, ViolationType, Class, Student } from './types';
import { storageService } from './services/storageService';
import { ComputerModal } from './components/ComputerModal';
import { QRScanner } from './components/QRScanner';
import { PrintableQRGrid } from './components/PrintableQRGrid';
import { STATUS_LABELS, VIOLATION_TYPES, MOCK_STUDENTS, formatDate, formatDateTime } from './constants';
import { read, utils } from 'xlsx';
import { Button } from './components/Button';

// Initialize data
storageService.init();

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'computers' | 'violations' | 'teaching' | 'classes'>('dashboard');
  const [computers, setComputers] = useState<Computer[]>([]);
  const [violations, setViolations] = useState<ViolationRecord[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teacherLogs, setTeacherLogs] = useState<TeacherLog[]>([]);

  const [selectedComputer, setSelectedComputer] = useState<Computer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  // File upload ref for classes
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importTargetClass, setImportTargetClass] = useState<string | null>(null);

  // Class Form State
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [classNameInput, setClassNameInput] = useState('');
  const [classNoteInput, setClassNoteInput] = useState('');

  // Class Statistics Modal State
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [statsClass, setStatsClass] = useState<string | null>(null);

  // Form states for Quick Violation
  const [quickViolationStudent, setQuickViolationStudent] = useState('');
  const [quickViolationComputer, setQuickViolationComputer] = useState('');
  const [quickViolationType, setQuickViolationType] = useState('');
  const [quickViolationNote, setQuickViolationNote] = useState('');

  // Form states for Teaching Log
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [logPeriod, setLogPeriod] = useState('Tiết 1');
  const [logClass, setLogClass] = useState('');
  const [logContent, setLogContent] = useState('');

  // Fetch data
  useEffect(() => {
    setComputers(storageService.getComputers());
    setViolations(storageService.getViolations());
    setClasses(storageService.getClasses());
    setStudents(storageService.getStudents());
    setTeacherLogs(storageService.getTeacherLogs());
  }, [refreshTrigger, activeView]);

  // Real-time clock update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const refreshData = () => setRefreshTrigger(prev => prev + 1);

  const handleComputerClick = (computer: Computer) => {
    setSelectedComputer(computer);
    setIsModalOpen(true);
  };

  const handleScanResult = (text: string) => {
    if (text.startsWith('LAB-')) {
      const computerId = text.replace('LAB-', '');
      const found = computers.find(c => c.id === computerId);
      if (found) {
        setIsScannerOpen(false);
        handleComputerClick(found);
      } else {
        alert("Không tìm thấy máy tính trong hệ thống!");
      }
    } else {
      alert("Mã QR không hợp lệ!");
    }
  };

  // Class Management Handlers
  const handleAddClass = () => {
    setEditingClass(null);
    setClassNameInput('');
    setClassNoteInput('');
    setIsClassModalOpen(true);
  };

  const handleEditClass = (cls: Class) => {
    setEditingClass(cls);
    setClassNameInput(cls.name);
    setClassNoteInput(cls.note || '');
    setIsClassModalOpen(true);
  };

  const handleDeleteClass = (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa lớp này? Tất cả học sinh của lớp sẽ bị xóa khỏi hệ thống.")) {
      storageService.deleteClass(id);
      refreshData();
    }
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classNameInput.trim()) return;

    if (editingClass) {
      storageService.updateClass({
        ...editingClass,
        name: classNameInput,
        note: classNoteInput
      });
    } else {
      storageService.addClass({
        id: crypto.randomUUID(),
        name: classNameInput,
        note: classNoteInput
      });
    }
    setIsClassModalOpen(false);
    refreshData();
  };

  const triggerImport = (className: string) => {
    setImportTargetClass(className);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    if (!importTargetClass) return;

    const file = e.target.files[0];

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = read(arrayBuffer);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = utils.sheet_to_json(worksheet);

      if (jsonData.length > 0) {
        storageService.importStudents(jsonData, importTargetClass);
        alert(`Đã nhập thành công ${jsonData.length} học sinh vào lớp ${importTargetClass}.`);
        refreshData();
      } else {
        alert('File không có dữ liệu!');
      }
    } catch (error) {
      console.error(error);
      alert('Lỗi khi đọc file Excel. Vui lòng kiểm tra định dạng.');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setImportTargetClass(null);
  };

  const handleActivateClass = (className: string) => {
    if (window.confirm(`Bạn muốn nạp danh sách học sinh lớp ${className} vào phòng máy?`)) {
      storageService.activateClass(className);
      alert(`Đã nạp lớp ${className} thành công! Các máy đã được gán theo STT.`);
      refreshData();
      setActiveView('computers');
    }
  };

  const handleQuickViolationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickViolationStudent || !quickViolationType) return;

    // Find student (mock search)
    const allStudents = storageService.getStudents();
    const student = allStudents.find(s => s.name.toLowerCase().includes(quickViolationStudent.toLowerCase()) || s.code === quickViolationStudent);

    const foundStudent = student; // Removed mock fallback to ensure data integrity

    if (!foundStudent) {
      alert("Không tìm thấy học sinh!");
      return;
    }

    const typeData = VIOLATION_TYPES.find(v => v.type === quickViolationType);

    const record: ViolationRecord = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      studentId: foundStudent.id,
      studentName: foundStudent.name,
      class: foundStudent.class,
      computerId: quickViolationComputer || 'N/A',
      violationType: quickViolationType as ViolationType,
      violationName: typeData?.label || 'Khác',
      points: typeData?.points || 0,
      note: quickViolationNote,
      teacherName: 'Admin'
    };

    storageService.addViolation(record);
    setViolations(prev => [record, ...prev]);
    setQuickViolationStudent('');
    setQuickViolationComputer('');
    setQuickViolationNote('');
    setQuickViolationType('');
    alert("Đã ghi nhận vi phạm thành công!");
    refreshData();
  };

  const handleSaveTeacherLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logClass) {
      alert("Vui lòng chọn lớp học!");
      return;
    }

    const classStudentCount = students.filter(s => s.class === logClass).length;

    const newLog: TeacherLog = {
      id: crypto.randomUUID(),
      date: logDate,
      period: logPeriod,
      class: logClass,
      studentPresent: classStudentCount, // Default to full attendance for MVP
      studentTotal: classStudentCount,
      lessonContent: logContent,
      equipmentUsed: [],
      note: '',
      teacherName: 'Admin'
    };

    storageService.addTeacherLog(newLog);
    setTeacherLogs(prev => [newLog, ...prev]);

    // Reset meaningful fields but keep date
    setLogContent('');
    setLogClass('');

    alert("Đã lưu sổ giảng dạy thành công!");
  };

  const handleResetData = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ dữ liệu học sinh và đặt lại trạng thái máy tính? Hành động này không thể hoàn tác.")) {
      storageService.resetAll();
    }
  };

  // Stats
  const stats = {
    total: computers.length,
    working: computers.filter(c => c.status === ComputerStatus.WORKING).length,
    broken: computers.filter(c => c.status === ComputerStatus.BROKEN || c.status === ComputerStatus.REPAIRING).length,
    maintenance: computers.filter(c => c.status === ComputerStatus.MAINTENANCE).length,
    violationsToday: violations.filter(v => formatDate(v.date) === formatDate(new Date())).length
  };

  // Render Helpers
  const renderStatusDot = (status: ComputerStatus) => {
    switch (status) {
      case ComputerStatus.WORKING: return 'bg-success';
      case ComputerStatus.MAINTENANCE: return 'bg-warning';
      case ComputerStatus.BROKEN:
      case ComputerStatus.REPAIRING: return 'bg-danger';
      default: return 'bg-gray-400';
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-border flex items-center gap-5 shadow-sm">
          <div className="p-4 bg-green-100 text-success rounded-xl">
            <span className="material-symbols-outlined text-3xl">check_circle</span>
          </div>
          <div className="flex flex-col">
            <p className="text-textSecondary text-sm font-medium">Số máy hoạt động</p>
            <p className="text-2xl font-bold">{stats.working} <span className="text-sm font-normal text-gray-400">/ {stats.total}</span></p>
            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2">
              <div className="bg-success h-full rounded-full" style={{ width: `${(stats.working / stats.total) * 100}%` }}></div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-border flex items-center gap-5 shadow-sm">
          <div className="p-4 bg-red-100 text-danger rounded-xl">
            <span className="material-symbols-outlined text-3xl">report</span>
          </div>
          <div className="flex flex-col">
            <p className="text-textSecondary text-sm font-medium">Số vi phạm hôm nay</p>
            <p className="text-2xl font-bold">{stats.violationsToday} <span className="text-sm font-normal text-danger"></span></p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-border flex items-center gap-5 shadow-sm">
          <div className="p-4 bg-amber-100 text-warning rounded-xl">
            <span className="material-symbols-outlined text-3xl">build</span>
          </div>
          <div className="flex flex-col">
            <p className="text-textSecondary text-sm font-medium">Số máy cần sửa</p>
            <p className="text-2xl font-bold">{stats.broken} <span className="text-sm font-normal text-gray-400">máy</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Left Side: PC Grid View */}
        <div className="xl:col-span-3 space-y-6">
          <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">grid_view</span>
                <h2 className="text-lg font-bold">Sơ đồ phòng máy (Real-time)</h2>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-success rounded"></div> Tốt</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-warning rounded"></div> Bảo trì</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-danger rounded"></div> Hỏng</div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-3">
                {computers.map((comp) => (
                  <div
                    key={comp.id}
                    onClick={() => handleComputerClick(comp)}
                    className={`${renderStatusDot(comp.status)} aspect-square rounded-lg flex flex-col items-center justify-center text-white cursor-pointer transition-transform hover:scale-105 shadow-sm group relative`}
                    title={`${comp.name}: ${STATUS_LABELS[comp.status]}\n${comp.assignedStudentName || ''}`}
                  >
                    <span className="material-symbols-outlined text-lg mb-1">laptop_mac</span>
                    <span className="text-[10px] font-bold">{comp.id}</span>
                    {comp.assignedStudentName && (
                      <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-blue-500 rounded-full border border-white"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Session Info */}
        <div className="space-y-6">
          {/* Current Session Card */}
          <div className="bg-primary text-white rounded-xl p-6 shadow-lg relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <span className="material-symbols-outlined text-[120px]">school</span>
            </div>
            <p className="text-primary/10 bg-white/20 inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-4">Lớp đang học</p>
            {/* Logic to find "Active" class from computers would go here, for now just show static or first found */}
            <h3 className="text-3xl font-bold mb-1">
              {computers.find(c => c.assignedStudentName)?.assignedStudentName ? "Đã nạp" : "Trống"}
            </h3>
            <p className="text-white/80 text-sm mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">schedule</span>
              {currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} - {currentTime.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
            </p>
            <div className="flex items-start gap-3 bg-white/10 p-3 rounded-lg backdrop-blur-sm">
              <img
                src="/avatar_thoa.jpg"
                alt="Avatar Giáo viên"
                className="w-12 h-12 rounded-full object-cover border-2 border-white/30"
              />
              <div className="flex flex-col">
                <p className="text-[10px] text-white/70 leading-none mb-1">Giáo viên phụ trách</p>
                <p className="font-semibold text-sm">Trần Thị Kim Thoa</p>
                <p className="text-[11px] text-white/80 mt-1">Trường THPT Hoàng Diệu</p>
                <p className="text-[10px] text-white/60 leading-tight">Số 1 Mạc Đĩnh Chi, P. Phú Lợi, TP. Cần Thơ</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderClassesView = () => (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-wrap justify-between items-end gap-4 mb-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black leading-tight tracking-tight text-textPrimary">Quản lý lớp học</h1>
          <p className="text-textSecondary text-sm font-normal">Danh sách các lớp và học sinh. Nạp lớp vào phòng máy khi bắt đầu tiết học.</p>
        </div>
        <button onClick={handleAddClass} className="flex items-center gap-2 rounded-lg h-11 px-5 bg-primary text-white text-sm font-bold shadow-sm hover:bg-blue-600 transition-colors">
          <span className="material-symbols-outlined">add</span>
          <span>Thêm lớp mới</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-border">
              <th className="px-6 py-4 text-xs font-bold text-textSecondary uppercase tracking-wider">Tên lớp</th>
              <th className="px-6 py-4 text-xs font-bold text-textSecondary uppercase tracking-wider">Số học sinh</th>
              <th className="px-6 py-4 text-xs font-bold text-textSecondary uppercase tracking-wider">Ghi chú</th>
              <th className="px-6 py-4 text-xs font-bold text-textSecondary uppercase tracking-wider text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {classes.map(cls => {
              const studentCount = students.filter(s => s.class === cls.name).length;
              return (
                <tr key={cls.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-bold text-textPrimary">{cls.name}</td>
                  <td className="px-6 py-4">
                    <span className="bg-gray-100 text-gray-800 text-xs font-bold px-2.5 py-0.5 rounded-full">{studentCount} HS</span>
                  </td>
                  <td className="px-6 py-4 text-textSecondary text-sm">{cls.note || '-'}</td>
                  <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                    <button onClick={() => handleActivateClass(cls.name)} className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg font-bold hover:bg-green-200 transition-colors" title="Nạp học sinh lớp này vào máy tính">
                      <span className="material-symbols-outlined text-sm">login</span> Nạp vào phòng
                    </button>
                    <button onClick={() => { setStatsClass(cls.name); setIsStatsModalOpen(true); }} className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg font-bold hover:bg-purple-200 transition-colors" title="Xem thống kê lớp">
                      <span className="material-symbols-outlined text-sm">analytics</span> Thống kê
                    </button>
                    <div className="h-4 w-[1px] bg-gray-300 mx-1"></div>
                    <button onClick={() => triggerImport(cls.name)} className="text-primary hover:bg-blue-50 p-2 rounded" title="Import Excel">
                      <span className="material-symbols-outlined text-xl">upload_file</span>
                    </button>
                    <button onClick={() => handleEditClass(cls)} className="text-gray-500 hover:bg-gray-100 p-2 rounded" title="Sửa">
                      <span className="material-symbols-outlined text-xl">edit</span>
                    </button>
                    <button onClick={() => handleDeleteClass(cls.id)} className="text-danger hover:bg-red-50 p-2 rounded" title="Xóa">
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                  </td>
                </tr>
              );
            })}
            {classes.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-400">Chưa có lớp học nào. Hãy thêm lớp mới.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".xlsx, .xls"
        className="hidden"
      />
    </div>
  );

  const renderComputersView = () => (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-wrap justify-between items-end gap-4 mb-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black leading-tight tracking-tight text-textPrimary">Danh sách thiết bị</h1>
          <p className="text-textSecondary text-sm font-normal">Quản lý và giám sát tình trạng máy tính tại Phòng máy 01.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => window.print()} className="flex items-center gap-2 rounded-lg h-11 px-5 bg-primary text-white text-sm font-bold shadow-sm hover:bg-blue-600 transition-colors">
            <span className="material-symbols-outlined">qr_code_scanner</span>
            <span>In QR Code</span>
          </button>
          <button onClick={handleResetData} className="flex items-center gap-2 rounded-lg h-11 px-4 bg-white border border-border text-textPrimary text-sm font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-200">
            <span className="material-symbols-outlined">delete_forever</span>
            <span>Reset Data</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-border">
                <th className="px-6 py-4 text-xs font-bold text-textSecondary uppercase tracking-wider">Mã máy</th>
                <th className="px-6 py-4 text-xs font-bold text-textSecondary uppercase tracking-wider">Vị trí</th>
                <th className="px-6 py-4 text-xs font-bold text-textSecondary uppercase tracking-wider">Học sinh</th>
                <th className="px-6 py-4 text-xs font-bold text-textSecondary uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-4 text-xs font-bold text-textSecondary uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {computers.map(comp => (
                <tr key={comp.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleComputerClick(comp)}>
                  <td className="px-6 py-4 font-bold text-textPrimary">{comp.id}</td>
                  <td className="px-6 py-4 text-textSecondary">{comp.location}</td>
                  <td className="px-6 py-4">
                    {comp.assignedStudentName ? (
                      <span className="font-semibold text-primary">{comp.assignedStudentName}</span>
                    ) : (
                      <span className="text-gray-400 italic">Chưa có</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${comp.status === ComputerStatus.WORKING ? 'bg-green-100 text-green-700' :
                      comp.status === ComputerStatus.BROKEN ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${comp.status === ComputerStatus.WORKING ? 'bg-green-500' :
                        comp.status === ComputerStatus.BROKEN ? 'bg-red-500' :
                          'bg-amber-500'
                        }`}></span> {STATUS_LABELS[comp.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-primary font-bold text-sm hover:underline">Chi tiết</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderViolationsView = () => (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-wrap justify-between items-end gap-3 mb-8">
        <div className="flex flex-col gap-1">
          <p className="text-textPrimary text-3xl font-black leading-tight">Ghi Nhận Vi Phạm</p>
          <p className="text-textSecondary text-base font-normal">Quản lý kỷ luật phòng máy tính</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Form */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-border">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">add_circle</span> Ghi nhận nhanh vi phạm
            </h3>
            <form onSubmit={handleQuickViolationSubmit} className="grid grid-cols-12 gap-4">
              <div className="col-span-12 md:col-span-5">
                <label className="block text-sm font-medium text-textPrimary mb-2">Học sinh (Tên hoặc Mã)</label>
                <input
                  value={quickViolationStudent}
                  onChange={e => setQuickViolationStudent(e.target.value)}
                  className="w-full rounded-lg border-border h-12 px-4 focus:ring-primary focus:border-primary border"
                  placeholder="Nhập tên hoặc mã HS..."
                  required
                />
              </div>
              <div className="col-span-6 md:col-span-3">
                <label className="block text-sm font-medium text-textPrimary mb-2">Mã máy</label>
                <input
                  value={quickViolationComputer}
                  onChange={e => setQuickViolationComputer(e.target.value)}
                  className="w-full rounded-lg border-border h-12 px-4 focus:ring-primary focus:border-primary border"
                  placeholder="VD: M01"
                />
              </div>
              <div className="col-span-6 md:col-span-4">
                <label className="block text-sm font-medium text-textPrimary mb-2">Loại vi phạm</label>
                <select
                  value={quickViolationType}
                  onChange={e => setQuickViolationType(e.target.value)}
                  className="w-full rounded-lg border-border h-12 px-4 focus:ring-primary focus:border-primary border"
                  required
                >
                  <option value="">Chọn vi phạm</option>
                  {VIOLATION_TYPES.map(v => (
                    <option key={v.type} value={v.type}>{v.label} ({v.points}đ)</option>
                  ))}
                </select>
              </div>
              <div className="col-span-12">
                <label className="block text-sm font-medium text-textPrimary mb-2">Ghi chú thêm</label>
                <textarea
                  value={quickViolationNote}
                  onChange={e => setQuickViolationNote(e.target.value)}
                  className="w-full rounded-lg border-border px-4 py-2 focus:ring-primary focus:border-primary border"
                  placeholder="Chi tiết vi phạm..."
                  rows={2}
                ></textarea>
              </div>
              <div className="col-span-12 flex justify-end mt-2">
                <button type="submit" className="bg-primary hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined">save</span> Lưu vi phạm
                </button>
              </div>
            </form>
          </div>

          {/* Recent History Table */}
          <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h3 className="text-xl font-bold">Lịch sử vi phạm gần đây</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-textSecondary text-xs uppercase tracking-wider font-semibold">
                    <th className="px-6 py-4">Thời gian</th>
                    <th className="px-6 py-4">Học sinh</th>
                    <th className="px-6 py-4 text-center">Máy</th>
                    <th className="px-6 py-4">Lỗi vi phạm</th>
                    <th className="px-6 py-4 text-center">Điểm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {violations.map(v => (
                    <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium">{formatDateTime(v.date)}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-textPrimary">{v.studentName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-mono font-bold">{v.computerId}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600">{v.violationName}</span>
                      </td>
                      <td className="px-6 py-4 text-center text-red-600 font-bold">{v.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Stats */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <div className="bg-primary/10 p-6 rounded-xl border border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <span className="text-primary font-bold">Thống kê vi phạm</span>
              <span className="material-symbols-outlined text-primary">trending_up</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <p className="text-xs text-textSecondary">Tổng lượt</p>
                <p className="text-xl font-black">{violations.length}</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <p className="text-xs text-textSecondary">Điểm trừ</p>
                <p className="text-xl font-black text-danger">{violations.reduce((acc, curr) => acc + curr.points, 0)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTeachingView = () => (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col gap-1 mb-6">
        <h1 className="text-3xl font-black tracking-tight text-textPrimary">Sổ Giảng Dạy Điện Tử</h1>
        <p className="text-textSecondary">Quản lý và ghi chép nhật ký giảng dạy</p>
      </div>

      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Timeline */}
        <aside className="col-span-12 lg:col-span-4 bg-white rounded-xl border border-border overflow-hidden shadow-sm">
          <div className="p-5 border-b border-border flex justify-between items-center">
            <h3 className="font-bold text-lg">Lịch sử tiết dạy</h3>
            <div className="text-primary text-sm font-medium">{teacherLogs.length} tiết</div>
          </div>
          <div className="p-5 overflow-y-auto max-h-[600px]">
            <div className="flex flex-col">
              {teacherLogs.length > 0 ? teacherLogs.map((log) => (
                <div key={log.id} className="grid grid-cols-[32px_1fr] gap-x-4 mb-6 last:mb-0">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-lg">schedule</span>
                    </div>
                    <div className="w-[2px] bg-gray-100 grow my-1 h-full"></div>
                  </div>
                  <div className="pb-2">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-bold text-textPrimary text-sm">{log.period} - {log.class}</p>
                      <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Hoàn thành</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-1">{formatDate(log.date)} | {log.studentPresent}/{log.studentTotal} HS</p>
                    <p className="text-sm text-textSecondary line-clamp-2 italic">"{log.lessonContent}"</p>
                  </div>
                </div>
              )) : (
                <p className="text-center text-gray-400 text-sm py-8">Chưa có lịch sử giảng dạy.</p>
              )}
            </div>
          </div>
        </aside>

        {/* Form */}
        <section className="col-span-12 lg:col-span-8 space-y-6">
          <div className="bg-white rounded-xl border border-border shadow-sm">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">edit_note</span>
                Ghi chú tiết dạy mới
              </h2>
            </div>
            <form className="p-6 space-y-8" onSubmit={handleSaveTeacherLog}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-textPrimary">Ngày giảng dạy</label>
                  <input
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="rounded-lg border-border border p-2 focus:ring-primary focus:outline-none"
                    type="date"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-textPrimary">Tiết học</label>
                  <select
                    value={logPeriod}
                    onChange={(e) => setLogPeriod(e.target.value)}
                    className="rounded-lg border-border border p-2 focus:ring-primary focus:outline-none"
                  >
                    <option>Tiết 1</option>
                    <option>Tiết 2</option>
                    <option>Tiết 3</option>
                    <option>Tiết 4</option>
                    <option>Tiết 5</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2 lg:col-span-2">
                  <label className="text-sm font-semibold text-textPrimary">Lớp học</label>
                  <select
                    value={logClass}
                    onChange={(e) => setLogClass(e.target.value)}
                    className="w-full rounded-lg border-border border p-2 focus:ring-primary focus:outline-none"
                    required
                  >
                    <option value="">Chọn lớp học...</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-textPrimary">Nội dung bài dạy</label>
                <textarea
                  value={logContent}
                  onChange={(e) => setLogContent(e.target.value)}
                  className="rounded-lg border-border border p-2 focus:ring-primary focus:outline-none"
                  placeholder="Nhập chi tiết nội dung..."
                  rows={6}
                  required
                ></textarea>
              </div>
              <div className="flex items-center justify-end gap-4 pt-6 border-t border-border">
                <button
                  className="px-6 py-2.5 rounded-lg border border-border font-bold text-textSecondary hover:bg-gray-50 transition-colors"
                  type="button"
                  onClick={() => {
                    setLogContent('');
                    setLogClass('');
                  }}
                >
                  Hủy bỏ
                </button>
                <button className="px-8 py-2.5 rounded-lg bg-primary text-white font-bold hover:bg-blue-600 shadow-lg shadow-primary/20 transition-all flex items-center gap-2" type="submit">
                  <span className="material-symbols-outlined">save</span> Lưu Sổ
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );

  return (
    <>
      <div className="min-h-screen bg-background text-textPrimary font-sans print:hidden">
        {/* Top Navigation */}
        <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-border bg-white px-6 py-3 shadow-sm">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 text-primary cursor-pointer" onClick={() => setActiveView('dashboard')}>
              <div className="w-8 h-8 flex items-center justify-center bg-primary rounded-lg text-white">
                <span className="material-symbols-outlined">computer</span>
              </div>
              <h2 className="text-textPrimary text-xl font-bold leading-tight tracking-tight">LabManager</h2>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <button onClick={() => setActiveView('dashboard')} className={`text-sm font-medium transition-colors ${activeView === 'dashboard' ? 'text-primary font-bold border-b-2 border-primary pb-1' : 'text-textSecondary hover:text-primary'}`}>Dashboard</button>
              <button onClick={() => setActiveView('computers')} className={`text-sm font-medium transition-colors ${activeView === 'computers' ? 'text-primary font-bold border-b-2 border-primary pb-1' : 'text-textSecondary hover:text-primary'}`}>Quản lý máy</button>
              <button onClick={() => setActiveView('classes')} className={`text-sm font-medium transition-colors ${activeView === 'classes' ? 'text-primary font-bold border-b-2 border-primary pb-1' : 'text-textSecondary hover:text-primary'}`}>Quản lý lớp</button>
              <button onClick={() => setActiveView('violations')} className={`text-sm font-medium transition-colors ${activeView === 'violations' ? 'text-primary font-bold border-b-2 border-primary pb-1' : 'text-textSecondary hover:text-primary'}`}>Kỷ luật</button>
              <button onClick={() => setActiveView('teaching')} className={`text-sm font-medium transition-colors ${activeView === 'teaching' ? 'text-primary font-bold border-b-2 border-primary pb-1' : 'text-textSecondary hover:text-primary'}`}>Sổ giảng dạy</button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsScannerOpen(true)} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-textPrimary px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
              <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
              <span className="hidden sm:inline">Quét QR</span>
            </button>
            <div className="h-8 w-[1px] bg-gray-200 mx-2"></div>
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-sm font-semibold">Admin</span>
                <span className="text-xs text-textSecondary">Giáo viên</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold border border-border">A</div>
            </div>
          </div>
        </header>

        <main className="max-w-[1440px] mx-auto px-4 lg:px-10 py-8">
          {activeView === 'dashboard' && renderDashboard()}
          {activeView === 'computers' && renderComputersView()}
          {activeView === 'classes' && renderClassesView()}
          {activeView === 'violations' && renderViolationsView()}
          {activeView === 'teaching' && renderTeachingView()}
        </main>

        {/* Floating Action Button */}
        <button
          onClick={() => { setActiveView('violations'); }}
          className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform z-40"
          title="Ghi nhanh vi phạm"
        >
          <span className="material-symbols-outlined">add</span>
        </button>

        {/* Modals */}
        {selectedComputer && (
          <ComputerModal
            computer={selectedComputer}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onUpdate={refreshData}
          />
        )}

        {isScannerOpen && (
          <QRScanner
            onScan={handleScanResult}
            onClose={() => setIsScannerOpen(false)}
          />
        )}

        {/* Add/Edit Class Modal */}
        {isClassModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="px-6 py-4 border-b border-border flex justify-between items-center">
                <h3 className="font-bold text-xl">{editingClass ? 'Sửa thông tin lớp' : 'Thêm lớp mới'}</h3>
                <button onClick={() => setIsClassModalOpen(false)}><span className="material-symbols-outlined">close</span></button>
              </div>
              <form onSubmit={handleSaveClass} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-textPrimary mb-1">Tên lớp <span className="text-red-500">*</span></label>
                  <input
                    value={classNameInput}
                    onChange={e => setClassNameInput(e.target.value)}
                    className="w-full border border-border rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:outline-none"
                    placeholder="VD: 10A1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-textPrimary mb-1">Ghi chú</label>
                  <textarea
                    value={classNoteInput}
                    onChange={e => setClassNoteInput(e.target.value)}
                    className="w-full border border-border rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:outline-none"
                    placeholder="Ghi chú thêm..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setIsClassModalOpen(false)} className="px-4 py-2 rounded-lg border border-border font-medium hover:bg-gray-50">Hủy</button>
                  <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-white font-bold hover:bg-blue-600 shadow-sm">Lưu</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Class Statistics Modal */}
        {isStatsModalOpen && statsClass && (() => {
          const classStudents = students.filter(s => s.class === statsClass);
          const classViolations = violations.filter(v => v.class === statsClass);
          const classLogs = teacherLogs.filter(log => log.class === statsClass);
          const totalPenaltyPoints = classViolations.reduce((acc, v) => acc + v.points, 0);

          // Group violations by type
          const violationsByType: { [key: string]: number } = {};
          classViolations.forEach(v => {
            violationsByType[v.violationName] = (violationsByType[v.violationName] || 0) + 1;
          });

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-gradient-to-r from-purple-600 to-blue-600">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-white text-2xl">analytics</span>
                    <div>
                      <h3 className="font-bold text-xl text-white">Thống kê lớp {statsClass}</h3>
                      <p className="text-white/80 text-sm">{classStudents.length} học sinh</p>
                    </div>
                  </div>
                  <button onClick={() => setIsStatsModalOpen(false)} className="text-white/80 hover:text-white">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-xl text-center">
                      <span className="material-symbols-outlined text-blue-600 text-3xl mb-2">groups</span>
                      <p className="text-2xl font-bold text-blue-700">{classStudents.length}</p>
                      <p className="text-xs text-blue-600 font-medium">Học sinh</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-xl text-center">
                      <span className="material-symbols-outlined text-green-600 text-3xl mb-2">menu_book</span>
                      <p className="text-2xl font-bold text-green-700">{classLogs.length}</p>
                      <p className="text-xs text-green-600 font-medium">Tiết đã dạy</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-xl text-center">
                      <span className="material-symbols-outlined text-red-600 text-3xl mb-2">gavel</span>
                      <p className="text-2xl font-bold text-red-700">{classViolations.length}</p>
                      <p className="text-xs text-red-600 font-medium">Vi phạm</p>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-xl text-center">
                      <span className="material-symbols-outlined text-amber-600 text-3xl mb-2">trending_down</span>
                      <p className="text-2xl font-bold text-amber-700">{totalPenaltyPoints}</p>
                      <p className="text-xs text-amber-600 font-medium">Điểm trừ</p>
                    </div>
                  </div>

                  {/* Violations Detail */}
                  {classViolations.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-bold text-textPrimary mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-red-500">report</span>
                        Chi tiết vi phạm
                      </h4>
                      <div className="space-y-2">
                        {Object.entries(violationsByType).map(([type, count]) => (
                          <div key={type} className="flex items-center justify-between bg-white p-3 rounded-lg border border-border">
                            <span className="text-sm font-medium text-textPrimary">{type}</span>
                            <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">{count} lần</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Teaching Logs */}
                  {classLogs.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-bold text-textPrimary mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-green-500">history_edu</span>
                        Lịch sử giảng dạy gần đây
                      </h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {classLogs.slice(0, 5).map(log => (
                          <div key={log.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-border">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-textPrimary">{log.period}</p>
                              <p className="text-xs text-textSecondary truncate">{log.lessonContent || 'Không có nội dung'}</p>
                            </div>
                            <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded-full">{formatDate(log.date)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {classViolations.length === 0 && classLogs.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <span className="material-symbols-outlined text-5xl mb-2">inbox</span>
                      <p>Chưa có dữ liệu thống kê cho lớp này</p>
                    </div>
                  )}
                </div>

                <div className="px-6 py-4 border-t border-border flex justify-end">
                  <button
                    onClick={() => setIsStatsModalOpen(false)}
                    className="px-6 py-2 rounded-lg bg-primary text-white font-bold hover:bg-blue-600 shadow-sm"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
      <PrintableQRGrid computers={computers} />
    </>
  );
};

export default App;
