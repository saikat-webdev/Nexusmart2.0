import React, { useEffect, useState } from 'react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Logo from '../components/Logo';
import { useAuth } from '../contexts/AuthContext';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardStats {
  today: { sales: number; count: number };
  month: { sales: number; count: number };
  totals: { products: number; customers: number; low_stock_products: number };
  sales_trend: Array<{ date: string; total: number }>;
  top_products: Array<{ id: number; name: string; total_sold: number }>;
  recent_sales?: Array<any>;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/dashboard/stats');
      console.log('Dashboard stats response:', response.data);
      setStats(response.data);
    } catch (err: any) {
      console.error('Failed to fetch stats:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to load dashboard data';
      setError(errorMsg);
      
      // Set default data so page doesn't completely break
      setStats({
        today: { sales: 0, count: 0 },
        month: { sales: 0, count: 0 },
        totals: { products: 0, customers: 0, low_stock_products: 0 },
        sales_trend: [],
        top_products: [],
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <LoadingSpinner message="Loading dashboard..." />
      </div>
    );
  }

  const StatCard = ({ title, value, subtitle, icon, color }: any) => (
    <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Logo size="sm" className="text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-gray-600 mt-1">Overview of your NexusMart performance</p>
          </div>
        </div>
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="font-semibold text-red-800">⚠️ Error</p>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Today's Sales"
              value={`₹${(stats.today?.sales || 0).toFixed(2)}`}
              subtitle={`${stats.today?.count || 0} transactions`}
              icon="💰"
              color="border-green-500"
            />
            <StatCard
              title="Monthly Sales"
              value={`₹${(stats.month?.sales || 0).toFixed(2)}`}
              subtitle={`${stats.month?.count || 0} transactions`}
              icon="📈"
              color="border-blue-500"
            />
            <StatCard
              title="Total Products"
              value={stats.totals?.products || 0}
              subtitle={`${stats.totals?.low_stock_products || 0} low stock`}
              icon="📦"
              color="border-purple-500"
            />
            <StatCard
              title="Customers"
              value={stats.totals?.customers || 0}
              subtitle="Total registered"
              icon="👥"
              color="border-orange-500"
            />
          </div>

          {/* Low Stock Alert */}
          {stats.totals && stats.totals.low_stock_products > 0 && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex items-center">
                <span className="text-2xl mr-3">⚠️</span>
                <div>
                  <p className="font-semibold text-red-800">Low Stock Alert</p>
                  <p className="text-red-700 text-sm">
                    {stats.totals.low_stock_products} product(s) are running low. Check inventory page.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Trend */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Sales Trend (Last 7 Days)</h2>
              {stats.sales_trend && stats.sales_trend.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.sales_trend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={2} name="Sales (₹)" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-300 text-gray-400">
                  <p>No sales data available</p>
                </div>
              )}
            </div>

            {/* Top Products */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Top 10 Selling Products</h2>
              {stats.top_products && stats.top_products.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.top_products.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} interval={0} fontSize={10} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="total_sold" fill="#3B82F6" name="Units Sold" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-300 text-gray-400">
                  <p>No product sales data available</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
