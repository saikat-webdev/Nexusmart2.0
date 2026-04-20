import { useState, useCallback } from 'react';
import api from '../services/api';

// Product interface matching API response
interface Product {
  id: number;
  name: string;
  sku: string;
  barcode: string | null;
  price: number;
  stock_quantity: number;
  is_active: boolean;
}

export const useBarcodeScanner = (onProductFound: (product: Product) => void) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startScan = useCallback(() => {
    setIsScanning(true);
    setError(null);
  }, []);

  const stopScan = useCallback(() => {
    setIsScanning(false);
  }, []);

  const handleBarcodeDetected = useCallback(async (barcode: string) => {
    try {
      const response = await api.post('/products/find-by-barcode', { code: barcode });
      onProductFound(response.data);
      setIsScanning(false);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setError(`Product not found for code: ${barcode}`);
      } else {
        setError('Error looking up product');
      }
      // Keep scanner open for retry
    }
  }, [onProductFound]);

  return {
    isScanning,
    error,
    startScan,
    stopScan,
    handleBarcodeDetected,
  };
};
