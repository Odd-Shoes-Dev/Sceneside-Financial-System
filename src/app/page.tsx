import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <nav className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-3">
            <Image
              src="/Sceneside assets/Sceneside_logo.png"
              alt="Sceneside Logo"
              width={96}
              height={96}
              className="rounded-lg"
            />
            <span className="text-2xl font-bold text-sceneside-navy">Sceneside L.L.C</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sceneside-navy/80 hover:text-sceneside-navy transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="btn bg-sceneside-purple text-white hover:bg-sceneside-purple/90"
            >
              Get Started
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-sceneside-navy mb-6">
            Financial Management
            <br />
            <span className="text-sceneside-purple">Made Simple</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Complete accounting and financial management system for Sceneside L.L.C.
            Track invoices, manage expenses, monitor inventory, and generate reports.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="btn btn-lg bg-sceneside-navy text-white hover:bg-sceneside-navy/90 w-full sm:w-auto"
            >
              Access Dashboard
            </Link>
            <Link
              href="#features"
              className="btn btn-lg bg-white text-sceneside-navy hover:bg-gray-50 border border-sceneside-navy/30 w-full sm:w-auto"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div id="features" className="mt-24 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="w-12 h-12 bg-sceneside-purple/10 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-sceneside-purple" />
              </div>
              <h3 className="text-lg font-semibold text-sceneside-navy mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Company Info */}
        <div className="mt-24 text-center">
          <div className="bg-gray-50 rounded-xl p-8 max-w-md mx-auto border border-gray-200">
            <Image
              src="/Sceneside assets/Sceneside_logo_name.png"
              alt="Sceneside L.L.C"
              width={200}
              height={80}
              className="mx-auto mb-6"
            />
            <div className="text-gray-600 text-sm space-y-1">
              <p>231 River St, Waltham, MA 02453</p>
              <p>Phone: 857-384-2899</p>
              <p>EIN: 99-3334108</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Sceneside L.L.C. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}

const features = [
  {
    title: 'General Ledger',
    description: 'Double-entry bookkeeping with automatic posting from all modules.',
    icon: BookIcon,
  },
  {
    title: 'Invoicing & AR',
    description: 'Create invoices, track payments, and manage customer receivables.',
    icon: InvoiceIcon,
  },
  {
    title: 'Bills & AP',
    description: 'Record bills, schedule payments, and manage vendor payables.',
    icon: BillIcon,
  },
  {
    title: 'Inventory',
    description: 'Track stock levels, manage products, and monitor movements.',
    icon: InventoryIcon,
  },
  {
    title: 'Fixed Assets',
    description: 'Register assets, calculate depreciation, and track disposals.',
    icon: AssetIcon,
  },
  {
    title: 'Reports & Analytics',
    description: 'Generate financial statements, aging reports, and dashboards.',
    icon: ChartIcon,
  },
];

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

function InvoiceIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function BillIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function InventoryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

function AssetIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}
