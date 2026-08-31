import type { Metadata, Viewport } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import PWARegister from '@/components/PWARegister';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Yearbook — Daily Photo Timelapse & Creative Studio PWA',
  description:
    'Capture daily photos, auto-align eyes and faces, add Snapchat-style captions, create multiple yearbooks, and generate seamless timelapse videos with MongoDB cloud sync.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icons/favicon.png',
    apple: '/icons/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Yearbook',
  },
};

export const viewport: Viewport = {
  themeColor: '#fbf9f5',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} h-full`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body className="min-h-full bg-[#fbf9f5] text-[#1c1917] antialiased selection:bg-amber-500/20 selection:text-amber-900 font-sans flex flex-col">
        {children}
        <PWARegister />
      </body>
    </html>
  );
}
