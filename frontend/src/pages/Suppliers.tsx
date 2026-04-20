import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

interface Supplier {
  id: number;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  tax_id: string | null;
  notes: string | null;
  is_active: boolean;
  product_count: number;
  created_at: string;
  updated_at: string;
}

interface FormData {
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  tax_id: string;
  notes: string;
  is_active: boolean;
}

const Suppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    tax_id: '',
    notes: '',
    is_active: true,
  });

  useEffect(() => {
    fetchSuppliers(currentPage);
  }, []);

  const fetchSuppliers = async (page: number = 1) => {
    try {
      const params: any = { page, per_page: 25 };
      if (searchTerm) params.search = searchTerm;
      
      const response = await api.get('/suppliers', { params });
      const supplierData = response.data.data || response.data;
      setSuppliers(Array.isArray(supplierData) ? supplierData : []);
      
      if (response.data.meta) {
        setTotalPages(response.data.meta.last_page || 1);
        setCurrentPage(response.data.meta.current_page || 1);
      }
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await api.put(`/suppliers/${editingSupplier.id}`, formData);
        toast.success('Supplier updated successfully!');
      } else {
        await api.post('/suppliers', formData);
        toast.success('Supplier created successfully!');
      }

      setShowModal(false);
      resetForm();
      fetchSuppliers(currentPage);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save supplier');
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contact_person: supplier.contact_person || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      tax_id: supplier.tax_id || '',
      notes: supplier.notes || '',
      is_active: supplier.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;
    
    try {
      await api.delete(`/suppliers/${id}`);
      toast.success('Supplier deleted successfully!');
      fetchSuppliers(currentPage);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to delete supplier';
      toast.error(errorMsg);
    }
  };

  const handleToggleActive = async (supplier: Supplier) => {
    try {
      await api.patch(`/suppliers/${supplier.id}`, { is_active: !supplier.is_active });
      toast.success(`Supplier ${supplier.is_active ? 'deactivated' : 'activated'}!`);
      fetchSuppliers(currentPage);
    } catch (error) {
      toast.error('Failed to update supplier status');
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchSuppliers(1);
  };

  const resetForm = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      tax_id: '',
      notes: '',
      is_active: true,
    });
  };

  if (loading) return <LoadingSpinner message="Loading suppliers..." />;

  return (
    <div className="space-y-6">
       {/* Header */}
       <div className="flex items-center justify-between">
         <div>
           <h1 className="text-3xl font-bold text-gray-800">Supplier Management</h1>
           <p className="text-gray-600 mt-1">Manage your product suppliers</p>
         </div>
         <div className="flex gap-3">
           <button
             onClick={() => {
               const params = new URLSearchParams();
               if (searchTerm) params.append('search', searchTerm);
               window.open(`/api/suppliers/export?${params.toString()}`, '_blank');
             }}
             className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
           >
             📥 Export CSV
           </button>
           <button
             onClick={() => { resetForm(); setShowModal(true); }}
             className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
           >
             + Add Supplier
           </button>
         </div>
       </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Suppliers</label>
            <input
              type="text"
              placeholder="Search by name, contact, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="md:col-span-2 flex items-end">
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Search
            </button>
            <button
              onClick={() => { setSearchTerm(''); fetchSuppliers(1); }}
              className="ml-2 px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Products</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {suppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                      {supplier.tax_id && (
                        <div className="text-xs text-gray-500">Tax ID: {supplier.tax_id}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{supplier.contact_person || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{supplier.email || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {supplier.phone || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="font-semibold">{supplier.product_count}</span> products
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleActive(supplier)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        supplier.is_active
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {supplier.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(supplier)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(supplier.id)}
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
        {suppliers.length === 0 && (
          <div className="text-center py-12 text-gray-500">No suppliers found</div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fetchSuppliers(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => fetchSuppliers(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6">
                {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                    <input
                      type="text"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID</label>
                    <input
                      type="text"
                      value={formData.tax_id}
                      onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700">
                      Active Supplier
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                  >
                    {editingSupplier ? 'Update Supplier' : 'Create Supplier'}
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

export default Suppliers;
