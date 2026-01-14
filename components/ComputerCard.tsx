import React from 'react';
import { Computer, ComputerStatus } from '../types';
import { Monitor, AlertTriangle, XCircle, Wrench, Slash, QrCode } from 'lucide-react';

interface ComputerCardProps {
  computer: Computer;
  onClick: (computer: Computer) => void;
}

const StatusIcon = ({ status }: { status: ComputerStatus }) => {
  switch (status) {
    case ComputerStatus.WORKING: return <Monitor className="w-6 h-6 text-white" />;
    case ComputerStatus.MAINTENANCE: return <AlertTriangle className="w-6 h-6 text-white" />;
    case ComputerStatus.BROKEN: return <XCircle className="w-6 h-6 text-white" />;
    case ComputerStatus.REPAIRING: return <Wrench className="w-6 h-6 text-white" />;
    case ComputerStatus.DISABLED: return <Slash className="w-6 h-6 text-white" />;
    default: return <Monitor className="w-6 h-6 text-white" />;
  }
};

const StatusColor = (status: ComputerStatus) => {
  switch (status) {
    case ComputerStatus.WORKING: return 'bg-secondary border-secondary';
    case ComputerStatus.MAINTENANCE: return 'bg-warning border-warning';
    case ComputerStatus.BROKEN: return 'bg-danger border-danger';
    case ComputerStatus.REPAIRING: return 'bg-orange-500 border-orange-500';
    case ComputerStatus.DISABLED: return 'bg-gray-400 border-gray-400';
    default: return 'bg-secondary';
  }
};

export const ComputerCard: React.FC<ComputerCardProps> = ({ computer, onClick }) => {
  return (
    <div 
      onClick={() => onClick(computer)}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden border border-border group"
    >
      <div className={`${StatusColor(computer.status)} p-3 flex justify-between items-center transition-colors duration-300`}>
        <span className="font-bold text-white text-lg font-mono">{computer.id}</span>
        <StatusIcon status={computer.status} />
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-textPrimary truncate">{computer.name}</h3>
        <p className="text-xs text-textSecondary mb-2">{computer.location}</p>
        
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
           {computer.assignedStudentName ? (
             <span className="text-xs text-primary font-medium truncate flex-1" title={computer.assignedStudentName}>
               👤 {computer.assignedStudentName}
             </span>
           ) : (
             <span className="text-xs text-gray-400 italic">Chưa có HS</span>
           )}
           <QrCode className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
        </div>
      </div>
    </div>
  );
};