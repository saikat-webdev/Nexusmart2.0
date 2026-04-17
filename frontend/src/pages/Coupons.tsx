import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

interface Coupon {
  id: number;
  code: string;
  description?: string;
  discount_type: 'fixed' | 'percentage';
  discount_value: number;
  usage_limit?: number;
  usage_count: number;
  valid_from?: string;
  valid_until?: string;
  min_order_amount: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface FormData {
  code: string;
  description: string;
  discount_type: 'fixed' | 'percentage';
  discount_value: string;
  usage_limit: string;
  valid_from: string;
  valid_until: string;
  min_order_amount: string;
  is_active: boolean;
}

const Coupons: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    code: '',
    description: '',
    discount_type: 'fixed',
    discount_value: '',
    usage_limit: '',
    valid_from: '',
    valid_until: '',
    min_order_amount: '0',
    is_active: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchCoupons = useCallback(async (page: number = 1) => {
    setLoading(true);
    try {
      const response = await api.get('/coupons', { params: { page, per_page: 25 } });
      const couponData = response.data.data || response.data;
      setCoupons(Array.isArray(couponData) ? couponData : []);
      
      if (response.data.meta) {
        setTotalPages(response.data.meta.last_page || 1);
        setCurrentPage(response.data.meta.current_page || 1);
      }
    } catch (error) {
      toast.error('Failed to load coupons');
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons(1);
  }, [fetchCoupons]);

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discount_type: 'fixed',
      discount_value: '',
      usage_limit: '',
      valid_from: '',
      valid_until: '',
      min_order_amount: '0',
      is_active: true,
    });
    setEditingCoupon(null);
  };

  const handleOpenModal = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        description: coupon.description || '',
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value.toString(),
        usage_limit: coupon.usage_limit?.toString() || '',
        valid_from: coupon.valid_from || '',
        valid_until: coupon.valid_until || '',
        min_order_amount: coupon.min_order_amount.toString(),
        is_active: coupon.is_active,
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.code.trim()) {
      toast.error('Coupon code is required');
      return false;
    }
    if (!formData.discount_value || isNaN(parseFloat(formData.discount_value))) {
      toast.error('Valid discount value is required');
      return false;
    }
    if (formData.discount_type === 'percentage' && parseFloat(formData.discount_value) > 100) {
      toast.error('Percentage discount cannot exceed 100%');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        code: formData.code.toUpperCase(),
        description: formData.description || null,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        valid_from: formData.valid_from || null,
        valid_until: formData.valid_until || null,
        min_order_amount: parseFloat(formData.min_order_amount) || 0,
        is_active: formData.is_active,
      };

      if (editingCoupon) {
        await api.put(`/coupons/${editingCoupon.id}`, payload);
        toast.success('Coupon updated successfully!');
      } else {
        await api.post('/coupons', payload);
        toast.success('Coupon created successfully!');
      }

      handleCloseModal();
      fetchCoupons(currentPage);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to save coupon';
      toast.error(errorMessage);
      console.error('Error saving coupon:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (coupon: Coupon) => {
    if (!window.confirm(`Are you sure you want to delete coupon ${coupon.code}?`)) {
      return;
    }

    try {
      await api.delete(`/coupons/${coupon.id}`);
      toast.success('Coupon deleted successfully!');
      fetchCoupons(currentPage);
    } catch (error) {
      toast.error('Failed to delete coupon');
      console.error('Error deleting coupon:', error);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <LoadingSpinner message="Loading coupons..." />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Coupon Management</h1>
          <button
            onClick={() => handleOpenModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            ➕ Create Coupon
          </button>
        </div>

        {/* Coupons Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {coupons.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">No coupons found. Create your first coupon!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Code</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Description</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Discount</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Usage</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Valid Period</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon) => (
                    <tr key={coupon.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="font-bold text-blue-600">{coupon.code}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {coupon.description || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold">
                        {coupon.discount_type === 'percentage' 
                          ? `${coupon.discount_value}%` 
                          : `₦${coupon.discount_value.toFixed(2)}`}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {coupon.usage_limit ? (
                          <span className={coupon.usage_count >= coupon.usage_limit ? 'text-red-600 font-semibold' : ''}>
                            {coupon.usage_count}/{coupon.usage_limit}
                          </span>
                        ) : (
                          <span className="text-gray-600">{coupon.usage_count}/∞</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {coupon.valid_from && coupon.valid_until ? (
                          <>
                            <div>{new Date(coupon.valid_from).toLocaleDateString()}</div>
                            <div className="text-xs text-gray-500">to {new Date(coupon.valid_until).toLocaleDateString()}</div>
                          </>
                        ) : (
                          'Always'
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          coupon.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {coupon.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        <button
                          onClick={() => handleOpenModal(coupon)}
                          className="text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(coupon)}
                          className="text-red-600 hover:text-red-800 font-semibold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fetchCoupons(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => fetchCoupons(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full">
            <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Code */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    disabled={editingCoupon !== null}
                    placeholder="e.g., SAVE10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Discount Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Discount Type *
                  </label>
                  <select
                    name="discount_type"
                    value={formData.discount_type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="fixed">Fixed Amount (₦)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Discount Value */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    name="discount_value"
                    value={formData.discount_value}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Min Order Amount */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Minimum Order Amount (₦)
                  </label>
                  <input
                    type="number"
                    name="min_order_amount"
                    value={formData.min_order_amount}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="What is this coupon for?"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Valid From */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Valid From
                  </label>
                  <input
                    type="datetime-local"
                    name="valid_from"
                    value={formData.valid_from}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Valid Until */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Valid Until
                  </label>
                  <input
                    type="datetime-local"
                    name="valid_until"
                    value={formData.valid_until}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Usage Limit */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Usage Limit (leave empty for unlimited)
                </label>
                <input
                  type="number"
                  name="usage_limit"
                  value={formData.usage_limit}
                  onChange={handleInputChange}
                  placeholder="e.g., 100"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Active Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label className="ml-2 text-sm font-semibold text-gray-700">
                  Active
                </label>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold transition"
                >
                  {submitting ? 'Saving...' : (editingCoupon ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Coupons;
