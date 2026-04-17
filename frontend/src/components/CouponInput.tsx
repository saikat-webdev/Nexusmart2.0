import React, { useState } from 'react';
import { validateCoupon } from '../services/couponService';
import { useCart } from '../contexts/CartContext';

interface CouponInputProps {
  orderAmount: number;
}

export const CouponInput: React.FC<CouponInputProps> = ({ orderAmount }) => {
  const { appliedCoupon, discountAmount, applyCoupon, removeCoupon } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setError('Please enter a coupon code');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await validateCoupon(couponCode, orderAmount);
      
      if (response.valid && response.coupon && response.discount !== undefined) {
        applyCoupon(
          {
            id: response.coupon.id,
            code: response.coupon.code,
            description: response.coupon.description,
            discount_type: response.coupon.discount_type,
            discount_value: response.coupon.discount_value,
          },
          response.discount
        );
        setSuccess(true);
        setCouponCode('');
        setError(null);
      } else {
        setError(response.message || 'Invalid coupon');
        setSuccess(false);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to validate coupon';
      setError(errorMessage);
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponCode('');
    setError(null);
    setSuccess(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApplyCoupon();
    }
  };

  if (appliedCoupon) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-green-900">Coupon Applied</h3>
            <p className="text-sm text-green-700 mt-1">
              <strong>{appliedCoupon.code}</strong>
              {appliedCoupon.description && ` - ${appliedCoupon.description}`}
            </p>
            <p className="text-lg font-bold text-green-900 mt-2">
              Discount: ₦{discountAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <button
            onClick={handleRemoveCoupon}
            className="text-green-600 hover:text-green-800 font-semibold"
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Coupon Code
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={couponCode}
          onChange={(e) => {
            setCouponCode(e.target.value.toUpperCase());
            setError(null);
          }}
          onKeyPress={handleKeyPress}
          placeholder="Enter coupon code"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          disabled={loading}
        />
        <button
          onClick={handleApplyCoupon}
          disabled={loading || !couponCode.trim() || orderAmount <= 0}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            loading || !couponCode.trim() || orderAmount <= 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {loading ? 'Applying...' : 'Apply'}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
      {success && (
        <p className="mt-2 text-sm text-green-600">Coupon applied successfully!</p>
      )}
    </div>
  );
};
