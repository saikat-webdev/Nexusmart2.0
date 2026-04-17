import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Sale {
  id: number;
  invoice_number: string;
  customer_name: string | null;
  total_amount: number;
  payment_method: string;
  sale_datetime: string;
  user: { name: string };
}

const SalesReports: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const fetchSalesData = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      const [salesRes, statsRes] = await Promise.all([
        api.get('/sales', { params: { page, per_page: 25 } }),
        api.get('/dashboard/stats')
      ]);
      const salesData = salesRes.data.data || salesRes.data;
      setSales(Array.isArray(salesData) ? salesData : []);
      
      if (salesRes.data.meta) {
        setTotalPages(salesRes.data.meta.last_page || 1);
        setCurrentPage(salesRes.data.meta.current_page || 1);
      }
      
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch sales data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSalesData();
  }, [fetchSalesData]);

  const getPaymentMethodStats = () => {
    const methods = sales.reduce((acc: any, sale) => {
      acc[sale.payment_method] = (acc[sale.payment_method] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(methods).map(([name, value]) => ({
      name: name.replace('_', ' ').toUpperCase(),
      value
    }));
  };

  const getDailySales = () => {
    const dailyData = sales.reduce((acc: any, sale) => {
      const date = new Date(sale.sale_datetime).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = { date, total: 0, count: 0 };
      }
      acc[date].total += parseFloat(sale.total_amount.toString());
      acc[date].count += 1;
      return acc;
    }, {});

    return Object.values(dailyData).slice(-7); // Last 7 days
  };

  if (loading) return <LoadingSpinner message="Loading reports..." />;

  const totalRevenue = sales.reduce((sum, sale) => sum + parseFloat(sale.total_amount.toString()), 0);
  const avgTransactionValue = sales.length > 0 ? totalRevenue / sales.length : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Sales Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive sales performance insights</p>
        </div>
        <button
          onClick={() => fetchSalesData(currentPage)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          🔄 Refresh Data
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Revenue</p>
              <p className="text-3xl font-bold mt-2">₹{totalRevenue.toFixed(2)}</p>
              <p className="text-sm text-gray-500 mt-1">{sales.length} transactions</p>
            </div>
            <div className="text-4xl">💵</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Avg Transaction</p>
              <p className="text-3xl font-bold mt-2">₹{avgTransactionValue.toFixed(2)}</p>
            </div>
            <div className="text-4xl">📊</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Today's Sales</p>
              <p className="text-3xl font-bold mt-2">₹{stats?.today?.sales?.toFixed(2) || 0}</p>
              <p className="text-sm text-gray-500 mt-1">{stats?.today?.count || 0} orders</p>
            </div>
            <div className="text-4xl">📅</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Monthly Sales</p>
              <p className="text-3xl font-bold mt-2">₹{stats?.month?.sales?.toFixed(2) || 0}</p>
              <p className="text-sm text-gray-500 mt-1">{stats?.month?.count || 0} orders</p>
            </div>
            <div className="text-4xl">📈</div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Sales Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Daily Sales Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={getDailySales()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={2} name="Revenue (₹)" />
              <Line type="monotone" dataKey="count" stroke="#10B981" strokeWidth={2} name="Transactions" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Payment Methods Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={getPaymentMethodStats()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {getPaymentMethodStats().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products */}
      {stats?.top_products && stats.top_products.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Top Selling Products</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.top_products.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={120} fontSize={11} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total_sold" fill="#10B981" name="Units Sold" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Recent Transactions</h2>
          <div className="text-sm text-gray-600">
            Total: {sales.length} sales
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cashier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sales.slice(0, 20).map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {sale.invoice_number}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(sale.sale_datetime).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {sale.customer_name || 'Walk-in'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {sale.user?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {sale.payment_method.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">
                    ₹{parseFloat(sale.total_amount.toString()).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fetchSalesData(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => fetchSalesData(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesReports;
