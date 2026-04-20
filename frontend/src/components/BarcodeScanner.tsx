import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScannerDetected: (barcode: string) => void;
  onClose: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScannerDetected, onClose }) => {
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isMountedRef = useRef(true);

  const stopScanner = useCallback(async (): Promise<void> => {
    if (!scannerRef.current) {
      return;
    }

    try {
      await scannerRef.current.stop();
    } catch (e) {
      // Scanner might already be stopped or not started - ignore
    } finally {
      scannerRef.current = null;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    const startScanner = async () => {
      try {
        const html5Qrcode = new Html5Qrcode('barcode-scanner');
        scannerRef.current = html5Qrcode;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        const success = await html5Qrcode.start(
          { facingMode: 'environment' },
          config,
          async (decodedText) => {
            await stopScanner();
            if (isMountedRef.current) {
              setIsScanning(false);
              onScannerDetected(decodedText);
            }
          },
          () => {
            // Scan failure - ignore frame scan errors
          }
        );

        if (success && isMountedRef.current) {
          setIsScanning(true);
          setError(null);
        } else {
          setError('Failed to start camera. Please check permissions.');
          scannerRef.current = null;
        }
      } catch (err: any) {
        scannerRef.current = null;
        if (isMountedRef.current) {
          setError(err.message || 'Camera access denied or not supported');
        }
      }
    };

    startScanner();

    return () => {
      isMountedRef.current = false;
      // Best effort stop on unmount
      stopScanner();
    };
  }, [onScannerDetected, stopScanner]);

  const handleClose = async () => {
    await stopScanner();
    if (isMountedRef.current) {
      setIsScanning(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-800">Scan Barcode/QR</h3>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-4">
          {error ? (
            <div className="text-center py-8">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <p className="text-red-600 font-semibold mb-4">{error}</p>
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-sm text-gray-600 text-center">
                  Position the barcode within the frame
                </p>
              </div>
              <div
                id="barcode-scanner"
                className="mx-auto rounded overflow-hidden"
                style={{ width: '300px', height: '300px' }}
              />
              {isScanning && (
                <div className="text-center mt-4">
                  <div className="inline-block animate-pulse">
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Scanning...
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
