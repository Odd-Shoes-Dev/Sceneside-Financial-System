# Sceneside Financial System

A comprehensive financial management system built for **Sceneside L.L.C**, featuring double-entry bookkeeping, invoicing, inventory management, and more.

## 🏢 Company Information

- **Company**: Sceneside L.L.C
- **Address**: 231 River St, Waltham, MA 02453
- **Phone**: 857-384-2899
- **EIN**: 99-3334108
- **Bank**: Bank of America (Account: 466021944682)

## 🚀 Features

### Core Modules

1. **General Ledger**
   - Double-entry bookkeeping
   - Chart of accounts with hierarchical structure
   - Journal entries with auto-balancing
   - Trial balance and account reconciliation

2. **Revenue & Sales (AR)**
   - Customer management
   - Invoice creation with line items
   - Multiple payment methods
   - Stripe integration for online payments
   - Invoice PDF generation
   - Email invoices to customers
   - A/R aging reports

3. **Expenses & Payables (AP)**
   - Vendor management
   - Bill tracking and payment
   - Expense categorization
   - A/P aging reports

4. **Inventory Management**
   - Product/service catalog
   - Stock tracking with FIFO valuation
   - Low stock alerts
   - Inventory valuation reports

5. **Fixed Assets**
   - Asset register
   - Depreciation tracking (straight-line, declining balance, sum-of-years)
   - Asset disposal management

6. **Cash & Bank Management**
   - Multiple bank accounts
   - Transaction tracking
   - Bank reconciliation

7. **Financial Reporting**
   - Profit & Loss Statement
   - Balance Sheet
   - Cash Flow Statement
   - Trial Balance
   - Customer/Vendor statements
   - Sales by customer/product reports

8. **User Management**
   - Role-based access (Admin, Accountant, Manager, Clerk, Viewer)
   - Activity logging
   - Secure authentication via Supabase

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **UI Components**: Headless UI, Heroicons
- **Payments**: Stripe
- **Email**: Resend
- **State Management**: Zustand, React Query
- **Forms**: React Hook Form + Zod
- **Charts**: Chart.js / React-Chartjs-2

## 📁 Project Structure

```
sceneside/
├── public/
│   └── Sceneside assets/       # Company logos
├── src/
│   ├── app/
│   │   ├── api/                # API routes
│   │   ├── dashboard/          # Dashboard pages
│   │   ├── pay/                # Public payment page
│   │   ├── login/              # Authentication
│   │   └── layout.tsx
│   ├── components/
│   │   └── ui/                 # Reusable UI components
│   ├── lib/
│   │   ├── supabase/           # Supabase client
│   │   ├── accounting/         # Accounting logic
│   │   ├── stripe.ts           # Stripe integration
│   │   ├── email/              # Email templates
│   │   └── pdf/                # PDF generation
│   └── types/                  # TypeScript types
├── supabase/
│   └── migrations/             # Database migrations
└── tailwind.config.js
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Stripe account (for payments)
- Resend account (for emails)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sceneside
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your credentials:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # Stripe
   STRIPE_SECRET_KEY=sk_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
   STRIPE_WEBHOOK_SECRET=whsec_...

   # Resend (Email)
   RESEND_API_KEY=re_...

   # App
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Set up the database**
   
   Run migrations in Supabase SQL Editor:
   - `001_initial_schema.sql` - Core tables
   - `002_rls_policies.sql` - Row Level Security
   - `003_functions.sql` - Auto-numbering functions
   - `004_seed_data.sql` - Initial data (chart of accounts, etc.)

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open the application**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📊 Database Schema

### Core Tables

| Table | Description |
|-------|-------------|
| `user_profiles` | User accounts with roles |
| `chart_of_accounts` | Account hierarchy |
| `journal_entries` | Transaction headers |
| `journal_entry_lines` | Transaction details |
| `fiscal_periods` | Accounting periods |

### Revenue/AR

| Table | Description |
|-------|-------------|
| `customers` | Customer records |
| `invoices` | Sales invoices |
| `invoice_line_items` | Invoice details |
| `invoice_payments` | Payment records |

### Expenses/AP

| Table | Description |
|-------|-------------|
| `vendors` | Vendor records |
| `bills` | Vendor bills |
| `bill_line_items` | Bill details |
| `bill_payments` | Payment records |
| `expenses` | Direct expenses |

### Inventory

| Table | Description |
|-------|-------------|
| `inventory_items` | Products/services |
| `inventory_transactions` | Stock movements |

### Assets

| Table | Description |
|-------|-------------|
| `fixed_assets` | Asset register |
| `asset_depreciation` | Depreciation records |

### Banking

| Table | Description |
|-------|-------------|
| `bank_accounts` | Bank/cash accounts |
| `bank_transactions` | Bank movements |

## 🔐 Security

- Row Level Security (RLS) enabled on all tables
- Role-based access control
- Secure API routes with session validation
- Encrypted payment processing via Stripe

## 💳 Payment Integration

### Stripe Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your API keys from the Dashboard
3. Set up webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
4. Configure webhook events:
   - `payment_intent.succeeded`
   - `checkout.session.completed`

## 📧 Email Integration

### Resend Setup

1. Create a Resend account at [resend.com](https://resend.com)
2. Verify your domain
3. Get your API key
4. Update email sender addresses in `src/lib/email/resend.ts`

## 🎨 Brand Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Navy | `#1e3a5f` | Primary, headers |
| Magenta | `#c41e7f` | Accent, highlights |
| Purple | `#6b2d7b` | Gradients, secondary |

## 📝 Tax Configuration

- **State**: Massachusetts
- **Sales Tax Rate**: 6.25%
- Configurable per invoice

## 🧮 Accounting Standards

- **Method**: Double-entry bookkeeping
- **Inventory Valuation**: FIFO (First In, First Out)
- **Depreciation Methods**:
  - Straight Line
  - Declining Balance
  - Sum of Years Digits

## 📄 License

Private - Sceneside L.L.C © 2024

## 🤝 Support

For technical support or questions, contact the development team.

---

Built with ❤️ for Sceneside L.L.C
