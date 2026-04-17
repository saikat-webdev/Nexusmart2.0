import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const AdminLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 ml-0 lg:ml-64 transition-all duration-300">
        <main className="p-4 lg:p-8 pt-16 lg:pt-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
