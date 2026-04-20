# NexusMart Documentation

## Project Overview

NexusMart is a full-stack e-commerce and Point of Sale (POS) system built with Laravel 12 (backend) and React 19 (frontend).

## Tech Stack

### Backend
- **Framework**: Laravel 12
- **PHP Version**: 8.2+
- **Authentication**: Laravel Sanctum
- **API**: RESTful JSON API

### Frontend
- **Framework**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM 7
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Barcode Scanning**: html5-qrcode
- **Notifications**: react-hot-toast

## Project Structure

```
NexusMart/
├── backend/                 # Laravel Backend
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/Api/  # API Controllers
│   │   │   └── Resources/         # API Resources
│   │   ├── Models/               # Eloquent Models
│   │   └── Providers/            # Service Providers
│   ├── database/
│   ├── routes/
│   └── ...
├── frontend/                # React Frontend
│   ├── src/
│   │   ├── pages/           # Page Components
│   │   ├── components/      # Reusable Components
│   │   ├── contexts/        # React Contexts
│   │   ├── hooks/           # Custom Hooks
│   │   ├── services/        # API Services
│   │   └── utils/           # Utilities
│   └── ...
└── README.md
```

## Features

### Dashboard
- Sales overview and statistics
- Visual charts for revenue and trends

### Point of Sale (POS)
- Barcode scanning support
- Product search
- Cart management
- Multiple payment methods
- Receipt printing

### Products
- Product CRUD operations
- Category management
- Price and stock management
- Barcode integration

### Inventory Management
- Stock tracking
- Low stock alerts
- Stock adjustments

### Customers
- Customer database
- Purchase history
- Customer reports

### Suppliers
- Supplier management
- Supply chain tracking

### Sales & Returns
- Sales transaction history
- Return processing
- Refund management

### Coupons
- Coupon creation and management
- Discount codes
- Usage tracking

### Reports
- Sales reports
- Financial summaries
- Export capabilities

### Settings
- Application configuration
- Store preferences
- User management

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/login` | User login |
| POST | `/api/logout` | User logout |
| GET | `/api/user` | Get authenticated user |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Get dashboard statistics |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List all products |
| POST | `/api/products` | Create product |
| GET | `/api/products/{id}` | Get product details |
| PUT | `/api/products/{id}` | Update product |
| DELETE | `/api/products/{id}` | Delete product |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | List categories |
| POST | `/api/categories` | Create category |
| PUT | `/api/categories/{id}` | Update category |
| DELETE | `/api/categories/{id}` | Delete category |

### Customers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customers` | List customers |
| POST | `/api/customers` | Create customer |
| GET | `/api/customers/{id}` | Get customer details |
| PUT | `/api/customers/{id}` | Update customer |
| DELETE | `/api/customers/{id}` | Delete customer |

### Suppliers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/suppliers` | List suppliers |
| POST | `/api/suppliers` | Create supplier |
| GET | `/api/suppliers/{id}` | Get supplier details |
| PUT | `/api/suppliers/{id}` | Update supplier |
| DELETE | `/api/suppliers/{id}` | Delete supplier |

### Sales
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sales` | List sales |
| POST | `/api/sales` | Create sale |
| GET | `/api/sales/{id}` | Get sale details |

### Sales Returns
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sale-returns` | List returns |
| POST | `/api/sale-returns` | Create return |
| GET | `/api/sale-returns/{id}` | Get return details |

### Coupons
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/coupons` | List coupons |
| POST | `/api/coupons` | Create coupon |
| PUT | `/api/coupons/{id}` | Update coupon |
| DELETE | `/api/coupons/{id}` | Delete coupon |
| POST | `/api/coupons/validate` | Validate coupon code |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/sales` | Sales report |
| GET | `/api/reports/inventory` | Inventory report |

### Settings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/settings` | Get settings |
| PUT | `/api/settings` | Update settings |

## Database Models

### User
- id, name, email, password, timestamps

### Product
- id, name, sku, barcode, description, price, cost, stock_quantity, category_id, supplier_id, timestamps

### Category
- id, name, description, timestamps

### Customer
- id, name, email, phone, address, timestamps

### Supplier
- id, name, email, phone, address, timestamps

### Sale
- id, customer_id, user_id, total_amount, payment_method, status, timestamps

### SaleItem
- id, sale_id, product_id, quantity, unit_price, subtotal

### SaleReturn
- id, sale_id, reason, total_refund, status, timestamps

### Coupon
- id, code, discount_type, discount_value, min_purchase, max_uses, starts_at, expires_at, timestamps

### Setting
- id, key, value, timestamps

## Installation

### Prerequisites
- PHP 8.2+
- Composer
- Node.js 16+
- MySQL/MariaDB or SQLite

### Backend Setup
```bash
cd backend
composer install
cp .env.example .env  ### if .env already not there
php artisan key:generate
php artisan migrate
php artisan db:seed   ### in case you want to seed the database with test data
php artisan serve
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## Environment Variables

### Backend (.env)
```
APP_NAME=nexusMart
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=nexusMart
DB_USERNAME=root
DB_PASSWORD=

FRONTEND_URL=http://localhost:3000
```

## Frontend Environment Variables
```
REACT_APP_API_URL=http://localhost:8000/api
```

## Running the Application

### Development Mode
```bash
# Backend
cd backend
php artisan serve

# Frontend
cd frontend
npm start
```

### Production Build
```bash
# Backend
php artisan optimize

# Frontend
npm run build
```

## Key Features Implementation

### Barcode Scanning
Located in `frontend/src/hooks/useBarcodeScanner.ts` - handles barcode input from devices.

### Receipt Printing
Located in `frontend/src/utils/receiptPrinter.ts` - generates printable receipts for transactions.

### Cart Management
Located in `frontend/src/contexts/CartContext.tsx` - manages POS cart state.

### Authentication
Located in `frontend/src/contexts/AuthContext.tsx` - handles user authentication state.

### API Service
Located in `frontend/src/services/api.ts` - axios instance with interceptors.

### Coupon Validation
Located in `frontend/src/services/couponService.ts` - handles coupon business logic.

## Security

- CSRF protection via Laravel Sanctum
- Input validation on all endpoints
- Password hashing with bcrypt
- CORS configuration for API access

## Performance Considerations

- API Resources for optimized JSON responses
- React lazy loading for routes
- Optimistic UI updates
- Debounced search inputs

## License

This project is proprietary software.
