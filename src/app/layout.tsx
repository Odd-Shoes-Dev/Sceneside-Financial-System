import '@/styles/globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Sceneside L.L.C - Financial System',
  description: 'Financial Management System for Sceneside L.L.C',
  icons: {
    icon: [
      { url: '/Sceneside assets/Sceneside_logo.png', sizes: '32x32', type: 'image/png' },
      { url: '/Sceneside assets/Sceneside_logo.png', sizes: '16x16', type: 'image/png' },
      { url: '/Sceneside assets/Sceneside_logo.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/Sceneside assets/Sceneside_logo.png', sizes: '180x180', type: 'image/png' }],
    shortcut: '/Sceneside assets/Sceneside_logo.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Sceneside Financial',
  },
};

export const viewport: Viewport = {
  themeColor: '#52b53b',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Sceneside Financial" />
        <link rel="apple-touch-icon" href="/Sceneside assets/Sceneside_logo.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/Sceneside assets/Sceneside_logo.png" />
        <link rel="apple-touch-startup-image" href="/Sceneside assets/Sceneside_logo.png" />
      </head>
      <body className={inter.className}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e3a5f',
              color: '#fff',
            },
            success: {
              style: {
                background: '#059669',
              },
            },
            error: {
              style: {
                background: '#dc2626',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
