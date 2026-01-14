import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Computer } from '../types';

export const PrintableQRGrid: React.FC<{ computers: Computer[] }> = ({ computers }) => {
  return (
    <div className="hidden print:block absolute top-0 left-0 w-full min-h-screen bg-white z-[9999] p-8">
        <div className="text-center mb-8 border-b-2 border-black pb-4">
            <h1 className="text-3xl font-bold text-black uppercase mb-2">Danh sách Mã QR Phòng Máy</h1>
            <p className="text-sm text-gray-600">Hệ thống LabManager - Quét mã để Check-in/Báo lỗi</p>
        </div>
        <div className="grid grid-cols-4 gap-6">
            {computers.map(c => (
                <QRItem key={c.id} computer={c} />
            ))}
        </div>
        <div className="mt-8 text-center text-xs text-gray-400">
            In từ hệ thống LabManager
        </div>
    </div>
  );
};

const QRItem: React.FC<{ computer: Computer }> = ({ computer }) => {
  const [src, setSrc] = useState('');

  useEffect(() => {
    QRCode.toDataURL(`LAB-${computer.id}`, { width: 200, margin: 1, errorCorrectionLevel: 'H' })
      .then(setSrc);
  }, [computer.id]);

  return (
    <div className="border-2 border-gray-300 p-4 rounded-lg flex flex-col items-center text-center break-inside-avoid page-break-inside-avoid shadow-sm">
      <h3 className="font-bold text-xl text-black mb-2">{computer.name}</h3>
      {src && <img src={src} alt={computer.id} className="w-40 h-40 object-contain" />}
      <p className="text-sm font-mono font-bold mt-2 bg-gray-100 px-2 py-1 rounded">LAB-{computer.id}</p>
    </div>
  );
};