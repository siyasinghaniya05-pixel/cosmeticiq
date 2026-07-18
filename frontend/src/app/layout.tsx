import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CosmeticIQ - AI-Powered Cosmetic Safety Platform',
  description: 'Choose safe and suitable cosmetic products with AI-powered ingredient analysis and fuzzy logic decision engine.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
          <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="container mx-auto px-4 py-8 pt-24">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
