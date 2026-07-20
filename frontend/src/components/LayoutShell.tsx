'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith('/dashboard');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {isDashboard ? (
        children
      ) : (
        <main className="container mx-auto px-4 py-8 pt-24">
          {children}
        </main>
      )}
      <Footer />
    </div>
  );
}
