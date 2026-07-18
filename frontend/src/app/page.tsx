'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  ScanLine, Brain, FlaskConical, Shield, 
  BarChart3, Sparkles, ArrowRight, CheckCircle2 
} from 'lucide-react';

const features = [
  {
    icon: ScanLine,
    title: 'Product Scanner',
    description: 'Scan barcodes, upload images, or paste ingredients for instant analysis.',
    href: '/scan',
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: Brain,
    title: 'Fuzzy Logic Engine',
    description: 'Advanced decision engine using soft computing for personalized suitability scores.',
    href: '/fuzzy-logic',
    color: 'from-purple-500 to-indigo-500',
  },
  {
    icon: FlaskConical,
    title: 'Scientific Analysis',
    description: 'Evidence-based ingredient analysis with PubMed references and EWG scores.',
    href: '/analyze',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Shield,
    title: 'Safety Verification',
    description: 'Identify harmful ingredients, allergens, and endocrine disruptors.',
    href: '/analyze',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: BarChart3,
    title: 'Product Comparison',
    description: 'Compare products side-by-side with fuzzy suitability scoring.',
    href: '/compare',
    color: 'from-orange-500 to-amber-500',
  },
  {
    icon: Sparkles,
    title: 'AI Beauty Assistant',
    description: 'Get personalized explanations in simple, non-technical language.',
    href: '/fuzzy-logic',
    color: 'from-violet-500 to-purple-500',
  },
];

const steps = [
  { step: '01', title: 'Scan or Search', description: 'Upload a product image, scan barcode, or search by name.' },
  { step: '02', title: 'AI Analysis', description: 'Our fuzzy logic engine analyzes 15+ factors for your profile.' },
  { step: '03', title: 'Get Results', description: 'Receive personalized suitability scores with scientific evidence.' },
  { step: '04', title: 'Make Choices', description: 'Shop confidently with data-backed recommendations.' },
];

export default function Home() {
  return (
    <div className="space-y-20 pb-20">
      {/* Hero */}
      <section className="text-center pt-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="gradient-text">Cosmetic</span>
            <span className="text-gray-900">IQ</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-8">
            AI-powered cosmetic safety platform using{' '}
            <span className="text-pink-600">Fuzzy Logic</span> and{' '}
            <span className="text-purple-600">Scientific Analysis</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/scan" className="glass-button text-lg inline-flex items-center justify-center">
              Scan Product
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link href="/analyze" className="px-8 py-3 rounded-xl font-semibold text-gray-700 border border-gray-300 hover:bg-gray-100 transition-all text-center">
              Analyze Ingredients
            </Link>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-12 flex flex-wrap justify-center gap-6 text-gray-500">
          {['50+ Fuzzy Rules', '10,000+ Ingredients', 'PubMed Verified', 'EWG Scores'].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span>{item}</span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Powerful Features</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">Everything you need to make informed cosmetic choices, backed by science and AI.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div key={feature.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}>
              <Link href={feature.href} className="block glass-card h-full">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500">{feature.description}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">Our unique approach combines fuzzy logic with AI for scientifically-backed recommendations.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div key={step.step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.15 }} className="text-center">
              <div className="text-6xl font-bold gradient-text opacity-50 mb-4">{step.step}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-gray-500">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="glass p-12 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Ready to Transform Your Skincare Routine?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">Join thousands of users making smarter cosmetic choices with AI-powered analysis.</p>
          <Link href="/register" className="glass-button text-lg inline-flex items-center">
            Get Started Free
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
