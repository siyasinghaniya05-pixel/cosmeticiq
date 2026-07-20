'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  User, Package, Shield, TrendingUp,
  AlertTriangle, Calendar, DollarSign, Sparkles,
  ArrowRight, Clock, Heart, Plus, Clipboard, Eye
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [profile, setProfile] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAppStore();

  useEffect(() => {
    const tk = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
    if (!tk) {
      router.push('/login');
      return;
    }
    const headers = { Authorization: `Bearer ${tk}` };
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

    (async () => {
      try {
        const [profileRes, dashRes] = await Promise.allSettled([
          fetch(`${API}/users/profile`, { headers }),
          fetch(`${API}/users/dashboard`, { headers }),
        ]);

        const profileResult = profileRes.status === 'fulfilled' ? profileRes.value : null;
        if (profileResult && profileResult.status === 401) {
          localStorage.removeItem('token');
          router.push('/login');
          return;
        }

        if (profileResult && profileResult.ok) {
          const pData = await profileResult.json();
          if (pData && pData.skin_type) {
            setProfile(pData);
          }
        }

        if (dashRes.status === 'fulfilled' && dashRes.value.ok) {
          const dData = await dashRes.value.json();
          setDashboardData(dData);
        }
      } catch (e) {
      } finally {
        setLoading(false);
      }
    })();
  }, [token, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-20 h-20 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-pink-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Welcome to CosmeticIQ</h1>
          <p className="text-gray-500 text-lg mb-8">
            Complete your skin profile to get personalized AI-powered recommendations
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: Clipboard,
              title: 'Complete Profile',
              desc: 'Tell us about your skin type, concerns, and preferences',
              href: '/profile?setup=true',
              color: 'from-pink-500 to-rose-500',
            },
            {
              icon: Eye,
              title: 'Scan Products',
              desc: 'Use camera or search to analyze any cosmetic product',
              href: '/scan',
              color: 'from-purple-500 to-indigo-500',
            },
            {
              icon: Shield,
              title: 'Check Safety',
              desc: 'Verify ingredient safety with our fuzzy logic engine',
              href: '/analyze',
              color: 'from-green-500 to-emerald-500',
            },
          ].map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Link href={item.href} className="glass p-6 block hover:border-gray-200 transition-all group h-full">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${item.color} flex items-center justify-center mb-4`}>
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-gray-900 font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm mb-4">{item.desc}</p>
                <span className="text-pink-400 text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                  Get Started <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="glass p-6 text-center"
        >
          <p className="text-gray-500 text-sm">
            Your dashboard will show skin health tracking, product recommendations, routine management, and safety alerts once you complete your profile.
          </p>
        </motion.div>
      </div>
    );
  }

  const skin = dashboardData?.skin_profile || {};
  const budget = dashboardData?.budget_tracker || {};
  const weekly = dashboardData?.weekly_analysis || {};
  const monthly = dashboardData?.monthly_improvement || {};
  const warnings = dashboardData?.warnings || [];

  const skinScore = Math.round(
    ((weekly.hydration || 78) + (weekly.clarity || 82) + (100 - (weekly.sensitivity || 25))) / 3
  );

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-gray-500 mt-1">
            {skin.skin_type ? `${skin.skin_type.charAt(0).toUpperCase() + skin.skin_type.slice(1)} skin` : 'Your'} skincare overview
          </p>
        </div>
        <Link href="/profile" className="glass-button flex items-center gap-2">
          <User className="w-4 h-4" />
          Edit Profile
        </Link>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Skin Score', value: `${skinScore}/100`, icon: Sparkles, color: 'text-pink-400', bg: 'from-pink-500/20 to-rose-500/20' },
          { label: 'Products Tracked', value: String(dashboardData?.current_products?.length || 0), icon: Package, color: 'text-purple-400', bg: 'from-purple-500/20 to-indigo-500/20' },
          { label: 'Safety Alerts', value: String(warnings.length || 0), icon: AlertTriangle, color: 'text-yellow-400', bg: 'from-yellow-500/20 to-orange-500/20' },
          { label: 'Monthly Budget', value: `$${budget.monthly_budget || 0}`, icon: DollarSign, color: 'text-green-400', bg: 'from-green-500/20 to-emerald-500/20' },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass-card"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-gray-500 text-sm">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['overview', 'skin type', 'budget', 'warnings'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl capitalize whitespace-nowrap transition-all ${
              activeTab === tab
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                : 'glass text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Analysis */}
          <div className="glass p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Weekly Skin Analysis
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Hydration', value: weekly.hydration || 78, color: 'bg-blue-500' },
                { label: 'Clarity', value: weekly.clarity || 82, color: 'bg-green-500' },
                { label: 'Sensitivity', value: weekly.sensitivity || 25, color: 'bg-yellow-500', invert: true },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">{item.label}</span>
                    <span className="text-gray-900 font-medium">{item.value}{item.invert ? '' : '%'}</span>
                  </div>
                  <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: `${item.invert ? 100 - item.value : item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            {monthly && (
              <div className="mt-4 pt-4 border-t border-gray-200 text-sm">
                <p className="text-gray-500">Monthly changes:</p>
                <p className="text-green-400">Hydration {monthly.hydration_change}, Clarity {monthly.clarity_change}, Sensitivity {monthly.sensitivity_change}</p>
              </div>
            )}
          </div>

          {/* Skin Profile */}
          <div className="glass p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-400" />
              Your Skin Profile
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between p-3 glass-card">
                <span className="text-gray-500">Skin Type</span>
                <span className="text-gray-900 font-medium capitalize">{skin.skin_type || 'Not set'}</span>
              </div>
              <div className="flex justify-between p-3 glass-card">
                <span className="text-gray-500">Age</span>
                <span className="text-gray-900 font-medium">{skin.age || 'Not set'}</span>
              </div>
              <div className="flex justify-between p-3 glass-card">
                <span className="text-gray-500">Concerns</span>
                <span className="text-gray-900 font-medium">
                  {skin.concerns?.length > 0 ? skin.concerns.join(', ') : 'None'}
                </span>
              </div>
            </div>
            <Link href="/scan" className="glass-button mt-4 w-full flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" />
              Analyze a Product
            </Link>
          </div>

          {/* Budget Tracker */}
          <div className="glass p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              Budget Tracker
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Monthly Budget</span>
                  <span className="text-gray-900">${budget.monthly_budget || 0}</span>
                </div>
                <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500"
                    style={{ width: `${budget.monthly_budget ? Math.min(((budget.spent || 0) / budget.monthly_budget) * 100, 100) : 0}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  ${budget.spent || 0} spent / ${budget.remaining || budget.monthly_budget || 0} remaining
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="glass-card p-3">
                  <p className="text-2xl font-bold text-gray-900">${budget.total_saved || 0}</p>
                  <p className="text-gray-500 text-sm">Total Saved</p>
                </div>
                <div className="glass-card p-3">
                  <p className="text-2xl font-bold text-gray-900">{dashboardData?.current_products?.length || 0}</p>
                  <p className="text-gray-500 text-sm">Products Tracked</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ArrowRight className="w-5 h-5 text-purple-400" />
              Quick Actions
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Scan Product', desc: 'Use camera or upload an image', href: '/scan', icon: Eye },
                { label: 'Compare Products', desc: 'Side-by-side comparison', href: '/compare', icon: Package },
                { label: 'Analyze Ingredients', desc: 'Check ingredient safety', href: '/analyze', icon: Shield },
                { label: 'Check Claims', desc: 'Verify influencer claims', href: '/claims', icon: AlertTriangle },
              ].map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-3 p-3 glass-card hover:border-gray-200 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-pink-500/20 to-purple-500/20 flex items-center justify-center">
                    <action.icon className="w-5 h-5 text-pink-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 text-sm font-medium">{action.label}</p>
                    <p className="text-gray-500 text-xs">{action.desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-pink-400 transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'skin type' && (
        <div className="glass p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pink-400" />
            Skin Type Details
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {[
              { type: 'dry', label: 'Dry', emoji: '🏜️' },
              { type: 'oily', label: 'Oily', emoji: '💧' },
              { type: 'combination', label: 'Combination', emoji: '🎭' },
              { type: 'sensitive', label: 'Sensitive', emoji: '🌸' },
              { type: 'acne_prone', label: 'Acne-Prone', emoji: '⚡' },
              { type: 'normal', label: 'Normal', emoji: '✨' },
            ].map((t) => (
              <div
                key={t.type}
                className={`p-4 rounded-xl text-center ${
                  skin.skin_type === t.type
                    ? 'bg-gradient-to-r from-pink-500/30 to-purple-500/30 border-2 border-pink-500'
                    : 'glass-card opacity-50'
                }`}
              >
                <span className="text-2xl">{t.emoji}</span>
                <p className="text-gray-900 font-medium mt-2">{t.label}</p>
              </div>
            ))}
          </div>
          {skin.concerns?.length > 0 && (
            <div>
              <h4 className="text-gray-900 font-medium mb-3">Your Concerns</h4>
              <div className="flex flex-wrap gap-2">
                {skin.concerns.map((c: string) => (
                  <span key={c} className="px-3 py-1 bg-pink-500/20 text-pink-300 rounded-full text-sm">{c}</span>
                ))}
              </div>
            </div>
          )}
          <Link href="/profile" className="glass-button mt-6 inline-flex items-center gap-2">
            <User className="w-4 h-4" />
            Update Profile
          </Link>
        </div>
      )}

      {activeTab === 'budget' && (
        <div className="glass p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            Budget Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="glass-card p-4 text-center">
              <p className="text-3xl font-bold text-gray-900">${budget.monthly_budget || 0}</p>
              <p className="text-gray-500 text-sm">Monthly Budget</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-3xl font-bold text-yellow-400">${budget.spent || 0}</p>
              <p className="text-gray-500 text-sm">Spent</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-3xl font-bold text-green-400">${budget.remaining || budget.monthly_budget || 0}</p>
              <p className="text-gray-500 text-sm">Remaining</p>
            </div>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-green-400">${budget.total_saved || 0}</p>
            <p className="text-gray-500 text-sm">Total Saved with CosmeticIQ</p>
          </div>
        </div>
      )}

      {activeTab === 'warnings' && (
        <div className="space-y-4">
          {warnings.length === 0 ? (
            <div className="glass p-12 text-center">
              <Shield className="w-16 h-16 text-green-500/50 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">All Clear</h3>
              <p className="text-gray-500">No safety alerts for your products</p>
            </div>
          ) : (
            warnings.map((warn: any, idx: number) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="glass p-4 border-l-4 border-yellow-500"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <p className="text-gray-900">{typeof warn === 'string' ? warn : warn.message || 'Alert'}</p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
