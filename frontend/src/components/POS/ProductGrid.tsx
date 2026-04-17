import React, { useState } from 'react';
import LoadingSpinner from '../LoadingSpinner';
import { Product } from './types';
import ProductCard from './ProductCard';

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  loading: boolean;
  error: string | null;
  categories?: Array<{ id: number; name: string }>;
  selectedCategory: number | 'all';
  onCategoryChange: (categoryId: number | 'all') => void;
  recentProducts?: Product[];
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  onAddToCart,
  loading,
  error,
  categories = [],
  selectedCategory,
  onCategoryChange,
  recentProducts = [],
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner message="Loading products..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-600 font-semibold">❌ {error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Category Filter Bar */}
      {categories.length > 0 && (
        <div className="mb-4 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-700">Filter:</span>
            <button
              onClick={() => onCategoryChange('all')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Products
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent Products Section */}
      {recentProducts.length > 0 && selectedCategory === 'all' && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-bold text-gray-700">⚡ Recently Added:</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {recentProducts.slice(0, 6).map((product) => (
              <ProductCard
                key={`recent-${product.id}`}
                product={product}
                onAddToCart={onAddToCart}
                showLowStockWarning={true}
              />
            ))}
          </div>
          <div className="border-t border-gray-200 my-4"></div>
        </div>
      )}

      {/* All Products Grid */}
      <div className="flex-1 overflow-y-auto">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-600 text-lg">No products found</p>
            <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
                showLowStockWarning={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductGrid;
