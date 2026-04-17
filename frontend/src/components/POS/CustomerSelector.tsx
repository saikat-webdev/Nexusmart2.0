import React, { useState, useEffect } from 'react';
import { Customer } from './types';

interface CustomerSelectorProps {
  customers: Customer[];
  selectedCustomerId: number | null;
  selectedCustomerName: string;
  onCustomerSelect: (customerId: number | null, customerName: string) => void;
}

const CustomerSelector: React.FC<CustomerSelectorProps> = ({
  customers,
  selectedCustomerId,
  selectedCustomerName,
  onCustomerSelect,
}) => {
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  const filteredCustomers = customers.filter((customer) => {
    const searchLower = customerSearch.toLowerCase();
    return (
      customer.name.toLowerCase().includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.phone?.includes(searchLower)
    );
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.customer-selector')) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="bg-white p-4 border-b border-gray-200 shadow-sm customer-selector">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Customer for this Sale:
      </label>
      <div className="relative">
        <input
          type="text"
          value={customerSearch}
          onChange={(e) => setCustomerSearch(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          placeholder="Search customer by name, email or phone..."
          autoComplete="off"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
        />

        {/* Current Customer Display */}
        <div className="mt-2 flex items-center gap-2">
          <span className="text-sm text-gray-600">Current Customer:</span>
          <span className="font-semibold text-blue-600">{selectedCustomerName}</span>
        </div>

        {/* Dropdown List */}
        {showDropdown && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {/* Walk-in Customer Option */}
            <div
              onClick={() => {
                onCustomerSelect(null, 'Walk-in Customer');
                setCustomerSearch('');
                setShowDropdown(false);
              }}
              className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-200 bg-gray-50"
            >
              <div className="font-semibold text-gray-900">🚶 Walk-in Customer</div>
              <div className="text-xs text-gray-500">No customer information</div>
            </div>

            {/* Filtered Customer List */}
            {filteredCustomers.length === 0 ? (
              <div className="px-4 py-3 text-gray-500 text-sm text-center">
                No customers found
              </div>
            ) : (
              filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  onClick={() => {
                    onCustomerSelect(customer.id, customer.name);
                    setCustomerSearch('');
                    setShowDropdown(false);
                  }}
                  className={`px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 transition ${
                    selectedCustomerId === customer.id ? 'bg-blue-100' : ''
                  }`}
                >
                  <div className="font-semibold text-gray-900">{customer.name}</div>
                  <div className="text-xs text-gray-600">
                    {customer.email && <span className="mr-3">📧 {customer.email}</span>}
                    {customer.phone && <span>📞 {customer.phone}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerSelector;
