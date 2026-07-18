'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Shield, Users, Package, FlaskConical,
  Brain, AlertTriangle, BarChart3, Settings,
  TrendingUp, Activity, Eye, Edit, Trash2
} from 'lucide-react';

const stats = [
  { label: 'Total Products', value: '12,450', change: '+230', icon: Package, color: 'text-blue-400' },
  { label: 'Total Users', value: '8,923', change: '+156', icon: Users, color: 'text-green-400' },
  { label: 'Ingredients DB', value: '10,234', change: '+45', icon: FlaskConical, color: 'text-purple-400' },
  { label: 'Active Claims', value: '456', change: '+12', icon: AlertTriangle, color: 'text-yellow-400' },
];

const recentProducts = [
  { id: 1, name: 'Advanced Retinol Serum', brand: 'SkinCeuticals', safety: 85, status: 'approved' },
  { id: 2, name: 'Gentle Foaming Cleanser', brand: 'CeraVe', safety: 92, status: 'approved' },
  { id: 3, name: 'Unknown Brand Moisturizer', brand: 'Generic', safety: 34, status: 'flagged' },
  { id: 4, name: 'Organic Face Oil', brand: 'The Ordinary', safety: 88, status: 'approved' },
  { id: 5, name: 'Cheap Foundation', brand: 'BargainBrand', safety: 28, status: 'flagged' },
];

const recentFlags = [
  { product: 'Cheap Foundation', reason: 'Contains lead and mercury', severity: 'high', date: '2 hours ago' },
  { product: 'Unknown Brand Moisturizer', reason: 'Undisclosed parabens', severity: 'medium', date: '5 hours ago' },
  { product: 'Whitening Cream', reason: 'Contains hydroquinone above safe limits', severity: 'high', date: '1 day ago' },
];

const tabs = ['overview', 'products', 'ingredients', 'rules', 'users', 'flags'];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="w-10 h-10 text-pink-400" />
            Admin Panel
          </h1>
          <p className="text-gray-500 mt-1">Manage products, ingredients, and rules</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
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

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="glass-card"
              >
                <div className="flex items-center justify-between mb-3">
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                  <span className="text-green-400 text-sm flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {stat.change}
                  </span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-gray-500 text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Flagged Products */}
            <div className="glass p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Recent Flags
              </h3>
              <div className="space-y-3">
                {recentFlags.map((flag, idx) => (
                  <div key={idx} className="p-3 glass-card">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-gray-900 font-medium">{flag.product}</p>
                        <p className="text-gray-500 text-sm">{flag.reason}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        flag.severity === 'high'
                          ? 'bg-red-500/20 text-red-300'
                          : 'bg-yellow-500/20 text-yellow-300'
                      }`}>
                        {flag.severity}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs mt-2">{flag.date}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="glass p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Add Product', icon: Package, href: '/admin/products/new' },
                  { label: 'Add Ingredient', icon: FlaskConical, href: '/admin/ingredients/new' },
                  { label: 'Add Rule', icon: Brain, href: '/admin/rules/new' },
                  { label: 'View Reports', icon: BarChart3, href: '/admin/reports' },
                  { label: 'Manage Users', icon: Users, href: '/admin/users' },
                  { label: 'System Settings', icon: Settings, href: '/admin/settings' },
                ].map((action) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="glass-card flex items-center gap-3 text-gray-600 hover:text-gray-900"
                  >
                    <action.icon className="w-5 h-5 text-purple-400" />
                    <span>{action.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="glass p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Product Management</h3>
            <button className="glass-button text-sm">Add Product</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-3 text-gray-500 font-medium">Product</th>
                  <th className="pb-3 text-gray-500 font-medium">Brand</th>
                  <th className="pb-3 text-gray-500 font-medium">Safety Score</th>
                  <th className="pb-3 text-gray-500 font-medium">Status</th>
                  <th className="pb-3 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentProducts.map((product) => (
                  <tr key={product.id} className="border-b border-gray-200">
                    <td className="py-4 text-gray-900">{product.name}</td>
                    <td className="py-4 text-gray-500">{product.brand}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              product.safety >= 70 ? 'bg-green-500' :
                              product.safety >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${product.safety}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{product.safety}%</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        product.status === 'approved'
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <button className="text-gray-500 hover:text-gray-900">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-gray-500 hover:text-gray-900">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="text-gray-500 hover:text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rules Tab */}
      {activeTab === 'rules' && (
        <div className="glass p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Fuzzy Logic Rules</h3>
            <button className="glass-button text-sm">Add Rule</button>
          </div>
          <div className="space-y-4">
            {[
              { id: 1, name: 'Sensitive Skin + High Fragrance', active: true, weight: 1.0 },
              { id: 2, name: 'Dry Skin + Alcohol Present', active: true, weight: 0.9 },
              { id: 3, name: 'Acne Prone + Comedogenic', active: true, weight: 1.0 },
              { id: 4, name: 'High Safety + Strong Evidence', active: true, weight: 0.8 },
              { id: 5, name: 'Budget Low + Safety Unsafe', active: false, weight: 0.7 },
            ].map((rule) => (
              <div key={rule.id} className="flex items-center justify-between p-4 glass-card">
                <div className="flex items-center gap-4">
                  <span className="text-purple-400 font-mono text-sm">#{rule.id}</span>
                  <div>
                    <p className="text-gray-900">{rule.name}</p>
                    <p className="text-gray-500 text-sm">Weight: {rule.weight}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${rule.active ? 'bg-green-400' : 'bg-gray-500'}`} />
                  <button className="text-gray-500 hover:text-gray-900">
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ingredients Tab */}
      {activeTab === 'ingredients' && (
        <div className="glass p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Ingredient Database</h3>
            <button className="glass-button text-sm">Add Ingredient</button>
          </div>
          <p className="text-gray-500 mb-4">
            Manage the ingredient safety database. Currently tracking 10,234 ingredients.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-card text-center">
              <p className="text-3xl font-bold text-green-400">8,456</p>
              <p className="text-gray-500 text-sm">Safe Ingredients</p>
            </div>
            <div className="glass-card text-center">
              <p className="text-3xl font-bold text-yellow-400">1,523</p>
              <p className="text-gray-500 text-sm">Moderate Risk</p>
            </div>
            <div className="glass-card text-center">
              <p className="text-3xl font-bold text-red-400">255</p>
              <p className="text-gray-500 text-sm">Hazardous</p>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="glass p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">User Management</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="glass-card text-center">
              <p className="text-3xl font-bold text-gray-900">8,923</p>
              <p className="text-gray-500 text-sm">Total Users</p>
            </div>
            <div className="glass-card text-center">
              <p className="text-3xl font-bold text-green-400">1,234</p>
              <p className="text-gray-500 text-sm">Active Today</p>
            </div>
            <div className="glass-card text-center">
              <p className="text-3xl font-bold text-purple-400">456</p>
              <p className="text-gray-500 text-sm">New This Week</p>
            </div>
          </div>
        </div>
      )}

      {/* Flags Tab */}
      {activeTab === 'flags' && (
        <div className="glass p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            Product Flags & Reports
          </h3>
          <div className="space-y-4">
            {recentFlags.map((flag, idx) => (
              <div key={idx} className="p-4 glass-card border-l-4 border-red-500">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-900 font-medium">{flag.product}</p>
                    <p className="text-gray-500">{flag.reason}</p>
                    <p className="text-gray-500 text-sm mt-1">{flag.date}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 glass rounded text-sm text-gray-600 hover:text-gray-900">
                      Review
                    </button>
                    <button className="px-3 py-1 bg-red-500/20 rounded text-sm text-red-300 hover:bg-red-500/30">
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
