import React from 'react';
import { Product } from './types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  showLowStockWarning?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, showLowStockWarning = true }) => {
  const priceAsNumber = parseFloat(product.price.toString());
  const formattedPrice = isNaN(priceAsNumber) ? 'N/A' : priceAsNumber.toFixed(2);
  const isOutOfStock = !product.is_active || product.stock_quantity <= 0;
  const isLowStock = product.stock_quantity > 0 && product.stock_quantity < (product.reorder_level || 10);

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition p-4 border border-gray-200 relative">
      {/* Low Stock Warning Badge */}
      {showLowStockWarning && isLowStock && !isOutOfStock && (
        <div className="absolute top-2 right-2 bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full font-semibold flex items-center gap-1">
          <span>⚠️</span>
          <span>Low Stock</span>
        </div>
      )}

      {/* Product Image Placeholder */}
      {product.image_url ? (
        <img 
          src={product.image_url} 
          alt={product.name}
          className="w-full h-32 object-cover rounded-lg mb-3"
        />
      ) : (
        <div className="w-full h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg mb-3 flex items-center justify-center">
          <span className="text-4xl">🛒</span>
        </div>
      )}

      <h3 className="font-bold text-gray-900 text-base mb-1 truncate" title={product.name}>
        {product.name}
      </h3>
      <p className="text-xs text-gray-500 mb-2">SKU: {product.sku}</p>
      
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-lg font-bold text-blue-600">₹{formattedPrice}</p>
          <p className="text-xs text-gray-600">
            Stock: <span className={
              isOutOfStock ? 'text-red-600 font-semibold' : 
              isLowStock ? 'text-orange-600 font-semibold' : 
              'text-green-600'
            }>
              {product.stock_quantity}
            </span>
          </p>
        </div>
        {isOutOfStock && (
          <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded font-semibold">
            Out of Stock
          </span>
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

export default ProductCard;
