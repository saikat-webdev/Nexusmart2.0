import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

interface SaleItem {
  id: number;
  product_id: number;
  product: {
    id: number;
    name: string;
    sku: string;
  };
  quantity: number;
  unit_price: number;
  line_item_total: number;
}

interface Sale {
  id: number;
  invoice_number: string;
  sale_datetime: string;
  total_amount: number;
  payment_method: string;
  user: { name: string };
  sale_items: SaleItem[];
}

const Returns: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchInvoice, setSearchInvoice] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [returnItems, setReturnItems] = useState<Record<number, number>>({});
  const [processing, setProcessing] = useState(false);

  const searchSale = async () => {
    if (!searchInvoice.trim()) return;
    setLoading(true);
    try {
      const response = await api.get('/sales', {
        params: { invoice_number: searchInvoice.trim(), per_page: 1 }
      });
      const data = response.data.data || response.data;
      const salesList = Array.isArray(data) ? data : [data];
      if (salesList.length > 0) {
        setSelectedSale(salesList[0]);
        // Initialize return quantities to 0
        const initial: Record<number, number> = {};
        const items = salesList[0].sale_items || [];
        items.forEach((item: SaleItem) => {
          initial[item.id] = 0;
        });
        setReturnItems(initial);
      } else {
        toast.error('Sale not found');
        setSelectedSale(null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error searching sale');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (itemId: number, value: string) => {
    const qty = parseInt(value, 10) || 0;
    setReturnItems(prev => ({ ...prev, [itemId]: qty }));
  };

  const processReturn = async () => {
    if (!selectedSale) return;

    const returnEntries = Object.entries(returnItems).filter(([_, qty]) => qty > 0);
    if (returnEntries.length === 0) {
      toast.error('No items selected for return');
      return;
    }

    setProcessing(true);
    let successCount = 0;

     try {
       for (const [itemIdStr, quantity] of returnEntries) {
         const itemId = parseInt(itemIdStr, 10);
         const saleItem = (selectedSale.sale_items || []).find(i => i.id === itemId);
         if (!saleItem) continue;

        // Prepare payload
        const payload = {
          sale_id: selectedSale.id,
          sale_item_id: itemId,
          product_id: saleItem.product_id,
          quantity: quantity,
          reason: returnReason || null,
        };

        await api.post('/sale-returns', payload);
        successCount++;
      }

      toast.success(`${successCount} item(s) returned successfully`);
      // Reset state
      setSelectedSale(null);
      setSearchInvoice('');
      setReturnItems({});
      setReturnReason('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to process return');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Sales Returns</h1>
        <p className="text-gray-600 mt-1">Process returns for completed sales</p>
      </div>

      {/* Search Sale */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Find Sale</h2>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Enter Invoice Number"
            value={searchInvoice}
            onChange={(e) => setSearchInvoice(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchSale()}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={searchSale}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Sale Details */}
      {selectedSale && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Invoice: {selectedSale.invoice_number}</h2>
            <p className="text-gray-600">Date: {new Date(selectedSale.sale_datetime).toLocaleString()}</p>
            <p className="text-gray-600">Cashier: {selectedSale.user.name}</p>
          </div>

          {/* Items */}
          <div className="overflow-x-auto mb-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty Sold</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Return Qty</th>
                </tr>
              </thead>
           <tbody className="bg-white divide-y divide-gray-200">
                 {(selectedSale.sale_items || []).map((item) => (
                   <tr key={item.id}>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.product.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.product.sku}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">₹{item.unit_price.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.quantity}</td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        min="0"
                        max={item.quantity}
                        value={returnItems[item.id] || 0}
                        onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Reason */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Return Reason (optional)</label>
            <input
              type="text"
              placeholder="e.g., Defective product, Wrong item"
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={processReturn}
            disabled={processing}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-semibold"
          >
            {processing ? 'Processing...' : 'Process Return'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Returns;
