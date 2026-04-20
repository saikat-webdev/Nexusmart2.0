import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { AppConfigProvider } from './contexts/AppConfigContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/Layout/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POSPage from './pages/POSPage';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import SalesReports from './pages/SalesReports';
 import Customers from './pages/Customers';
 import Suppliers from './pages/Suppliers';
 import Returns from './pages/Returns';
 import Coupons from './pages/Coupons';
 import Settings from './pages/Settings';
import './App.css';

function App() {
  return (
    <AppConfigProvider>
      <AuthProvider>
        <CartProvider>
          <Router>
          <Toaster
            position="top-right"
            reverseOrder={false}
            toastOptions={{
              duration: 3000,
              style: {
                background: '#363636',
                color: '#fff',
                padding: '16px',
                borderRadius: '8px',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />

            {/* Protected Admin Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="pos" element={<POSPage />} />
              <Route path="products" element={<Products />} />
              <Route path="inventory" element={<Inventory />} />
               <Route path="sales" element={<SalesReports />} />
               <Route path="returns" element={<Returns />} />
               <Route path="customers" element={<Customers />} />
              <Route path="suppliers" element={<Suppliers />} />
              <Route path="coupons" element={<Coupons />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Catch all - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </CartProvider>
      </AuthProvider>
    </AppConfigProvider>
  );
}

export default App;
