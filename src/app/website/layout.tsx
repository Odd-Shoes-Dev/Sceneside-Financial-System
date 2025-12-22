import type { Metadata } from 'next';
import StructuredData from '@/components/structured-data';

export const metadata: Metadata = {
  title: {
    default: 'Sceneside L.L.C - Hotels, Car Rentals & Tours Across America',
    template: '%s | Sceneside L.L.C',
  },
  description: 'Discover premium hotels, reliable car rentals, and unforgettable tours across the United States. Your trusted partner for American travel experiences.',
  keywords: ['hotels', 'car rental', 'tours', 'United States travel', 'vacation', 'tourism', 'travel agency', 'American tours'],
  authors: [{ name: 'Sceneside L.L.C' }],
  creator: 'Sceneside L.L.C',
  publisher: 'Sceneside L.L.C',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://sceneside.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Sceneside L.L.C - Hotels, Car Rentals & Tours Across America',
    description: 'Discover premium hotels, reliable car rentals, and unforgettable tours across the United States.',
    siteName: 'Sceneside L.L.C',
    images: [
      {
        url: '/Sceneside%20assets/logo.png',
        width: 1200,
        height: 630,
        alt: 'Sceneside L.L.C',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sceneside L.L.C - Hotels, Car Rentals & Tours',
    description: 'Premium hotels, car rentals, and tours across the United States.',
    images: ['/Sceneside%20assets/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/Sceneside%20assets/logo.png', sizes: '32x32', type: 'image/png' },
      { url: '/Sceneside%20assets/logo.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [{ url: '/Sceneside%20assets/logo.png', sizes: '180x180', type: 'image/png' }],
  },
};

export default function WebsiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <StructuredData />
      {children}
    </>
  );
}
