import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'KVO Box Cricket Tournament Scoring System',
  description: 'Live scoring, points table, custom PDF rules engine and player statistics for local box cricket tournament.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
