import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

interface Product {
  id: number;
  name: string;
  sku: string;
  stock_quantity: number;
  reorder_level: number;
  price?: number;
  category?: { name: string };
}

const Inventory: React.FC = () => {
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove'>('add');
  const [adjustmentQty, setAdjustmentQty] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchInventoryData();
    }
  }, [user]);

  const fetchInventoryData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [lowStockRes, productsRes] = await Promise.all([
        api.get('/dashboard/low-stock').catch(() => ({ data: [] })),
        api.get('/products').catch(() => ({ data: [] }))
      ]);
      
      // Handle both direct array and paginated responses
      const lowStockData = lowStockRes.data?.data || lowStockRes.data;
      const productsData = productsRes.data?.data || productsRes.data;
      
      setLowStockProducts(Array.isArray(lowStockData) ? lowStockData : []);
      setAllProducts(Array.isArray(productsData) ? productsData : []);
      
      console.log('Low stock products:', lowStockData);
      console.log('All products:', productsData);
    } catch (err: any) {
      console.error('Failed to fetch inventory:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to load inventory';
      setError(errorMsg);
      setLowStockProducts([]);
      setAllProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustStock = async () => {
    if (!selectedProduct || !adjustmentQty) {
      toast.error('Please select a product and quantity');
      return;
    }

    setSubmitting(true);
    try {
      const qty = parseInt(adjustmentQty);
      if (isNaN(qty) || qty <= 0) {
        toast.error('Please enter a valid quantity');
        return;
      }

      const newStock = adjustmentType === 'add' 
        ? selectedProduct.stock_quantity + qty
        : selectedProduct.stock_quantity - qty;

      if (newStock < 0) {
        toast.error('Stock cannot be negative!');
        return;
      }

      await api.put(`/products/${selectedProduct.id}`, {
        stock_quantity: newStock,
      });

      toast.success(`Stock ${adjustmentType === 'add' ? 'added' : 'removed'} successfully!`);
      setShowAdjustModal(false);
      resetAdjustmentForm();
      fetchInventoryData();
    } catch (err: any) {
      console.error('Error adjusting stock:', err);
      toast.error(err.response?.data?.message || 'Failed to adjust stock');
    } finally {
      setSubmitting(false);
    }
  };

  const resetAdjustmentForm = () => {
    setSelectedProduct(null);
    setAdjustmentQty('');
    setAdjustmentReason('');
    setAdjustmentType('add');
  };

  const openAdjustModal = (product: Product) => {
    setSelectedProduct(product);
    setShowAdjustModal(true);
  };

  if (loading) return <LoadingSpinner message="Loading inventory..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Inventory Management</h1>
          <p className="text-gray-600 mt-1">Monitor and manage stock levels</p>
        </div>
        <button
          onClick={fetchInventoryData}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Products</p>
              <p className="text-3xl font-bold mt-2">{allProducts.length}</p>
            </div>
            <div className="text-4xl">📦</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Low Stock Items</p>
              <p className="text-3xl font-bold mt-2">{lowStockProducts.length}</p>
            </div>
            <div className="text-4xl">⚠️</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Stock Value</p>
              <p className="text-3xl font-bold mt-2">
                ₹{allProducts.reduce((sum, p: any) => sum + (parseFloat(p.price) * parseInt(p.stock_quantity)), 0).toFixed(2)}
              </p>
            </div>
            <div className="text-4xl">💰</div>
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
          <div className="flex items-start">
            <div className="text-3xl mr-4">🚨</div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-800 mb-2">Low Stock Alert</h3>
              <p className="text-red-700 mb-4">
                {lowStockProducts.length} product(s) are at or below their reorder level. Consider restocking soon.
              </p>
              <div className="bg-white rounded-lg overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-red-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-red-800">Product</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-red-800">SKU</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-red-800">Current Stock</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-red-800">Reorder Level</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-red-800">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-100">
                    {lowStockProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-red-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{product.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{product.sku}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className="font-bold text-red-600">{product.stock_quantity}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{product.reorder_level}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => openAdjustModal(product)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                          >
                            Adjust Stock
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Products Inventory */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">All Products Inventory</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reorder Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allProducts.map((product) => {
                const isLowStock = product.stock_quantity <= product.reorder_level;
                return (
                  <tr key={product.id} className={isLowStock ? 'bg-red-50' : 'hover:bg-gray-50'}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.sku}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {product.category?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-bold ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                        {product.stock_quantity} units
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{product.reorder_level}</td>
                    <td className="px-6 py-4">
                      {isLowStock ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Low Stock
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => openAdjustModal(product)}
                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                      >
                        Adjust
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {showAdjustModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Adjust Stock - {selectedProduct.name}</h2>
              <div className="mb-4 p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">Current Stock:</p>
                <p className="text-2xl font-bold">{selectedProduct.stock_quantity} units</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Adjustment Type</label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="add"
                        checked={adjustmentType === 'add'}
                        onChange={(e) => setAdjustmentType(e.target.value as 'add')}
                        className="mr-2"
                      />
                      <span className="text-sm">Add Stock</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="remove"
                        checked={adjustmentType === 'remove'}
                        onChange={(e) => setAdjustmentType(e.target.value as 'remove')}
                        className="mr-2"
                      />
                      <span className="text-sm">Remove Stock</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={adjustmentQty}
                    onChange={(e) => setAdjustmentQty(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter quantity"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason (Optional)</label>
                  <textarea
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="E.g., Restocking, Damaged goods, etc."
                  />
                </div>

                {adjustmentQty && (
                  <div className="p-3 bg-blue-50 rounded">
                    <p className="text-sm text-gray-700">New Stock will be:</p>
                    <p className="text-xl font-bold text-blue-600">
                      {adjustmentType === 'add'
                        ? selectedProduct.stock_quantity + parseInt(adjustmentQty)
                        : selectedProduct.stock_quantity - parseInt(adjustmentQty)} units
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleAdjustStock}
                    disabled={!adjustmentQty}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:bg-gray-300"
                  >
                    Confirm Adjustment
                  </button>
                  <button
                    onClick={() => { setShowAdjustModal(false); resetAdjustmentForm(); }}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
