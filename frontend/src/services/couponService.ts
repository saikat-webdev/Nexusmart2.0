import api from './api';

export interface Coupon {
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

export interface CouponValidationResponse {
  valid: boolean;
  coupon?: Coupon;
  discount?: number;
  message: string;
}

/**
 * Get all coupons
 */
export const getAllCoupons = async (): Promise<Coupon[]> => {
  const response = await api.get('/coupons');
  return response.data;
};

/**
 * Get a specific coupon
 */
export const getCoupon = async (id: number): Promise<Coupon> => {
  const response = await api.get(`/coupons/${id}`);
  return response.data;
};

/**
 * Validate a coupon code for a given order amount
 */
export const validateCoupon = async (
  code: string,
  orderAmount: number
): Promise<CouponValidationResponse> => {
  const response = await api.post('/coupons/validate', {
    code: code.toUpperCase(),
    order_amount: orderAmount,
  });
  return response.data;
};

/**
 * Create a new coupon (admin only)
 */
export const createCoupon = async (data: Partial<Coupon>): Promise<Coupon> => {
  const response = await api.post('/coupons', data);
  return response.data.coupon;
};

/**
 * Update a coupon (admin only)
 */
export const updateCoupon = async (
  id: number,
  data: Partial<Coupon>
): Promise<Coupon> => {
  const response = await api.put(`/coupons/${id}`, data);
  return response.data.coupon;
};

/**
 * Delete a coupon (admin only)
 */
export const deleteCoupon = async (id: number): Promise<void> => {
  await api.delete(`/coupons/${id}`);
};
