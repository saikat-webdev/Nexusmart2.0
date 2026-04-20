import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAppConfig, getConfigAsString } from '../contexts/AppConfigContext';
import LoadingSpinner from '../components/LoadingSpinner';

interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  total_spent: number;
  total_purchases: number;
  created_at: string;
}

const Customers: React.FC = () => {
  const { appConfig } = useAppConfig();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [selectedCustomerOrders, setSelectedCustomerOrders] = useState<any[]>([]);
  const [selectedCustomerName, setSelectedCustomerName] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    fetchCustomers(currentPage, searchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCustomers = useCallback(async (page: number = 1, search?: string) => {
    try {
      setLoading(true);
      const params: Record<string, any> = { 
        page, 
        per_page: 25 
      };
      
      const searchValue = search !== undefined ? search : searchTerm;
      if (searchValue && String(searchValue).trim()) {
        params.search = String(searchValue).trim();
      }
      
      const response = await api.get('/customers', { params });
      const customerData = response.data.data || response.data;
      setCustomers(Array.isArray(customerData) ? customerData : []);
      
      if (response.data.meta) {
        setTotalPages(response.data.meta.last_page || 1);
        setCurrentPage(response.data.meta.current_page || 1);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}`, formData);
        toast.success('Customer updated successfully!');
      } else {
        await api.post('/customers', formData);
        toast.success('Customer created successfully!');
      }

      setShowModal(false);
      resetForm();
      fetchCustomers(currentPage, searchTerm);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save customer');
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchCustomers(1, searchTerm);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    
    try {
      await api.delete(`/customers/${id}`);
      toast.success('Customer deleted successfully!');
      fetchCustomers(currentPage, searchTerm);
    } catch (error) {
      toast.error('Failed to delete customer');
    }
  };

  const fetchOrderHistory = async (customerId: number, customerName: string) => {
    try {
      const response = await api.get('/sales');
      // Handle both direct array and paginated responses
      const allSales = response.data.data || response.data;
      const salesArray = Array.isArray(allSales) ? allSales : [];
      const customerSales = salesArray.filter((sale: any) => sale.customer_id === customerId);
      setSelectedCustomerOrders(customerSales);
      setSelectedCustomerName(customerName);
      setShowOrderHistory(true);
    } catch (error) {
      console.error('Failed to fetch order history:', error);
      toast.error('Failed to load order history');
    }
  };

  const printInvoice = (sale: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const storeName = getConfigAsString(appConfig, 'store_name', 'NexusMart');
    const storeTagline = getConfigAsString(appConfig, 'store_tagline', 'Where Excellence Meets Convenience');

    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${storeName} - Invoice #${sale.invoice_number}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
          .company-name { font-size: 24px; font-weight: bold; color: #2563EB; }
          .invoice-details { margin: 20px 0; }
          .invoice-details table { width: 100%; }
          .invoice-details td { padding: 5px; }
          .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .items-table th { background-color: #f3f4f6; padding: 10px; text-align: left; border-bottom: 2px solid #333; }
          .items-table td { padding: 10px; border-bottom: 1px solid #ddd; }
          .totals { margin-top: 20px; text-align: right; }
          .totals table { margin-left: auto; min-width: 300px; }
          .totals td { padding: 5px 10px; }
          .total-row { font-weight: bold; font-size: 18px; border-top: 2px solid #333; }
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">🏪 ${storeName}</div>
          <p>${storeTagline}</p>
        </div>

        <div class="invoice-details">
          <table>
            <tr>
              <td><strong>Invoice Number:</strong></td>
              <td>${sale.invoice_number}</td>
              <td><strong>Date:</strong></td>
              <td>${new Date(sale.sale_datetime).toLocaleString()}</td>
            </tr>
            <tr>
              <td><strong>Customer:</strong></td>
              <td>${sale.customer_name || 'Walk-in Customer'}</td>
              <td><strong>Payment Method:</strong></td>
              <td>${sale.payment_method.toUpperCase()}</td>
            </tr>
            <tr>
              <td><strong>Cashier:</strong></td>
              <td>${sale.user?.name || 'N/A'}</td>
              <td></td>
              <td></td>
            </tr>
          </table>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>SKU</th>
              <th style="text-align: center;">Quantity</th>
              <th style="text-align: right;">Unit Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${sale.sale_items?.map((item: any) => `
              <tr>
                <td>${item.product?.name || 'Unknown Product'}</td>
                <td>${item.product?.sku || 'N/A'}</td>
                <td style="text-align: center;">${item.quantity}</td>
                <td style="text-align: right;">₹${parseFloat(item.unit_price).toFixed(2)}</td>
                <td style="text-align: right;">₹${parseFloat(item.line_item_total).toFixed(2)}</td>
              </tr>
            `).join('') || '<tr><td colspan="5">No items</td></tr>'}
          </tbody>
        </table>

        <div class="totals">
          <table>
            <tr>
              <td>Subtotal:</td>
              <td style="text-align: right;">₹${parseFloat(sale.subtotal).toFixed(2)}</td>
            </tr>
            <tr>
              <td>Tax:</td>
              <td style="text-align: right;">₹${parseFloat(sale.tax_amount).toFixed(2)}</td>
            </tr>
            <tr>
              <td>Discount:</td>
              <td style="text-align: right;">₹${parseFloat(sale.discount_amount).toFixed(2)}</td>
            </tr>
            <tr class="total-row">
              <td>Total Amount:</td>
              <td style="text-align: right;">₹${parseFloat(sale.total_amount).toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <div class="footer">
          <p>Thank you for your business!</p>
          <p style="font-size: 12px;">This is a computer-generated invoice.</p>
        </div>

        <div class="no-print" style="text-align: center; margin-top: 20px;">
          <button onclick="window.print()" style="padding: 10px 20px; background-color: #2563EB; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
            🖨️ Print Invoice
          </button>
          <button onclick="window.close()" style="padding: 10px 20px; background-color: #6B7280; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; margin-left: 10px;">
            Close
          </button>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
  };

  const resetForm = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
    });
  };

  // Calculate stats
  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((sum, c) => sum + c.total_spent, 0);
  const totalOrders = customers.reduce((sum, c) => sum + c.total_purchases, 0);
  const avgSpentPerCustomer = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

  if (loading) return <LoadingSpinner message="Loading customers..." />;

  return (
    <div className="space-y-6">
       {/* Header */}
       <div className="flex items-center justify-between">
         <div>
           <h1 className="text-3xl font-bold text-gray-800">Customer Management</h1>
           <p className="text-gray-600 mt-1">Manage your customer database</p>
         </div>
         <div className="flex gap-3">
           <button
             onClick={() => {
               window.open('/api/customers/export', '_blank');
             }}
             className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
           >
             📥 Export CSV
           </button>
           <button
             onClick={() => { resetForm(); setShowModal(true); }}
             className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
           >
             + Add Customer
           </button>
         </div>
       </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Customers</p>
              <p className="text-3xl font-bold mt-2">{totalCustomers}</p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Revenue</p>
              <p className="text-3xl font-bold mt-2">₹{totalRevenue.toFixed(2)}</p>
            </div>
            <div className="text-4xl">💰</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Orders</p>
              <p className="text-3xl font-bold mt-2">{totalOrders}</p>
            </div>
            <div className="text-4xl">🛒</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Avg Spent/Customer</p>
              <p className="text-3xl font-bold mt-2">₹{avgSpentPerCustomer.toFixed(2)}</p>
            </div>
            <div className="text-4xl">📊</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Search Customers</label>
        <input
          type="text"
          placeholder="Search by name, email or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={handleSearch}
          className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Search
        </button>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Spent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchases</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
               {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                      {customer.address && (
                        <div className="text-sm text-gray-500">{customer.address}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{customer.email || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{customer.phone || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">
                    ₹{(customer.total_spent as number).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {customer.total_purchases} orders
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(customer.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium space-x-2">
                    <button
                      onClick={() => fetchOrderHistory(customer.id, customer.name)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      📋 Orders
                    </button>
                    <button
                      onClick={() => handleEdit(customer)}
                      className="text-green-600 hover:text-green-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(customer.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {customers.length === 0 && (
          <div className="text-center py-12 text-gray-500">No customers found</div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
                <button
                  onClick={() => fetchCustomers(currentPage - 1, searchTerm)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => fetchCustomers(currentPage + 1, searchTerm)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
            </div>
          </div>
        )}
      </div>

      {/* Order History Modal */}
      {showOrderHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Order History - {selectedCustomerName}</h2>
                <button
                  onClick={() => setShowOrderHistory(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              {selectedCustomerOrders.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">📦</div>
                  <p className="text-lg">No orders found for this customer</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedCustomerOrders.map((sale) => (
                    <div key={sale.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition">
                      {/* Order Header */}
                      <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                        <div>
                          <h3 className="text-lg font-bold text-blue-600">
                            Invoice: {sale.invoice_number}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Date: {new Date(sale.sale_datetime).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">
                            ₹{parseFloat(sale.total_amount).toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {sale.payment_method.replace('_', ' ').toUpperCase()}
                          </p>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="mb-3">
                        <h4 className="font-semibold mb-2 text-gray-700">Items:</h4>
                        <div className="bg-gray-50 rounded p-3">
                          {sale.sale_items && sale.sale_items.length > 0 ? (
                            <div className="space-y-2">
                              {sale.sale_items.map((item: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between text-sm">
                                  <div className="flex-1">
                                    <span className="font-medium">{item.product?.name || 'Unknown Product'}</span>
                                    <span className="text-gray-500 ml-2">({item.product?.sku || 'N/A'})</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-gray-600">Qty: {item.quantity}</span>
                                    <span className="ml-4 font-semibold">
                                      ₹{parseFloat(item.line_item_total).toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm">No items available</p>
                          )}
                        </div>
                      </div>

                      {/* Order Summary */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div className="bg-blue-50 p-2 rounded">
                          <p className="text-xs text-gray-600">Subtotal</p>
                          <p className="font-semibold">₹{parseFloat(sale.subtotal).toFixed(2)}</p>
                        </div>
                        <div className="bg-green-50 p-2 rounded">
                          <p className="text-xs text-gray-600">Tax</p>
                          <p className="font-semibold">₹{parseFloat(sale.tax_amount).toFixed(2)}</p>
                        </div>
                        <div className="bg-yellow-50 p-2 rounded">
                          <p className="text-xs text-gray-600">Discount</p>
                          <p className="font-semibold">₹{parseFloat(sale.discount_amount).toFixed(2)}</p>
                        </div>
                        <div className="bg-purple-50 p-2 rounded">
                          <p className="text-xs text-gray-600">Cashier</p>
                          <p className="font-semibold text-sm">{sale.user?.name || 'N/A'}</p>
                        </div>
                      </div>

                      {/* Print Button */}
                      <button
                        onClick={() => printInvoice(sale)}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
                      >
                        🖨️ Print Invoice
                      </button>
                    </div>
                  ))}

                  {/* Summary */}
                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Orders</p>
                        <p className="text-2xl font-bold text-blue-600">{selectedCustomerOrders.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Spent</p>
                        <p className="text-2xl font-bold text-green-600">
                          ₹{selectedCustomerOrders.reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowOrderHistory(false)}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6">
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+91 XXXXXXXXXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                  >
                    {editingCustomer ? 'Update Customer' : 'Create Customer'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); resetForm(); }}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
