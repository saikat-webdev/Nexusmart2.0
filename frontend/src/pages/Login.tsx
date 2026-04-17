import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (userEmail: string) => {
    setEmail(userEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Logo size="lg" className="mx-auto mb-4 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">NexusMart</h1>
          <p className="text-gray-600">Point of Sale System</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin@nexusmart.com"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-3">Quick Login (Demo):</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => quickLogin('admin@nexusmart.com')}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-700 transition"
            >
              👤 Admin Account
            </button>
            <button
              onClick={() => quickLogin('cashier@nexusmart.com')}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-700 transition"
            >
              💰 Cashier Account
            </button>
            <button
              onClick={() => quickLogin('manager@supermarket.com')}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-700 transition"
            >
              📊 Manager Account
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-3 text-center">
            All accounts use password: <code className="bg-gray-100 px-2 py-1 rounded">password123</code>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
