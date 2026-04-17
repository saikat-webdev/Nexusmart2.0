import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api'; // Our configured axios instance
import { useCart } from '../contexts/CartContext'; // Our custom cart hook
import { useAuth } from '../contexts/AuthContext'; // Import auth context
import { useAppConfig, getConfigAsNumber, getConfigAsString } from '../contexts/AppConfigContext'; // Import app config
import { CouponInput } from '../components/CouponInput'; // Import coupon component
import LoadingSpinner from '../components/LoadingSpinner';

// Define the structure of a Product as received from the API
interface Product {
  id: number;
  name: string;
  sku: string;
  barcode: string | null;
  price: number; // Assumed to be number after Laravel's decimal casting
  stock_quantity: number;
  is_active: boolean;
}

// --- Reusable Components ---

// Component to display a single product in the product list
const ProductListItem: React.FC<{ product: Product; onAddToCart: (product: Product) => void }> = ({ product, onAddToCart }) => {
  const priceAsNumber = parseFloat(product.price.toString()); 
  const formattedPrice = isNaN(priceAsNumber) ? 'N/A' : priceAsNumber.toFixed(2); 
  const isOutOfStock = !product.is_active || product.stock_quantity <= 0;

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition p-4 border border-gray-200">
      <h3 className="font-bold text-gray-900 text-base mb-1 truncate">{product.name}</h3>
      <p className="text-xs text-gray-500 mb-2">SKU: {product.sku}</p>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-lg font-bold text-blue-600">₹{formattedPrice}</p>
          <p className="text-xs text-gray-600">
            Stock: <span className={product.stock_quantity < 10 ? 'text-red-600 font-semibold' : 'text-green-600'}>{product.stock_quantity}</span>
          </p>
        </div>
        {isOutOfStock && (
          <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded font-semibold">Out of Stock</span>
        )}
      </div>
      <button
        onClick={() => onAddToCart(product)}
        disabled={isOutOfStock}
        className={`w-full py-2 px-4 rounded-lg font-semibold transition ${
          isOutOfStock 
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
            : 'bg-green-500 hover:bg-green-600 text-white shadow'
        }`}
      >
        {isOutOfStock ? '❌ Out of Stock' : '➕ Add to Cart'}
      </button>
    </div>
  );
};

// Component to display and manage the shopping cart
const CartDisplay: React.FC<{ onCheckout: () => void; vatRate: number }> = ({ onCheckout, vatRate }) => {
  const { cartItems, cartSubtotal, itemCount, updateItemQuantity, removeItemFromCart, clearCart, appliedCoupon, discountAmount, removeCoupon } = useCart();

  const taxableSubtotal = Math.max(cartSubtotal - discountAmount, 0);
  const taxAmount = taxableSubtotal * vatRate;
  const totalAmount = taxableSubtotal + taxAmount;

  const formattedSubtotal = cartSubtotal.toFixed(2);
  const formattedDiscount = discountAmount.toFixed(2);
  const formattedTaxAmount = taxAmount.toFixed(2);
  const formattedTotalAmount = totalAmount.toFixed(2);

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-lg">
      {/* Cart Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-t-lg">
        <h2 className="text-lg font-bold">🛒 Your Cart ({itemCount} items)</h2>
      </div>

      {/* Cart Items - Scrollable */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ maxHeight: 'calc(100vh - 420px)' }}>
        {cartItems.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-2">🛒</div>
            <p>Your cart is empty</p>
          </div>
        ) : (
          <>
            {cartItems.map((item) => (
              <div key={item.product_id} className="bg-gray-50 rounded-lg p-2 border border-gray-200 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-gray-900 truncate">{item.name}</h3>
                    <p className="text-xs text-gray-500">{item.sku}</p>
                  </div>
                  <button 
                    onClick={() => removeItemFromCart(item.product_id)}
                    className="text-red-500 hover:text-red-700 ml-2 text-xs font-medium"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="font-bold text-blue-600">₹{item.unit_price.toFixed(2)}</span>
                    <span className="text-gray-500 text-xs ml-1">× {item.quantity}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => updateItemQuantity(item.product_id, item.quantity - 1)}
                      className="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded text-sm font-bold flex items-center justify-center"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                    <button 
                      onClick={() => updateItemQuantity(item.product_id, item.quantity + 1)}
                      className="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded text-sm font-bold flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
      
      {/* Cart Summary - Fixed at bottom */}
      {cartItems.length > 0 && (
        <div className="border-t-2 border-gray-200 bg-white p-4 rounded-b-lg">
          {/* Coupon Input */}
          <CouponInput orderAmount={cartSubtotal} />

          <div className="space-y-2 mb-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-semibold">₹{formattedSubtotal}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-green-600">Discount ({appliedCoupon?.code}):</span>
                <span className="font-semibold text-green-600">-₹{formattedDiscount}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax ({(vatRate * 100).toFixed(0)}%):</span>
              <span className="font-semibold">₹{formattedTaxAmount}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-green-700 pt-2 border-t border-gray-300">
              <span>Total:</span>
              <span>₹{formattedTotalAmount}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <button 
              onClick={onCheckout}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition shadow-md"
            >
              💳 Checkout
            </button>
            <button 
              onClick={clearCart}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg transition text-sm"
            >
              🗑️ Clear Cart
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main POS Page Component ---
const POSPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [selectedCustomerName, setSelectedCustomerName] = useState<string>('Walk-in Customer');
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState<boolean>(false);
  const { addItemToCart, clearCart, cartItems, cartSubtotal, appliedCoupon, discountAmount } = useCart();
  const { user } = useAuth(); // Get current user from auth context
  
  // Get app config (settings from database)
  const { appConfig } = useAppConfig();
  const vatRate = getConfigAsNumber(appConfig, 'tax_rate', 10) / 100; // Convert percentage to decimal
  
  // Invoice modal state
  const [showInvoiceModal, setShowInvoiceModal] = useState<boolean>(false);
  const [completedSale, setCompletedSale] = useState<any>(null);
  
  // Checkout confirmation modal state
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);
  
  // Barcode scanner state
  const [barcodeBuffer, setBarcodeBuffer] = useState<string>('');
  const [lastKeyTime, setLastKeyTime] = useState<number>(0);
  const [scanningActive, setScanningActive] = useState<boolean>(false);
  
  // --- Fetch Products ---
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/products', {
        params: { search: searchTerm, is_active: true } // Send search term and active filter
      });
      // Handle both direct array and paginated responses
      const productData = response.data.data || response.data;
      if (Array.isArray(productData)) {
        setProducts(productData);
      } else {
        setError('API response format is unexpected.');
        console.error("Unexpected product API response:", response.data);
      }
    } catch (err: any) {
      let errorMessage = 'Failed to load products.';
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = `Failed to load products: ${err.response.data.message}`;
      } else if (err.message) {
        errorMessage = `Failed to load products: ${err.message}`;
      }
      setError(errorMessage);
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]); // Re-fetch if search term changes

  // Fetch customers list
  const fetchCustomers = useCallback(async () => {
    try {
      const response = await api.get('/customers');
      // Handle both direct array and paginated responses
      const customerData = response.data.data || response.data;
      if (Array.isArray(customerData)) {
        setCustomers(customerData);
      }
    } catch (err) {
      console.error("Error fetching customers:", err);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Effect to call fetchProducts when the component mounts or search term changes
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]); // Dependency array includes fetchProducts to ensure it's stable

  // --- Handlers ---
  const handleAddToCart = (product: Product) => {
    // Ensure the price is treated as a number before adding it to the cart item
    const priceAsNumber = parseFloat(product.price.toString());

    if (isNaN(priceAsNumber)) {
      console.error("Cannot add product to cart: Invalid price.", product);
      toast.error(`Invalid price for product "${product.name}". Cannot add to cart.`);
      return; // Prevent adding if price is invalid
    }

    addItemToCart({
      product_id: product.id,
      name: product.name,
      sku: product.sku,
      unit_price: priceAsNumber, // Use the parsed number here!
      quantity: 1, // Add one item at a time by default
    });
    // Optional: Provide user feedback
    // console.log(`Added ${product.name} to cart.`);
  };

  // Process barcode input
  const processBarcodeInput = useCallback(async (barcode: string) => {
    console.log('Barcode scanned:', barcode);
    
    try {
      // Search for product by barcode
      const response = await api.get('/products', {
        params: { search: barcode, is_active: true }
      });

      // Handle both direct array and paginated responses
      const productData = response.data.data || response.data;
      const foundProducts = Array.isArray(productData) ? productData : [];
      
      // Find exact barcode match
      const product = foundProducts.find((p: Product) => 
        p.barcode && p.barcode.toLowerCase() === barcode.toLowerCase()
      );

      if (product) {
        // Product found - add to cart
        const priceAsNumber = parseFloat(product.price.toString());
        if (!isNaN(priceAsNumber)) {
          addItemToCart({
            product_id: product.id,
            name: product.name,
            sku: product.sku,
            unit_price: priceAsNumber,
            quantity: 1,
          });
          toast.success(`✅ ${product.name} added to cart!`, {
            icon: '📦',
            duration: 2000,
          });
        }
      } else {
        // Product not found
        toast.error(`❌ Product with barcode "${barcode}" not found`, {
          duration: 3000,
        });
      }
    } catch (err) {
      console.error('Error searching product by barcode:', err);
      toast.error('Failed to search product. Please try again.');
    }
  }, [addItemToCart]);

  // Barcode Scanner: Listen for keyboard events
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime;

      // Ignore if user is typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Enter key - process barcode
      if (e.key === 'Enter' && barcodeBuffer.length > 0) {
        e.preventDefault();
        processBarcodeInput(barcodeBuffer);
        setBarcodeBuffer('');
        setScanningActive(false);
        return;
      }

      // Detect rapid input (barcode scanners type < 100ms between characters)
      if (timeDiff < 100 && barcodeBuffer.length > 0) {
        // Continue building barcode
        setBarcodeBuffer(prev => prev + e.key);
        setLastKeyTime(currentTime);
        setScanningActive(true);
      } else if (timeDiff < 100 || barcodeBuffer.length === 0) {
        // Start new barcode scan
        setBarcodeBuffer(e.key);
        setLastKeyTime(currentTime);
        setScanningActive(true);
      } else {
        // Too slow, reset buffer (user is manually typing)
        setBarcodeBuffer('');
        setScanningActive(false);
      }
    };

    // Auto-reset buffer after 500ms of no input
    const resetTimer = setTimeout(() => {
      if (barcodeBuffer.length > 0 && Date.now() - lastKeyTime > 500) {
        setBarcodeBuffer('');
        setScanningActive(false);
      }
    }, 500);

    window.addEventListener('keypress', handleKeyPress);

    return () => {
      window.removeEventListener('keypress', handleKeyPress);
      clearTimeout(resetTimer);
    };
  }, [barcodeBuffer, lastKeyTime, processBarcodeInput]);

  const handleCheckout = async () => {
    // Get the actual logged-in user ID
    if (!user || !user.id) {
      toast.error('User authentication required. Please log in again.');
      return;
    }

    // Show checkout confirmation modal instead of browser alert
    setShowCheckoutModal(true);
  };

  const processCheckout = async () => {
    try {
      const response = await api.post('/sales', {
        user_id: user?.id, // Use actual logged-in user ID
        customer_name: selectedCustomerName,
        customer_id: selectedCustomerId,
        coupon_code: appliedCoupon?.code || null,
        discount_amount: discountAmount,
        products: cartItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
      });

      const saleResponse = response.data.data;

      // Store sale data for invoice
      const saleData = {
        ...saleResponse,
        items: cartItems,
        subtotal: saleResponse?.subtotal ?? cartSubtotal,
        taxAmount: saleResponse?.tax_amount ?? (Math.max(cartSubtotal - discountAmount, 0) * vatRate),
        discountAmount: saleResponse?.discount_amount ?? discountAmount,
        couponCode: saleResponse?.coupon_code ?? appliedCoupon?.code ?? null,
        total: saleResponse?.total_amount ?? (Math.max(cartSubtotal - discountAmount, 0) + (Math.max(cartSubtotal - discountAmount, 0) * vatRate)),
        customerName: selectedCustomerName,
        cashierName: user?.name || 'Cashier',
        date: new Date().toLocaleString(),
      };

      setCompletedSale(saleData);
      setShowInvoiceModal(true);
      setShowCheckoutModal(false); // Close checkout modal

      // Don't clear cart yet - let user print invoice first
      console.log('Sale created:', response.data); // Log response for debugging
    } catch (err: any) {
      console.error("Checkout failed:", err);
      let errorMessage = 'Checkout failed.';
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message; // Use API's error message
        if (err.response.data.error) { // Backend might provide more context
            errorMessage += ` (${err.response.data.error})`;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      toast.error(`Error: ${errorMessage}`);
      setShowCheckoutModal(false); // Close modal on error
    }
  };

  // Checkout Confirmation Modal Component
  const CheckoutModal: React.FC<{ onConfirm: () => void; onCancel: () => void }> = ({ onConfirm, onCancel }) => {
    const taxableSubtotal = Math.max(cartSubtotal - discountAmount, 0);
    const taxAmount = taxableSubtotal * vatRate;
    const totalAmount = taxableSubtotal + taxAmount;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Modal Header */}
          <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg">
            <div className="flex items-center">
              <div className="text-2xl mr-3">💳</div>
              <div>
                <h2 className="text-xl font-bold">Confirm Checkout</h2>
                <p className="text-blue-100 text-sm">Please review your order</p>
              </div>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6">
            {/* Customer Info */}
            <div className="mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Customer:</span>
                <span className="font-medium">{selectedCustomerName}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600">Items:</span>
                <span className="font-medium">{cartItems.length} item(s)</span>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>₹{cartSubtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount {appliedCoupon?.code ? `(${appliedCoupon.code})` : ''}:</span>
                    <span>-â‚¹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Tax ({(vatRate * 100).toFixed(0)}%):</span>
                  <span>₹{taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
                  <span>Total:</span>
                  <span className="text-green-600">₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-medium text-green-600">💵 Cash</span>
              </div>
            </div>

            <p className="text-sm text-gray-600 text-center">
              Click "Complete Sale" to process this transaction
            </p>
          </div>

          {/* Modal Actions */}
          <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end space-x-3">
            <button
              onClick={onCancel}
              className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition"
            >
              ✅ Complete Sale
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Invoice Modal Component
  const InvoiceModal: React.FC<{ sale: any; onClose: () => void; onNewSale: () => void }> = ({ sale, onClose, onNewSale }) => {
    const { appConfig } = useAppConfig();
    const storeName = getConfigAsString(appConfig, 'store_name', 'NexusMart');
    const storeTagline = getConfigAsString(appConfig, 'store_tagline', 'Where Excellence Meets Convenience');

    const handlePrint = () => {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      const invoiceHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${storeName} - Invoice #${sale?.invoice_number || 'INV'}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
            .company-name { font-size: 24px; font-weight: bold; color: #2563EB; }
            .tagline { color: #666; margin-top: 5px; }
            .invoice-details { margin: 20px 0; }
            .invoice-details table { width: 100%; }
            .invoice-details td { padding: 8px; font-size: 14px; }
            .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .items-table th { background-color: #f3f4f6; padding: 10px; text-align: left; border-bottom: 2px solid #333; font-weight: bold; }
            .items-table td { padding: 10px; border-bottom: 1px solid #ddd; }
            .items-table tr:last-child td { border-bottom: 2px solid #333; }
            .totals { margin-top: 20px; }
            .totals-table { margin-left: auto; min-width: 350px; }
            .totals-table tr td { padding: 8px 15px; }
            .total-row { font-weight: bold; font-size: 16px; border-top: 2px solid #333; background-color: #f9fafb; }
            .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 13px; }
            @media print {
              body { padding: 0; margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">🏪 ${storeName}</div>
            <p class="tagline">${storeTagline}</p>
          </div>

          <div class="invoice-details">
            <table>
              <tr>
                <td><strong>Invoice Number:</strong></td>
                <td>${sale?.invoice_number || 'N/A'}</td>
                <td><strong>Date:</strong></td>
                <td>${sale?.date || new Date().toLocaleString()}</td>
              </tr>
              <tr>
                <td><strong>Customer:</strong></td>
                <td>${sale?.customerName || 'Walk-in Customer'}</td>
                <td><strong>Payment Method:</strong></td>
                <td>CASH</td>
              </tr>
              <tr>
                <td><strong>Cashier:</strong></td>
                <td>${sale?.cashierName || 'N/A'}</td>
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
              ${sale?.items?.map((item: any) => `
                <tr>
                  <td>${item.name || 'Unknown Product'}</td>
                  <td>${item.sku || 'N/A'}</td>
                  <td style="text-align: center;">${item.quantity}</td>
                  <td style="text-align: right;">₹${parseFloat(item.unit_price).toFixed(2)}</td>
                  <td style="text-align: right;">₹${(parseFloat(item.unit_price) * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('') || '<tr><td colspan="5" style="text-align: center;">No items</td></tr>'}
            </tbody>
          </table>

          <div class="totals">
            <table class="totals-table">
              <tr>
                <td>Subtotal:</td>
                <td style="text-align: right;">₹${parseFloat(sale?.subtotal || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td>Tax (${(vatRate * 100).toFixed(0)}%):</td>
                <td style="text-align: right;">₹${parseFloat(sale?.taxAmount || 0).toFixed(2)}</td>
              </tr>
              ${sale?.discountAmount > 0 ? `
              <tr>
                <td>Discount${sale?.couponCode ? ` (${sale.couponCode})` : ''}:</td>
                <td style="text-align: right; color: #15803d;">-â‚¹${parseFloat(sale?.discountAmount || 0).toFixed(2)}</td>
              </tr>
              ` : ''}
              <tr class="total-row">
                <td>Total Amount:</td>
                <td style="text-align: right;">₹${parseFloat(sale?.total || 0).toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <div class="footer">
            <p>Thank you for your business!</p>
            <p>This is a computer-generated invoice.</p>
          </div>

          <div class="no-print" style="text-align: center; margin-top: 30px;">
            <button onclick="window.print()" style="padding: 10px 20px; background-color: #2563EB; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px; margin-right: 10px;">
              🖨️ Print Invoice
            </button>
            <button onclick="window.close()" style="padding: 10px 20px; background-color: #6B7280; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
              Close
            </button>
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(invoiceHTML);
      printWindow.document.close();
    };

    const handleNewSale = () => {
      clearCart();
      setCompletedSale(null);
      setShowInvoiceModal(false);
      onNewSale();
    };

    return (
      <div className="invoice-modal-container fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Invoice Header */}
          <div style={{ borderBottom: '2px solid #333', paddingBottom: '20px', marginBottom: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563EB' }}>
              🏪 {getConfigAsString(appConfig, 'store_name', 'NexusMart')}
            </div>
            <p style={{ color: '#666', marginTop: '5px' }}>
              {getConfigAsString(appConfig, 'store_tagline', 'Where Excellence Meets Convenience')}
            </p>
          </div>

          {/* Invoice Body */}
          <div className="p-6" id="invoice-content">
            {/* Invoice Details */}
            <div style={{ margin: '20px 0' }}>
              <table style={{ width: '100%' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px', fontSize: '14px' }}><strong>Invoice Number:</strong></td>
                    <td style={{ padding: '8px', fontSize: '14px' }}>{sale?.invoice_number || 'N/A'}</td>
                    <td style={{ padding: '8px', fontSize: '14px' }}><strong>Date:</strong></td>
                    <td style={{ padding: '8px', fontSize: '14px' }}>{sale?.date || new Date().toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', fontSize: '14px' }}><strong>Customer:</strong></td>
                    <td style={{ padding: '8px', fontSize: '14px' }}>{sale?.customerName || 'Walk-in Customer'}</td>
                    <td style={{ padding: '8px', fontSize: '14px' }}><strong>Payment Method:</strong></td>
                    <td style={{ padding: '8px', fontSize: '14px' }}>CASH</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', fontSize: '14px' }}><strong>Cashier:</strong></td>
                    <td style={{ padding: '8px', fontSize: '14px' }}>{sale?.cashierName || 'N/A'}</td>
                    <td></td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Items Table */}
            <div style={{ margin: '20px 0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', margin: '20px 0' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #333' }}>
                    <th style={{ padding: '10px', textAlign: 'left', fontWeight: 'bold' }}>Item</th>
                    <th style={{ padding: '10px', textAlign: 'left', fontWeight: 'bold' }}>SKU</th>
                    <th style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>Quantity</th>
                    <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>Unit Price</th>
                    <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sale?.items?.map((item: any, index: number) => (
                    <tr key={index} style={{ borderBottom: '1px solid #ddd' }}>
                      <td style={{ padding: '10px' }}>{item.name || 'Unknown Product'}</td>
                      <td style={{ padding: '10px' }}>{item.sku || 'N/A'}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>₹{parseFloat(item.unit_price).toFixed(2)}</td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>₹{(parseFloat(item.unit_price) * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <table style={{ minWidth: '350px' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px 15px' }}>Subtotal:</td>
                    <td style={{ padding: '8px 15px', textAlign: 'right' }}>₹{parseFloat(sale?.subtotal || 0).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 15px' }}>Tax ({(vatRate * 100).toFixed(0)}%):</td>
                    <td style={{ padding: '8px 15px', textAlign: 'right' }}>₹{parseFloat(sale?.taxAmount || 0).toFixed(2)}</td>
                  </tr>
                  {sale?.discountAmount > 0 && (
                    <tr>
                      <td style={{ padding: '8px 15px', color: '#15803d' }}>
                        Discount{sale?.couponCode ? ` (${sale.couponCode})` : ''}:
                      </td>
                      <td style={{ padding: '8px 15px', textAlign: 'right', color: '#15803d' }}>
                        -â‚¹{parseFloat(sale?.discountAmount || 0).toFixed(2)}
                      </td>
                    </tr>
                  )}
                  <tr style={{ fontWeight: 'bold', fontSize: '16px', borderTop: '2px solid #333', backgroundColor: '#f9fafb' }}>
                    <td style={{ padding: '8px 15px' }}>Total Amount:</td>
                    <td style={{ padding: '8px 15px', textAlign: 'right' }}>₹{parseFloat(sale?.total || 0).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Footer Message */}
            <div style={{ textAlign: 'center', color: '#666', fontSize: '13px', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #ddd' }}>
              <p>Thank you for your business!</p>
              <p>This is a computer-generated invoice.</p>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-between no-print">
            <button
              onClick={handleNewSale}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition"
            >
              🛒 New Sale
            </button>
            <div className="space-x-3">
              <button
                onClick={onClose}
                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg transition"
              >
                Close
              </button>
              <button
                onClick={handlePrint}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
              >
                🖨️ Print Invoice
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-100 overflow-hidden">
      {/* Checkout Confirmation Modal */}
      {showCheckoutModal && (
        <CheckoutModal
          onConfirm={processCheckout}
          onCancel={() => setShowCheckoutModal(false)}
        />
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && completedSale && (
        <InvoiceModal
          sale={completedSale}
          onClose={() => setShowInvoiceModal(false)}
          onNewSale={() => {
            // Reset customer selection for new sale
            setSelectedCustomerId(null);
            setSelectedCustomerName('Walk-in Customer');
            setCustomerSearch('');
          }}
        />
      )}
      {/* Barcode Scanning Indicator */}
      {scanningActive && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="font-semibold">Scanning Barcode...</span>
        </div>
      )}
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Customer Selection - Searchable */}
        <div className="bg-white p-4 border-b border-gray-200 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Customer for this Sale:
          </label>
          <div className="relative">
            <input
              type="text"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              onFocus={() => setShowCustomerDropdown(true)}
              placeholder="Search customer by name, email or phone..."
              autoComplete="off"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            />

            {/* Dropdown List */}
            {showCustomerDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {/* Walk-in Customer Option */}
                <div
                  onClick={() => {
                    setSelectedCustomerId(null);
                    setSelectedCustomerName('Walk-in Customer');
                    setCustomerSearch('');
                    setShowCustomerDropdown(false);
                  }}
                  className={`px-4 py-3 cursor-pointer hover:bg-blue-50 border-b border-gray-200 ${
                    selectedCustomerId === null ? 'bg-blue-100 font-semibold' : ''
                  }`}
                >
                  <div className="font-medium text-gray-900">Walk-in Customer</div>
                  <div className="text-sm text-gray-500">No account (Anonymous purchase)</div>
                </div>

                {/* Filtered Customer List */}
                {customers
                  .filter(customer => {
                    const search = customerSearch.toLowerCase();
                    return (
                      customer.name.toLowerCase().includes(search) ||
                      customer.email?.toLowerCase().includes(search) ||
                      customer.phone?.includes(search)
                    );
                  })
                  .map((customer) => (
                    <div
                      key={customer.id}
                      onClick={() => {
                        setSelectedCustomerId(customer.id);
                        setSelectedCustomerName(customer.name);
                        setCustomerSearch(customer.name);
                        setShowCustomerDropdown(false);
                      }}
                      className={`px-4 py-3 cursor-pointer hover:bg-blue-50 border-b border-gray-200 ${
                        selectedCustomerId === customer.id ? 'bg-blue-100 font-semibold' : ''
                      }`}
                    >
                      <div className="font-medium text-gray-900">{customer.name}</div>
                      <div className="text-sm text-gray-600">
                        {customer.phone && <span>📱 {customer.phone}</span>}
                        {customer.email && <span className="ml-3">✉️ {customer.email}</span>}
                      </div>
                      {(customer.total_purchases > 0 || customer.total_spent > 0) && (
                        <div className="text-xs text-gray-500 mt-1">
                          {customer.total_purchases} purchases • ₹{customer.total_spent.toFixed(2)} spent
                        </div>
                      )}
                    </div>
                  ))}

                {/* No Results */}
                {customerSearch && customers.filter(customer => {
                  const search = customerSearch.toLowerCase();
                  return (
                    customer.name.toLowerCase().includes(search) ||
                    customer.email?.toLowerCase().includes(search) ||
                    customer.phone?.includes(search)
                  );
                }).length === 0 && (
                  <div className="px-4 py-3 text-center text-gray-500">
                    No customers found. <button
                      onClick={() => setShowCustomerDropdown(false)}
                      className="text-blue-600 hover:underline ml-1"
                    >
                      Clear search
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Click outside to close */}
            {showCustomerDropdown && (
              <div
                className="fixed inset-0 z-0"
                onClick={() => setShowCustomerDropdown(false)}
              />
            )}
          </div>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-600">
              Current Customer: <span className="font-semibold text-blue-600">{selectedCustomerName}</span>
            </p>
            {selectedCustomerId && (
              <button
                onClick={() => {
                  setSelectedCustomerId(null);
                  setSelectedCustomerName('Walk-in Customer');
                  setCustomerSearch('');
                }}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Clear Selection
              </button>
            )}
          </div>
        </div>

        <div className="bg-gray-50 flex-1 overflow-y-auto p-4">
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
            <input
              type="text"
              placeholder="🔍 Search products by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            />
            <button
              onClick={fetchProducts}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
            >
              Search
            </button>
          </div>

          {loading && <LoadingSpinner message="Loading products..." />}
          {error && <p className="text-red-600 bg-red-50 border border-red-300 p-4 rounded-lg">{error}</p>}
          {!loading && !error && products.length === 0 && (
            <p className="text-center py-8 text-gray-500">No active products found matching your search.</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {!loading && !error && products.map((product) => (
              <ProductListItem
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-full lg:w-80 bg-white border-t border-gray-200 lg:border-t-0 lg:border-l overflow-y-auto">
        <CartDisplay onCheckout={handleCheckout} vatRate={vatRate} />
      </div>
    </div>
  );
};

export default POSPage;
