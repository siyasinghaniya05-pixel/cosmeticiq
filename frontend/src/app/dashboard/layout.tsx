'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, ScanLine, BarChart3, FlaskConical, BrainCircuit,
  User, Calendar, TrendingUp, BookOpen, Heart, Settings, Sparkles,
  LogOut, ChevronLeft, ShieldCheck, Bell
} from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '@/lib/store';

const sidebarItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/scan', icon: ScanLine, label: 'Scan Product' },
  { href: '/compare', icon: BarChart3, label: 'Compare' },
  { href: '/analyze', icon: FlaskConical, label: 'Analyze' },
  { href: '/beauty-coach', icon: BrainCircuit, label: 'AI Coach' },
  { href: '/profile', icon: User, label: 'Profile' },
  { href: '/dashboard', icon: Calendar, label: 'Routine' },
  { href: '/dashboard', icon: TrendingUp, label: 'Progress' },
  { href: '/knowledge-graph', icon: BookOpen, label: 'Library' },
  { href: '/community', icon: Heart, label: 'Wishlist' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAppStore();

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="sticky top-24 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 flex flex-col shrink-0 overflow-hidden"
      >
        {/* Collapse toggle */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          {!collapsed && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Menu
            </motion.span>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
            <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {sidebarItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.label + item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  active
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md shadow-pink-500/20'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}>
                <item.icon className={`w-5 h-5 shrink-0 ${active ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} />
                {!collapsed && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="truncate">
                    {item.label}
                  </motion.span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-gray-100 p-3 space-y-2">
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-3 border border-pink-100">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-pink-500" />
                <span className="text-xs font-semibold text-gray-700">AI Coach</span>
              </div>
              <p className="text-[11px] text-gray-500 mb-2">Get personalized skincare advice</p>
              <Link href="/beauty-coach" className="block text-center text-[11px] font-medium text-pink-600 hover:text-pink-700">
                Start Chat →
              </Link>
            </motion.div>
          )}
          <Link href="/" onClick={() => logout()}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all">
            <LogOut className="w-5 h-5 shrink-0 text-gray-400" />
            {!collapsed && <span>Sign Out</span>}
          </Link>
        </div>
      </motion.aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 p-8 pt-4">
        {children}
      </main>
    </div>
  );
}
