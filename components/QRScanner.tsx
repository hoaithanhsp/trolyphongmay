import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const config = { 
      fps: 10, 
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0
    };

    try {
      scannerRef.current = new Html5QrcodeScanner(
        "reader",
        config,
        /* verbose= */ false
      );

      scannerRef.current.render(
        (decodedText) => {
          onScan(decodedText);
        },
        (errorMessage) => {
          // parse error, ignore
        }
      );
    } catch (e) {
      setError("Không thể khởi động Camera. Vui lòng cấp quyền.");
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Failed to clear html5-qrcode scanner. ", error);
        });
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col lg:flex-row overflow-hidden">
       {/* Left Side: Camera */}
       <div className="relative flex-1 bg-black flex items-center justify-center">
            <button 
                onClick={onClose} 
                className="absolute top-6 right-6 text-white bg-white/20 p-2 rounded-full hover:bg-white/30 z-50 backdrop-blur-md"
            >
                <X size={24} />
            </button>
            
            <div className="w-full max-w-md p-4 relative">
                <div id="reader" className="w-full bg-black rounded-xl overflow-hidden border-2 border-primary/50"></div>
                
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-primary/50 rounded-lg pointer-events-none hidden md:block">
                     <div className="absolute top-0 left-0 w-full h-0.5 bg-primary shadow-[0_0_10px_#0078d4] animate-[scan_2s_infinite]"></div>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-white text-lg font-medium">Đang quét mã QR...</p>
                    <p className="text-gray-400 text-sm mt-2">Đưa mã QR trên máy vào khung hình</p>
                    {error && <p className="text-red-500 mt-2">{error}</p>}
                </div>
            </div>
       </div>

       {/* Right Side: Info Panel (Mockup visual) */}
       <div className="hidden lg:flex w-96 bg-white flex-col p-8 justify-center items-center text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
                <span className="material-symbols-outlined text-4xl">qr_code_scanner</span>
            </div>
            <h2 className="text-2xl font-bold text-textPrimary mb-2">Chế độ Quét Nhanh</h2>
            <p className="text-textSecondary mb-8">Sử dụng để check-in học sinh hoặc báo lỗi thiết bị nhanh chóng.</p>
            
            <div className="w-full space-y-3">
                <div className="p-4 bg-gray-50 rounded-lg border border-border text-left flex items-center gap-3">
                    <span className="material-symbols-outlined text-green-600">check_circle</span>
                    <div>
                        <p className="text-sm font-bold">Tự động nhận diện</p>
                        <p className="text-xs text-gray-500">Mã máy &gt; Check-in</p>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-border text-left flex items-center gap-3">
                    <span className="material-symbols-outlined text-orange-600">flash_on</span>
                    <div>
                        <p className="text-sm font-bold">Thao tác chạm</p>
                        <p className="text-xs text-gray-500">Xử lý trong 1 giây</p>
                    </div>
                </div>
            </div>
       </div>
    </div>
  );
};