'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, FlaskConical, Brain, Stethoscope,
  User, DollarSign, TrendingUp, Award, ChevronDown,
  ArrowUp, ArrowDown, Search, Loader2,
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const SKIN_TYPES = [
  'dry', 'oily', 'combination', 'sensitive', 'acne_prone', 'normal',
];

const FACTOR_META: Record<string, { icon: any; label: string; color: string }> = {
  science:        { icon: FlaskConical,  label: 'Scientific Evidence',  color: 'from-blue-500 to-cyan-500' },
  safety:         { icon: ShieldCheck,   label: 'Ingredient Safety',    color: 'from-green-500 to-emerald-500' },
  fuzzy_logic:    { icon: Brain,         label: 'Fuzzy Logic Match',    color: 'from-purple-500 to-violet-500' },
  dermatologist:  { icon: Stethoscope,   label: 'Dermatologist Score',  color: 'from-pink-500 to-rose-500' },
  user_profile:   { icon: User,          label: 'User Profile Match',   color: 'from-orange-500 to-amber-500' },
  value:          { icon: DollarSign,    label: 'Price Value',          color: 'from-teal-500 to-emerald-500' },
};

function getGrade(score: number) {
  if (score >= 90) return { grade: 'A+', label: 'Excellent Product', color: 'bg-emerald-100 text-emerald-700' };
  if (score >= 80) return { grade: 'A', label: 'Excellent Product', color: 'bg-green-100 text-green-700' };
  if (score >= 70) return { grade: 'B', label: 'Very Good', color: 'bg-blue-100 text-blue-700' };
  if (score >= 60) return { grade: 'C', label: 'Good', color: 'bg-yellow-100 text-yellow-700' };
  if (score >= 50) return { grade: 'D', label: 'Average', color: 'bg-orange-100 text-orange-700' };
  return { grade: 'F', label: 'Needs Improvement', color: 'bg-red-100 text-red-700' };
}

function getScoreColor(score: number) {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#3b82f6';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
}

function useCountUp(target: number, duration = 1500) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    let start = 0;
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.round(eased * target);
      setValue(start);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return value;
}

interface ScoreResult {
  total_score: number;
  factors: Record<string, { score: number; weight: number; contribution: number; description?: string }>;
  grade: string;
  trust_badge: string;
  comparison?: {
    vs_category_avg?: { difference: number; percentage: number };
    vs_best_in_class?: { percentage: number };
    rank_estimate?: number;
  };
}

interface LeaderboardItem {
  product_name: string;
  score: number;
  grade: string;
}

interface HowItWorksFactor {
  name: string;
  weight: number;
  description: string;
  icon: string;
}

export default function TrustScorePage() {
  const [form, setForm] = useState({
    product_name: '',
    brand: '',
    ingredients: '',
    scientific_references: 0,
    safety_score: 5,
    dermatologist_approved: false,
    user_skin_type: 'normal',
    user_age: 30,
    price: 0,
    category_avg_price: 0,
  });
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [leaderboard, setLeaderboard] = useState<{ top: LeaderboardItem[]; bottom: LeaderboardItem[]; average_score: number } | null>(null);
  const [howItWorks, setHowItWorks] = useState<HowItWorksFactor[] | null>(null);
  const [expandedFactor, setExpandedFactor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const displayScore = useCountUp(result?.total_score ?? 0);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch(`${API}/trust-score/leaderboard`);
      if (res.ok) setLeaderboard(await res.json());
    } catch {}
  }, []);

  const fetchHowItWorks = useCallback(async () => {
    try {
      const res = await fetch(`${API}/trust-score/how-it-works`);
      if (res.ok) setHowItWorks(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    fetchLeaderboard();
    fetchHowItWorks();
  }, [fetchLeaderboard, fetchHowItWorks]);

  const calculate = async () => {
    if (!form.product_name.trim()) return;
    setIsCalculating(true);
    setError(null);
    setResult(null);
    try {
      const body: Record<string, any> = { product_name: form.product_name };
      if (form.brand) body.brand = form.brand;
      if (form.ingredients) body.ingredients = form.ingredients.split(',').map(i => i.trim()).filter(Boolean);
      if (form.scientific_references > 0) body.scientific_references = form.scientific_references;
      body.safety_score = form.safety_score;
      body.dermatologist_approved = form.dermatologist_approved;
      body.user_skin_type = form.user_skin_type;
      body.user_age = form.user_age;
      if (form.price > 0) body.price = form.price;
      if (form.category_avg_price > 0) body.category_avg_price = form.category_avg_price;

      const res = await fetch(`${API}/trust-score/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server error ${res.status}`);
      }
      setResult(await res.json());
    } catch (err: any) {
      setError(err.message || 'Calculation failed');
    } finally {
      setIsCalculating(false);
    }
  };

  const sortedFactors = result
    ? Object.entries(result.factors)
        .sort(([, a], [, b]) => (b.contribution ?? 0) - (a.contribution ?? 0))
    : [];

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      {/* ===== HERO ===== */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-3xl p-10 md:p-16 text-center"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-600 opacity-90" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-40" />
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 7, repeat: Infinity }}
          className="absolute -bottom-20 -left-20 w-96 h-96 bg-purple-300/10 rounded-full blur-3xl"
        />
        <div className="relative z-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-6"
          >
            <ShieldCheck className="w-12 h-12 text-white" />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            CosmeticIQ Trust Score
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
            Every product scored out of 100. Powered by science, ingredients, fuzzy logic, and real dermatologist data.
          </p>
        </div>
      </motion.section>

      {/* ===== CALCULATOR ===== */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="glass-card">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Search className="w-6 h-6 text-purple-500" />
            Score Calculator
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
              <input
                type="text"
                value={form.product_name}
                onChange={e => setForm({ ...form, product_name: e.target.value })}
                placeholder="e.g. CeraVe Moisturizing Cream"
                className="input-glass"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
              <input
                type="text"
                value={form.brand}
                onChange={e => setForm({ ...form, brand: e.target.value })}
                placeholder="e.g. CeraVe"
                className="input-glass"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Ingredients (comma separated)</label>
              <textarea
                value={form.ingredients}
                onChange={e => setForm({ ...form, ingredients: e.target.value })}
                placeholder="e.g. Water, Glycerin, Ceramide NP, Hyaluronic Acid"
                className="input-glass h-24 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scientific References</label>
              <input
                type="number"
                min={0}
                value={form.scientific_references}
                onChange={e => setForm({ ...form, scientific_references: +e.target.value })}
                className="input-glass"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Safety Score: {form.safety_score}/10
              </label>
              <input
                type="range"
                min={0}
                max={10}
                step={0.5}
                value={form.safety_score}
                onChange={e => setForm({ ...form, safety_score: +e.target.value })}
                className="w-full accent-purple-500"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Hazardous</span><span>Safe</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dermatologist Approved</label>
              <button
                type="button"
                onClick={() => setForm({ ...form, dermatologist_approved: !form.dermatologist_approved })}
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 ${
                  form.dermatologist_approved ? 'bg-gradient-to-r from-pink-500 to-purple-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-300 ${
                    form.dermatologist_approved ? 'translate-x-8' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Skin Type</label>
              <select
                value={form.user_skin_type}
                onChange={e => setForm({ ...form, user_skin_type: e.target.value })}
                className="input-glass"
              >
                {SKIN_TYPES.map(t => (
                  <option key={t} value={t}>{t.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Age</label>
              <input
                type="number"
                min={13}
                max={100}
                value={form.user_age}
                onChange={e => setForm({ ...form, user_age: +e.target.value })}
                className="input-glass"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.price || ''}
                  onChange={e => setForm({ ...form, price: +e.target.value })}
                  className="input-glass pl-8"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category Average Price</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.category_avg_price || ''}
                  onChange={e => setForm({ ...form, category_avg_price: +e.target.value })}
                  className="input-glass pl-8"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <button
            onClick={calculate}
            disabled={isCalculating || !form.product_name.trim()}
            className="glass-button w-full mt-8 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCalculating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Calculating Trust Score…
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                Calculate Trust Score
              </>
            )}
          </button>
        </div>
      </motion.section>

      {/* ===== ERROR ===== */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card border-red-300 text-red-600 text-center"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== SHIMMER LOADING ===== */}
      <AnimatePresence>
        {isCalculating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="glass-card overflow-hidden">
              <div className="h-48 flex items-center justify-center">
                <div className="relative w-full h-full">
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== SCORE RESULT ===== */}
      <AnimatePresence>
        {result && !isCalculating && (
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6 }}
            className="space-y-10"
          >
            {/* Gauge */}
            <div className="glass-card flex flex-col items-center py-12">
              <div className="relative w-64 h-64">
                <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
                  <circle cx="100" cy="100" r="85" fill="none" stroke="#f3f4f6" strokeWidth="14" />
                  <motion.circle
                    cx="100"
                    cy="100"
                    r="85"
                    fill="none"
                    stroke={getScoreColor(result.total_score)}
                    strokeWidth="14"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 85}
                    initial={{ strokeDashoffset: 2 * Math.PI * 85 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 85 * (1 - result.total_score / 100) }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-extrabold text-gray-900">{displayScore}</span>
                  <span className="text-gray-400 text-sm">/100</span>
                </div>
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-6 text-center space-y-2"
              >
                <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold ${getGrade(result.total_score).color}`}>
                  Grade: {result.grade || getGrade(result.total_score).grade}
                </span>
                <p className="text-lg font-semibold text-gray-700">
                  {result.trust_badge || getGrade(result.total_score).label}
                </p>
              </motion.div>
            </div>

            {/* ===== BREAKDOWN ===== */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-purple-500" />
                Score Breakdown
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {sortedFactors.map(([key, factor], idx) => {
                  const meta = FACTOR_META[key] || { icon: ShieldCheck, label: key, color: 'from-gray-500 to-gray-400' };
                  const Icon = meta.icon;
                  const isExpanded = expandedFactor === key;
                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      className="glass-card group cursor-pointer"
                      onClick={() => setExpandedFactor(isExpanded ? null : key)}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${meta.color} flex items-center justify-center shadow-sm`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">{meta.label}</h3>
                          <p className="text-xs text-gray-400">Weight: {Math.round((factor.weight ?? 0) * 100)}%</p>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </div>

                      <div className="safety-meter mb-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${factor.score}%` }}
                          transition={{ duration: 0.8, delay: idx * 0.08 + 0.3 }}
                          className={`safety-meter-fill bg-gradient-to-r ${meta.color}`}
                        />
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-900 font-bold">{Math.round(factor.score)}/100</span>
                        <span className="text-gray-400">+{Math.round(factor.contribution)} pts</span>
                      </div>

                      <AnimatePresence>
                        {isExpanded && factor.description && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100 leading-relaxed">
                              {factor.description}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* ===== COMPARISON ===== */}
            {result.comparison && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Award className="w-6 h-6 text-purple-500" />
                  How It Compares
                </h2>
                <div className="glass-card">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {result.comparison.vs_category_avg && (
                      <div className="text-center p-4 rounded-xl bg-gray-50">
                        <p className="text-xs text-gray-400 mb-1">vs Category Average</p>
                        <div className={`flex items-center justify-center gap-1 text-2xl font-bold ${
                          result.comparison.vs_category_avg.difference >= 0 ? 'text-emerald-600' : 'text-red-500'
                        }`}>
                          {result.comparison.vs_category_avg.difference >= 0
                            ? <ArrowUp className="w-5 h-5" />
                            : <ArrowDown className="w-5 h-5" />}
                          {Math.abs(result.comparison.vs_category_avg.percentage ?? 0).toFixed(1)}%
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {result.comparison.vs_category_avg.difference >= 0 ? 'Above' : 'Below'} average
                        </p>
                      </div>
                    )}
                    {result.comparison.vs_best_in_class && (
                      <div className="text-center p-4 rounded-xl bg-gray-50">
                        <p className="text-xs text-gray-400 mb-1">vs Best-in-Class</p>
                        <div className="text-2xl font-bold text-blue-600">
                          {(100 - (result.comparison.vs_best_in_class.percentage ?? 0)).toFixed(1)}%
                        </div>
                        <p className="text-xs text-gray-400 mt-1">of top score</p>
                      </div>
                    )}
                    {result.comparison.rank_estimate != null && (
                      <div className="text-center p-4 rounded-xl bg-gray-50">
                        <p className="text-xs text-gray-400 mb-1">Estimated Rank</p>
                        <div className="text-2xl font-bold text-purple-600">
                          #{result.comparison.rank_estimate}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">in category</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      {/* ===== LEADERBOARD ===== */}
      {leaderboard && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-purple-500" />
            Leaderboard
          </h2>
          <div className="glass-card mb-4 text-center">
            <span className="text-gray-500 text-sm">Average Score: </span>
            <span className="text-2xl font-bold gradient-text">{Math.round(leaderboard.average_score)}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { title: 'Top 10 Products', items: leaderboard.top, highlight: true },
              { title: 'Bottom 10 Products', items: leaderboard.bottom, highlight: false },
            ].map(({ title, items, highlight }) => (
              <div key={title} className="glass-card">
                <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${highlight ? 'text-emerald-600' : 'text-red-500'}`}>
                  {highlight ? <TrendingUp className="w-5 h-5" /> : <TrendingUp className="w-5 h-5 rotate-180" />}
                  {title}
                </h3>
                <div className="space-y-2">
                  {items.map((item, idx) => {
                    const g = getGrade(item.score);
                    return (
                      <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                        <span className="w-7 text-center text-sm font-bold text-gray-400">{idx + 1}</span>
                        <span className="flex-1 text-sm text-gray-900 truncate">{item.product_name}</span>
                        <span className="text-sm font-bold text-gray-700">{Math.round(item.score)}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${g.color}`}>
                          {item.grade || g.grade}
                        </span>
                      </div>
                    );
                  })}
                  {items.length === 0 && (
                    <p className="text-gray-400 text-sm text-center py-4">No data yet</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* ===== HOW IT WORKS ===== */}
      {howItWorks && howItWorks.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-500" />
            How It Works
          </h2>

          {/* Weight pie (CSS) */}
          <div className="glass-card mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 text-center">Factor Weights</h3>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {howItWorks.map((f, idx) => {
                const colors = [
                  'bg-blue-500', 'bg-green-500', 'bg-purple-500',
                  'bg-pink-500', 'bg-orange-500', 'bg-teal-500',
                ];
                return (
                  <div key={idx} className="flex items-center gap-1.5">
                    <span className={`w-3 h-3 rounded-full ${colors[idx % colors.length]}`} />
                    <span className="text-xs text-gray-600">{f.name} ({Math.round(f.weight * 100)}%)</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex h-4 rounded-full overflow-hidden">
              {howItWorks.map((f, idx) => {
                const colors = [
                  'bg-blue-500', 'bg-green-500', 'bg-purple-500',
                  'bg-pink-500', 'bg-orange-500', 'bg-teal-500',
                ];
                return (
                  <motion.div
                    key={idx}
                    initial={{ width: 0 }}
                    animate={{ width: `${f.weight * 100}%` }}
                    transition={{ duration: 0.8, delay: idx * 0.1 }}
                    className={`${colors[idx % colors.length]} h-full`}
                  />
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {howItWorks.map((factor, idx) => {
              const meta = FACTOR_META[factor.name] || { icon: ShieldCheck, label: factor.name, color: 'from-gray-500 to-gray-400' };
              const Icon = meta.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="glass-card"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${meta.color} flex items-center justify-center shadow-sm`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{factor.name}</h3>
                      <p className="text-xs text-gray-400">Weight: {Math.round(factor.weight * 100)}%</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{factor.description}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.section>
      )}

      {/* Hidden shimmer keyframe */}
      <style jsx global>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
