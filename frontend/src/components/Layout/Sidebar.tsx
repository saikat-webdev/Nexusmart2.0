import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../Logo';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

   const navItems = [
     { path: '/dashboard', icon: '📊', label: 'Dashboard' },
     { path: '/pos', icon: '🛒', label: 'POS / Checkout' },
     { path: '/products', icon: '📦', label: 'Products' },
     { path: '/inventory', icon: '📋', label: 'Inventory' },
     { path: '/sales', icon: '💰', label: 'Sales Reports' },
     { path: '/returns', icon: '↩️', label: 'Sales Returns' },
     { path: '/customers', icon: '👥', label: 'Customers' },
     { path: '/suppliers', icon: '🏭', label: 'Suppliers' },
     { path: '/coupons', icon: '🎫', label: 'Coupons' },
     { path: '/settings', icon: '⚙️', label: 'Settings' },
   ];

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-gray-900 text-white p-2 rounded-md shadow-lg touch-target"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`h-screen w-64 bg-gray-900 text-white flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <Logo size="md" className="text-white" />
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              NexusMart
            </h1>
            <p className="text-sm text-gray-400">Point of Sale System</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 bg-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setIsOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-3 transition ${
                isActive
                  ? 'bg-blue-600 text-white border-l-4 border-blue-400'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={() => {
            setIsOpen(false);
            logout();
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition font-medium"
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </div>
    </>
  );
};

export default Sidebar;
