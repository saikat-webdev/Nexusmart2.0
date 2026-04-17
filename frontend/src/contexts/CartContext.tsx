import React, { createContext, useState, useContext, ReactNode, useMemo, useCallback } from 'react';

// Define the structure of an item in the cart
interface CartItem {
  product_id: number;
  name: string;
  sku: string;
  unit_price: number; // Price per unit at the time of adding to cart
  quantity: number;
}

// Define the structure of a coupon
interface AppliedCoupon {
  id: number;
  code: string;
  description?: string;
  discount_type: 'fixed' | 'percentage';
  discount_value: number;
}

// Define the shape of our context
interface CartContextType {
  cartItems: CartItem[];
  addItemToCart: (item: CartItem) => void;
  removeItemFromCart: (productId: number) => void;
  updateItemQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  cartSubtotal: number; // Calculated value
  itemCount: number;    // Calculated value
  appliedCoupon: AppliedCoupon | null;
  discountAmount: number;
  applyCoupon: (coupon: AppliedCoupon, discountAmount: number) => void;
  removeCoupon: () => void;
  // We can also add a tax_rate here if it's constant, or pass it dynamically
}

// Create the context with a default value (or undefined)
const CartContext = createContext<CartContextType | undefined>(undefined);

// Provider component that wraps your application or a part of it
interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  // Add an item to the cart, or increment quantity if it already exists
  const addItemToCart = useCallback((newItem: CartItem) => {
    setCartItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex(
        (item) => item.product_id === newItem.product_id
      );

      if (existingItemIndex > -1) {
        // Item already exists, update its quantity
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + newItem.quantity,
        };
        return updatedItems;
      } else {
        // Add new item to the cart
        return [...prevItems, newItem];
      }
    });
  }, []);

  // Remove an item completely from the cart
  const removeItemFromCart = useCallback((productId: number) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.product_id !== productId)
    );
  }, []);

  // Update the quantity of an existing item
  const updateItemQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity <= 0) {
      // If quantity is 0 or less, remove the item
      removeItemFromCart(productId);
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.product_id === productId ? { ...item, quantity: quantity } : item
      )
    );
  }, [removeItemFromCart]);

  // Clear all items from the cart
  const clearCart = useCallback(() => {
    setCartItems([]);
    setAppliedCoupon(null);
    setDiscountAmount(0);
  }, []);

  // Apply a coupon to the cart
  const applyCoupon = useCallback((coupon: AppliedCoupon, discount: number) => {
    setAppliedCoupon(coupon);
    setDiscountAmount(discount);
  }, []);

  // Remove the applied coupon
  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
  }, []);

  // Calculate derived state: subtotal
  const cartSubtotal = useMemo(() => {
    return cartItems.reduce(
      (total, item) => total + item.unit_price * item.quantity,
      0
    );
  }, [cartItems]);

  // Calculate derived state: total number of individual items
  const itemCount = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    cartItems,
    addItemToCart,
    removeItemFromCart,
    updateItemQuantity,
    clearCart,
    cartSubtotal,
    itemCount,
    appliedCoupon,
    discountAmount,
    applyCoupon,
    removeCoupon,
  }), [cartItems, addItemToCart, removeItemFromCart, updateItemQuantity, clearCart, cartSubtotal, itemCount, appliedCoupon, discountAmount, applyCoupon, removeCoupon]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to easily access the CartContext
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
