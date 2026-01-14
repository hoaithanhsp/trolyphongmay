import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, RefreshCw } from 'lucide-react';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const [error, setError] = useState<string>('');
  const [isStarted, setIsStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  const startScanner = async () => {
    setIsLoading(true);
    setError('');

    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode("qr-reader");
      }

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      await html5QrCodeRef.current.start(
        { facingMode: "environment" }, // Camera sau trên điện thoại
        config,
        (decodedText) => {
          // Phát âm thanh khi quét thành công (nếu có)
          onScan(decodedText);
          stopScanner();
        },
        () => { } // Ignore errors during scanning
      );

      setIsStarted(true);
    } catch (err: any) {
      console.error("Camera error:", err);
      if (err.toString().includes("NotAllowedError")) {
        setError("Vui lòng cấp quyền truy cập Camera trong cài đặt trình duyệt.");
      } else if (err.toString().includes("NotFoundError")) {
        setError("Không tìm thấy Camera trên thiết bị này.");
      } else {
        setError("Không thể khởi động Camera. Vui lòng thử lại.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && isStarted) {
      try {
        await html5QrCodeRef.current.stop();
        setIsStarted(false);
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
  };

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  useEffect(() => {
    // Auto-start camera when component mounts
    startScanner();

    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/80 backdrop-blur-sm">
        <h2 className="text-white font-bold text-lg flex items-center gap-2">
          <Camera size={20} />
          Quét mã QR
        </h2>
        <button
          onClick={handleClose}
          className="text-white bg-white/20 p-2 rounded-full hover:bg-white/30"
        >
          <X size={24} />
        </button>
      </div>

      {/* Camera View */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {/* QR Reader Container */}
        <div className="w-full max-w-sm">
          <div
            id="qr-reader"
            className="w-full bg-gray-900 rounded-xl overflow-hidden"
            style={{ minHeight: '300px' }}
          ></div>
        </div>

        {/* Instructions */}
        <div className="mt-6 text-center">
          {isLoading && (
            <div className="flex items-center gap-2 text-primary">
              <RefreshCw className="animate-spin" size={20} />
              <span className="text-white">Đang khởi động camera...</span>
            </div>
          )}

          {isStarted && !error && (
            <>
              <p className="text-white text-lg font-medium">Đưa mã QR vào khung hình</p>
              <p className="text-gray-400 text-sm mt-1">Mã QR trên máy tính có dạng: LAB-M01</p>
            </>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 max-w-sm">
              <p className="text-red-400 text-sm mb-3">{error}</p>
              <button
                onClick={startScanner}
                className="bg-primary text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 mx-auto"
              >
                <RefreshCw size={16} />
                Thử lại
              </button>
            </div>
          )}
        </div>

        {/* Manual Input Option */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm mb-2">Hoặc nhập mã máy thủ công:</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const input = (e.target as HTMLFormElement).elements.namedItem('machineCode') as HTMLInputElement;
              if (input.value.trim()) {
                onScan(`LAB-${input.value.toUpperCase().trim()}`);
                handleClose();
              }
            }}
            className="flex gap-2 max-w-xs mx-auto"
          >
            <input
              name="machineCode"
              type="text"
              placeholder="VD: M01"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary"
            />
            <button
              type="submit"
              className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors"
            >
              Tìm
            </button>
          </form>
        </div>
      </div>

      {/* Footer info */}
      <div className="p-4 bg-black/80 text-center">
        <p className="text-gray-500 text-xs">
          💡 Quét mã QR dán trên máy để xem thông tin và báo lỗi nhanh
        </p>
      </div>
    </div>
  );
};
