import toast from 'react-hot-toast';

// CartItem from cart context
export interface CartItem {
  product_id: number;
  name: string;
  sku: string;
  unit_price: number;
  quantity: number;
}

// Sale data used in POS
export interface Sale {
  id?: number;
  invoice_number: string;
  paymentMethod: string;
  customer_name?: string | null;
  items?: CartItem[];
  subtotal?: number;
  taxAmount?: number;
  discountAmount?: number;
  total?: number;
  date?: number | string;
}

export interface ReceiptData {
  sale: Sale;
  items: CartItem[];
  storeName: string;
  storeTagline: string;
  storeAddress?: string;
  storePhone?: string;
  cashierName: string;
  paymentMethod: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  transactionDate: Date;
  invoiceNumber: string;
}

export const generateReceiptHTML = (data: ReceiptData): string => {
  const {
    sale,
    items,
    storeName,
    storeTagline,
    storeAddress = '',
    storePhone = '',
    cashierName,
    paymentMethod,
    subtotal,
    taxAmount,
    discountAmount,
    totalAmount,
    transactionDate,
    invoiceNumber,
  } = data;

  const dateFormatted = transactionDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const paymentLabel = paymentMethod.replace('_', ' ').toUpperCase();

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${storeName} - Receipt #${invoiceNumber}</title>
        <style>
          @media print {
            @page { size: 80mm auto; margin: 0; }
            body { width: 80mm; margin: 0; padding: 2mm; font-size: 12px; font-family: 'Courier New', monospace; }
          }
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.4;
            max-width: 80mm;
            margin: 0 auto;
            padding: 2mm;
            color: #000;
          }
          .header {
            text-align: center;
            border-bottom: 1px dashed #000;
            padding-bottom: 8px;
            margin-bottom: 8px;
          }
          .company-name {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 2px;
          }
          .tagline {
            font-size: 10px;
            color: #333;
            margin-bottom: 4px;
          }
          .store-info {
            font-size: 10px;
            color: #555;
          }
          .divider {
            border-bottom: 1px dashed #000;
            margin: 8px 0;
          }
          .invoice-details {
            font-size: 11px;
            margin-bottom: 8px;
          }
          .invoice-details div {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
          }
          .items-header {
            font-weight: bold;
            border-bottom: 1px solid #000;
            padding: 4px 0;
            margin-bottom: 4px;
          }
          .item-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
          }
          .item-name {
            flex: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .item-qty {
            width: 30px;
            text-align: center;
          }
          .item-price {
            width: 50px;
            text-align: right;
          }
          .total-section {
            border-top: 1px dashed #000;
            padding-top: 8px;
            margin-top: 8px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
          }
          .total-final {
            font-size: 14px;
            font-weight: bold;
            border-top: 2px solid #000;
            margin-top: 4px;
            padding-top: 4px;
          }
          .footer {
            text-align: center;
            margin-top: 12px;
            padding-top: 8px;
            border-top: 1px dashed #000;
            font-size: 10px;
            color: #555;
          }
          .barcode {
            text-align: center;
            margin: 8px 0;
            font-family: 'Libre Barcode 39', cursive;
            font-size: 40px;
            letter-spacing: 3px;
          }
          .thank-you {
            text-align: center;
            font-weight: bold;
            margin-top: 4px;
          }
          .payment-method {
            text-transform: uppercase;
            font-weight: bold;
          }
          @page {
            size: 80mm auto;
            margin: 0;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
        <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39+Text&display=swap" rel="stylesheet">
      </head>
      <body>
        <!-- Header -->
        <div class="header">
          <div class="company-name">${storeName}</div>
          ${storeTagline ? `<div class="tagline">${storeTagline}</div>` : ''}
          ${storeAddress ? `<div class="store-info">${storeAddress}</div>` : ''}
          ${storePhone ? `<div class="store-info">Tel: ${storePhone}</div>` : ''}
        </div>

        <!-- Invoice Details -->
        <div class="invoice-details">
          <div><span>Invoice:</span> <span>${invoiceNumber}</span></div>
          <div><span>Date:</span> <span>${dateFormatted}</span></div>
          <div><span>Cashier:</span> <span>${cashierName}</span></div>
          ${sale.customer_name ? `<div><span>Customer:</span> <span>${sale.customer_name}</span></div>` : ''}
        </div>

        <div class="divider"></div>

        <!-- Items -->
        <div class="items-header">
          <div style="display: flex;">
            <div style="flex: 2;">Item</div>
            <div style="flex: 1; text-align: center;">Qty</div>
            <div style="flex: 2; text-align: right;">Price</div>
          </div>
        </div>
        <div class="items-list">
          ${items.map(item => {
            const lineTotal = (item.unit_price * item.quantity).toFixed(2);
            return `
              <div class="item-row">
                <div class="item-name" title="${item.name}">${item.name}</div>
                <div class="item-qty">x${item.quantity}</div>
                <div class="item-price">₹${lineTotal}</div>
              </div>
            `;
          }).join('')}
        </div>

        <div class="divider"></div>

        <!-- Totals -->
        <div class="total-section">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>₹${subtotal.toFixed(2)}</span>
          </div>
          ${taxAmount > 0 ? `
          <div class="total-row">
            <span>Tax:</span>
            <span>₹${taxAmount.toFixed(2)}</span>
          </div>
          ` : ''}
          ${discountAmount > 0 ? `
          <div class="total-row">
            <span>Discount:</span>
            <span>-₹${discountAmount.toFixed(2)}</span>
          </div>
          ` : ''}
          <div class="total-row total-final">
            <span>TOTAL:</span>
            <span>₹${totalAmount.toFixed(2)}</span>
          </div>
          <div class="total-row" style="margin-top: 4px;">
            <span>Payment (${paymentLabel}):</span>
            <span class="payment-method">₹${totalAmount.toFixed(2)}</span>
          </div>
        </div>

        <!-- Barcode (Invoice Number) -->
        <div class="barcode">*${invoiceNumber}*</div>

        <!-- Footer -->
        <div class="footer">
          <div class="thank-you">THANK YOU!</div>
          <div>Visit us again!</div>
          <div style="margin-top: 6px;"> Powered by NexusMart</div>
        </div>

        <!-- Print Button for preview -->
        <script>
          // Auto-print when opened in new window
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
    </html>
  `;
};

export const printReceipt = (receiptHTML: string): void => {
  const printWindow = window.open('', '_blank', 'width=400,height=600');
  if (!printWindow) {
    toast.error('Failed to open print window. Please allow popups.');
    return;
  }

  printWindow.document.write(receiptHTML);
  printWindow.document.close();

  // Focus and trigger print dialog
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    // Optional: close after printing
    // printWindow.close();
  }, 500);
};
