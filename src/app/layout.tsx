import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'KVO Box Cricket Tournament Scoring System',
  description: 'Live scoring, points table, custom PDF rules engine and player statistics for local box cricket tournament.',
};

export const viewport: Viewport = {
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
    <html lang="en" className="overflow-x-hidden">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen overflow-x-hidden w-full max-w-full">
        {children}
      </body>
    </html>
  );
}
