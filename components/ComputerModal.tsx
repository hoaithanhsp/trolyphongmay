import React, { useEffect, useState } from 'react';
import { Computer, ComputerStatus, ViolationType, Student } from '../types';
import QRCode from 'qrcode';
import { Button } from './Button';
import { STATUS_LABELS, VIOLATION_TYPES } from '../constants';
import { storageService } from '../services/storageService';

interface ComputerModalProps {
  computer: Computer;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const ComputerModal: React.FC<ComputerModalProps> = ({ computer, isOpen, onClose, onUpdate }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'info' | 'violation'>('info');
  const [studentId, setStudentId] = useState<string>(computer.assignedStudentId || '');
  const [violationType, setViolationType] = useState<string>(ViolationType.GAMING);
  const [violationNote, setViolationNote] = useState('');
  const [studentsList, setStudentsList] = useState<Student[]>([]);

  useEffect(() => {
    if (isOpen) {
      setStudentsList(storageService.getStudents());
      if (computer) {
        QRCode.toDataURL(`LAB-${computer.id}`, { width: 200, margin: 2 })
          .then(url => setQrCodeUrl(url))
          .catch(err => console.error(err));
        
        // Always reset student selection to assigned student when opening
        setStudentId(computer.assignedStudentId || '');
        setActiveTab('info');
        setViolationNote('');
        setViolationType(ViolationType.GAMING);
      }
    }
  }, [isOpen, computer]);

  if (!isOpen) return null;

  const handleStatusChange = (status: ComputerStatus) => {
    storageService.updateComputerStatus(computer.id, status);
    onUpdate();
  };

  const handleViolationSubmit = () => {
    if (!studentId) {
        alert("Vui lòng chọn học sinh (hoặc gán học sinh vào máy trước)");
        return;
    }
    const student = studentsList.find(s => s.id === studentId);
    const typeData = VIOLATION_TYPES.find(v => v.type === violationType);
    
    storageService.addViolation({
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        studentId,
        studentName: student?.name || computer.assignedStudentName || 'Unknown',
        class: student?.class || 'Unknown',
        computerId: computer.id,
        violationType: violationType as ViolationType,
        violationName: typeData?.label || 'Khác',
        points: typeData?.points || 0,
        note: violationNote,
        teacherName: 'Admin'
    });
    alert('Ghi nhận vi phạm thành công');
    onUpdate();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-surface rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-border bg-gray-50">
           <div>
             <span className="text-xs font-bold text-primary uppercase tracking-widest mb-1 block">Chi tiết máy</span>
             <h2 className="text-2xl font-black text-textPrimary">{computer.name} ({computer.id})</h2>
             <div className="flex items-center gap-2 mt-1">
                <span className="material-symbols-outlined text-sm text-textSecondary">location_on</span>
                <span className="text-sm text-textSecondary">{computer.location}</span>
             </div>
           </div>
           <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded text-textSecondary">
             <span className="material-symbols-outlined">close</span>
           </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                <button 
                  onClick={() => setActiveTab('info')}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors ${activeTab === 'info' ? 'bg-primary text-white border-primary' : 'bg-white text-textSecondary border-border hover:bg-gray-50'}`}
                >
                    Thông tin
                </button>
                <button 
                  onClick={() => setActiveTab('violation')}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-colors ${activeTab === 'violation' ? 'bg-danger text-white border-danger' : 'bg-white text-textSecondary border-border hover:bg-gray-50'}`}
                >
                    Báo vi phạm
                </button>
            </div>

            {activeTab === 'info' ? (
                <div className="space-y-6">
                    <div className="flex justify-center">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
                             <img src={qrCodeUrl} alt="QR" className="w-32 h-32 mix-blend-multiply" />
                             <span className="font-mono font-bold mt-2">LAB-{computer.id}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-50 rounded-lg">
                           <p className="text-[10px] uppercase font-bold text-textSecondary mb-0.5">Trạng thái</p>
                           <p className={`text-sm font-bold ${
                               computer.status === 'working' ? 'text-green-600' : 
                               computer.status === 'broken' ? 'text-red-600' : 'text-orange-600'
                           }`}>{STATUS_LABELS[computer.status]}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                           <p className="text-[10px] uppercase font-bold text-textSecondary mb-0.5">Học sinh</p>
                           <p className="text-sm font-bold text-textPrimary truncate">{computer.assignedStudentName || 'Trống'}</p>
                        </div>
                    </div>

                    <div>
                       <p className="text-sm font-bold text-textPrimary mb-2">Cập nhật trạng thái:</p>
                       <div className="flex gap-2">
                           <button onClick={() => handleStatusChange(ComputerStatus.WORKING)} className="flex-1 py-2 bg-green-50 text-green-700 rounded hover:bg-green-100 text-xs font-bold">Tốt</button>
                           <button onClick={() => handleStatusChange(ComputerStatus.MAINTENANCE)} className="flex-1 py-2 bg-orange-50 text-orange-700 rounded hover:bg-orange-100 text-xs font-bold">Bảo trì</button>
                           <button onClick={() => handleStatusChange(ComputerStatus.BROKEN)} className="flex-1 py-2 bg-red-50 text-red-700 rounded hover:bg-red-100 text-xs font-bold">Hỏng</button>
                       </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-textPrimary mb-1">Học sinh</label>
                        {computer.assignedStudentId ? (
                            <div className="w-full border border-border rounded-lg p-2.5 text-sm bg-gray-100 text-gray-700 font-semibold flex items-center">
                                <span className="material-symbols-outlined text-base mr-2 text-primary">person</span>
                                {computer.assignedStudentName}
                            </div>
                        ) : (
                            <select 
                                value={studentId} 
                                onChange={(e) => setStudentId(e.target.value)}
                                className="w-full border-border rounded-lg p-2.5 text-sm"
                            >
                                <option value="">Chọn học sinh...</option>
                                {studentsList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.class})</option>)}
                            </select>
                        )}
                        {!computer.assignedStudentId && !studentId && (
                            <p className="text-xs text-orange-500 mt-1">Máy này chưa được gán học sinh. Vui lòng chọn thủ công.</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-textPrimary mb-1">Loại vi phạm</label>
                        <select 
                            value={violationType} 
                            onChange={(e) => setViolationType(e.target.value)}
                            className="w-full border-border rounded-lg p-2.5 text-sm"
                        >
                            {VIOLATION_TYPES.map(v => <option key={v.type} value={v.type}>{v.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-textPrimary mb-1">Ghi chú</label>
                        <textarea 
                            value={violationNote}
                            onChange={e => setViolationNote(e.target.value)}
                            className="w-full border-border rounded-lg p-2.5 text-sm"
                            rows={3}
                        ></textarea>
                    </div>
                    <Button variant="danger" className="w-full mt-2" onClick={handleViolationSubmit}>Xác nhận</Button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};