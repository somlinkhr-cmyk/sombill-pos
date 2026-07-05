# SomBill POS - Restaurant Management System

A modern, production-ready Restaurant POS System built with React, TypeScript, Tailwind CSS, and Supabase.

## Features

### Manager Dashboard
- Real-time sales analytics and KPIs
- Order management with search, filter, and export
- Menu management (categories, products, variants, sizes, toppings)
- Inventory management with auto-deduction
- Table management with floor plan
- Staff management with attendance tracking
- Customer management with loyalty points
- Comprehensive reporting (sales, inventory, profit/loss)
- Expense tracking
- System settings and configuration

### Cashier POS
- Touch-optimized interface for fast ordering
- Product search and barcode scanning
- Category-based product navigation
- Cart management with quantity controls
- Multiple payment methods (Cash, Card, Mobile)
- Table service integration
- Receipt printing
- Order notes and modifiers

### Kitchen Display System (KDS)
- Real-time order display
- Order status tracking (New → Preparing → Ready → Served)
- Visual order cards with items and quantities
- One-click status updates

### Waiter Panel
- Table overview with status indicators
- Quick order placement
- Table management
- Active order tracking

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Icons**: Lucide React
- **Charts**: Recharts
- **PDF Export**: jsPDF
- **Excel Export**: xlsx
- **QR Codes**: qrcode.react
- **Barcodes**: react-barcode
- **Notifications**: react-hot-toast
- **State Management**: React Context + TanStack Query

## Getting Started

### Prerequisites

- Node.js 18+ 
- A Supabase project (free tier works)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd sombill-pos
```

2. Install dependencies:
```bash
npm install
```

3. Set up Supabase:
   - Create a new project at https://supabase.com
   - Run the SQL schema from `supabase-schema.sql` in your Supabase SQL Editor
   - Get your project URL and anon key from Supabase settings

4. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Create test users in Supabase Auth:
   - Manager: manager@sombill.com / demo123
   - Cashier: cashier@sombill.com / demo123
   - Waiter: waiter@sombill.com / demo123
   - Kitchen: kitchen@sombill.com / demo123

6. Start the development server:
```bash
npm run dev
```

7. Open http://localhost:3000 in your browser

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Database Schema

The system uses the following main tables:

- `users` - Staff accounts with roles
- `categories` - Product categories
- `products` - Menu items with pricing
- `tables` - Restaurant tables
- `orders` - Customer orders
- `order_items` - Items within orders
- `customers` - Customer profiles
- `ingredients` - Inventory items
- `suppliers` - Ingredient suppliers
- `expenses` - Business expenses
- `attendance` - Staff attendance records
- `settings` - System configuration

See `supabase-schema.sql` for the complete schema.

## Role-Based Access Control

- **Manager**: Full access to all modules
- **Cashier**: POS, table service, customer management
- **Waiter**: Table management, order placement
- **Kitchen**: Kitchen display system only

## Real-Time Features

The system uses Supabase Realtime for:
- Live order updates to kitchen
- Table status synchronization
- Inventory level updates
- Sales dashboard refreshes

## Printing

The system supports:
- Thermal receipt printing (80mm)
- Kitchen ticket printing
- Report printing

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari

## License

MIT

## Support

For issues and questions, please contact the development team.
