import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../LoadingSpinner';
import toast from 'react-hot-toast';

interface DailySummary {
  total_sales: number;
  total_transactions: number;
  total_items_sold: number;
  cash_sales: number;
  card_sales: number;
  upi_sales: number;
}

const DailySalesSummary: React.FC = () => {
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSummary, setShowSummary] = useState(false);

  const fetchDailySummary = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await api.get(`/sales?date=${today}`);
      const sales = response.data.data || [];

      const summary: DailySummary = {
        total_sales: 0,
        total_transactions: sales.length,
        total_items_sold: 0,
        cash_sales: 0,
        card_sales: 0,
        upi_sales: 0,
      };

      sales.forEach((sale: any) => {
        summary.total_sales += parseFloat(sale.total_amount || 0);
        summary.total_items_sold += sale.items?.length || 0;

        const paymentMethod = (sale.payment_method || '').toLowerCase();
        const amount = parseFloat(sale.total_amount || 0);

        if (paymentMethod.includes('cash')) {
          summary.cash_sales += amount;
        } else if (paymentMethod.includes('card') || paymentMethod.includes('credit') || paymentMethod.includes('debit')) {
          summary.card_sales += amount;
        } else if (paymentMethod.includes('upi')) {
          summary.upi_sales += amount;
        }
      });

      setSummary(summary);
    } catch (error) {
      console.error('Failed to fetch daily summary:', error);
      toast.error('Failed to load daily summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showSummary) {
      fetchDailySummary();
    }
  }, [showSummary]);

  if (!showSummary) {
    return (
      <button
        onClick={() => setShowSummary(true)}
        className="fixed bottom-4 right-4 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition flex items-center gap-2 z-40"
        title="View Today's Sales Summary"
      >
        <span className="text-xl">📊</span>
        <span className="font-semibold">Today's Summary</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span>📊</span>
            <span>Today's Sales Summary</span>
          </h2>
          <button
            onClick={() => setShowSummary(false)}
            className="text-gray-400 hover:text-gray-600 text-3xl"
          >
            ×
          </button>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading summary..." />
        ) : summary ? (
          <div className="space-y-4">
            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                <div className="text-blue-600 text-sm font-semibold mb-1">Total Sales</div>
                <div className="text-3xl font-bold text-blue-900">₹{summary.total_sales.toFixed(2)}</div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                <div className="text-green-600 text-sm font-semibold mb-1">Transactions</div>
                <div className="text-3xl font-bold text-green-900">{summary.total_transactions}</div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                <div className="text-purple-600 text-sm font-semibold mb-1">Items Sold</div>
                <div className="text-3xl font-bold text-purple-900">{summary.total_items_sold}</div>
              </div>
            </div>

            {/* Payment Method Breakdown */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">Payment Method Breakdown</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">💵 Cash</span>
                  <span className="font-bold text-gray-900">₹{summary.cash_sales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">💳 Card</span>
                  <span className="font-bold text-gray-900">₹{summary.card_sales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">📱 UPI</span>
                  <span className="font-bold text-gray-900">₹{summary.upi_sales.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Motivational Message */}
            {summary.total_transactions > 0 && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200 text-center">
                <p className="text-orange-700 font-semibold">
                  🎉 Great job! Keep up the excellent work!
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-600">
            No sales data available for today
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setShowSummary(false)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailySalesSummary;
