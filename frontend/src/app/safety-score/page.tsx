'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, AlertTriangle, ChevronDown, ChevronUp, Search,
  Package, Beaker, Award, TrendingUp, Info, Star, ExternalLink,
  Sparkles, CheckCircle2, XCircle,
} from 'lucide-react';
import api from '@/lib/api';

interface IngredientScore {
  id: string; name: string; category: string; score: number; grade: string;
  components: Record<string, number>; fuzzy_output: Record<string, number>;
  details: Record<string, any>;
}

interface ProductResult {
  product_name: string; overall_score: number; overall_grade: string;
  ingredient_scores: IngredientScore[]; components: Record<string, number>;
  fuzzy_output: Record<string, number>; warnings: string[];
  safe_for: string[]; avoid_if: string[];
}

interface Product { id: string; name: string; brand: string; category: string; price: number; ingredients: string[]; }
interface LeaderboardEntry { product_id: string; product_name: string; brand: string; category: string; price: number; score: number; grade: string; }

const GRADE_COLORS: Record<string, string> = {
  'A+': '#059669', 'A': '#10b981', 'A-': '#34d399',
  'B+': '#3b82f6', 'B': '#6366f1', 'B-': '#818cf8',
  'C+': '#f59e0b', 'C': '#f97316', 'C-': '#ef4444',
  'D': '#dc2626', 'F': '#991b1b',
};

const COMPONENT_LABELS: Record<string, string> = {
  ingredient_safety: 'Ingredient Safety',
  toxicological_risk: 'Toxicological Risk',
  comedogenic_risk: 'Comedogenic Risk',
  irritation_safety: 'Irritation Safety',
  allergen_safety: 'Allergen Safety',
  environmental_safety: 'Environmental Safety',
  evidence_strength: 'Evidence Strength',
};

function ScoreGauge({ score, grade, size = 200 }: { score: number; grade: string; size?: number }) {
  const r = size * 0.4;
  const circumference = Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const color = GRADE_COLORS[grade] || '#6b7280';
  return (
    <div className="relative" style={{ width: size, height: size * 0.6 }}>
      <svg width={size} height={size * 0.6} viewBox={`0 0 ${size} ${size * 0.6}`}>
        <path d={`M ${size * 0.1} ${size * 0.5} A ${r} ${r} 0 0 1 ${size * 0.9} ${size * 0.5}`}
          fill="none" stroke="#e5e7eb" strokeWidth="12" strokeLinecap="round" />
        <motion.path
          d={`M ${size * 0.1} ${size * 0.5} A ${r} ${r} 0 0 1 ${size * 0.9} ${size * 0.5}`}
          fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }} transition={{ duration: 1.5, ease: 'easeOut' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring' }}
          className="text-4xl font-black" style={{ color }}>{score}</motion.div>
        <div className="text-lg font-bold text-gray-700" style={{ color }}>Grade: {grade}</div>
      </div>
    </div>
  );
}

function DimensionBar({ name, value, max = 100 }: { name: string; value: number; max?: number }) {
  const pct = (value / max) * 100;
  const color = value >= 80 ? '#10b981' : value >= 60 ? '#f59e0b' : value >= 40 ? '#f97316' : '#ef4444';
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-600 w-36 flex-shrink-0">{COMPONENT_LABELS[name] || name}</span>
      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
        <motion.div className="h-full rounded-full" style={{ backgroundColor: color }}
          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
      </div>
      <span className="text-xs font-bold w-10 text-right" style={{ color }}>{Math.round(value)}</span>
    </div>
  );
}

export default function SafetyScorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [customIngredients, setCustomIngredients] = useState('');
  const [customName, setCustomName] = useState('');
  const [result, setResult] = useState<ProductResult | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'calculator' | 'leaderboard' | 'how'>('calculator');
  const [expandedIng, setExpandedIng] = useState<string | null>(null);
  const [howItWorks, setHowItWorks] = useState<any>(null);
  const [mode, setMode] = useState<'product' | 'custom'>('product');

  useEffect(() => {
    Promise.all([
      api.get('/safety-score/products'),
      api.get('/safety-score/leaderboard'),
      api.get('/safety-score/how-it-works'),
    ]).then(([p, l, h]) => {
      setProducts(p.data.products);
      setLeaderboard(l.data);
      setHowItWorks(h.data);
      setProductsLoading(false);
    }).catch(() => setProductsLoading(false));
  }, []);

  const checkProduct = async (productId?: string) => {
    setLoading(true);
    try {
      if (mode === 'product' && (productId || selectedProduct)) {
        const r = await api.post('/safety-score/check-product', { product_id: productId || selectedProduct });
        setResult(r.data);
      } else if (mode === 'custom' && customIngredients.trim()) {
        const ings = customIngredients.split(',').map(s => s.trim()).filter(Boolean);
        const r = await api.post('/safety-score/check-product', { ingredients: ings, product_name: customName || 'Custom Product' });
        setResult(r.data);
      }
      setActiveTab('calculator');
    } catch {}
    setLoading(false);
  };

  if (productsLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}>
        <ShieldCheck className="w-12 h-12 text-pink-500" />
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Cosmetic <span className="gradient-text">Safety Score</span></h1>
          <p className="text-gray-600 max-w-2xl mx-auto">Patent-pending fuzzy logic engine that evaluates cosmetic safety across 7 scientific dimensions — not just star ratings.</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex bg-white rounded-xl border border-gray-200 p-1 gap-1 mb-6">
          {[
            { key: 'calculator' as const, label: 'Score Calculator', icon: Beaker },
            { key: 'leaderboard' as const, label: 'Leaderboard', icon: Award },
            { key: 'how' as const, label: 'How It Works', icon: Info },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.key ? 'bg-pink-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'calculator' && (
            <motion.div key="calc" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left: Input */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <div className="flex gap-2 mb-4">
                      <button onClick={() => setMode('product')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'product' ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                        <Package className="w-4 h-4 inline mr-1" /> Select Product
                      </button>
                      <button onClick={() => setMode('custom')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'custom' ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                        <Beaker className="w-4 h-4 inline mr-1" /> Custom Ingredients
                      </button>
                    </div>

                    {mode === 'product' ? (
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {products.map(p => (
                          <button key={p.id} onClick={() => { setSelectedProduct(p.id); checkProduct(p.id); }}
                            className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${selectedProduct === p.id ? 'border-pink-300 bg-pink-50' : 'border-gray-200 hover:border-gray-300'}`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm font-bold text-gray-900">{p.name}</div>
                                <div className="text-xs text-gray-500">{p.brand} · {p.category}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-gray-700">${p.price}</div>
                                <div className="text-xs text-gray-400">{p.ingredients.length} ingredients</div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <input type="text" value={customName} onChange={e => setCustomName(e.target.value)}
                          placeholder="Product name (optional)"
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" />
                        <textarea value={customIngredients} onChange={e => setCustomIngredients(e.target.value)}
                          placeholder="Enter ingredients, comma-separated:&#10;e.g. Water, Niacinamide, Hyaluronic Acid, Retinol, Fragrance"
                          className="w-full h-28 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-pink-500" />
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                          onClick={() => checkProduct()} disabled={!customIngredients.trim() || loading}
                          className="w-full glass-button py-2.5 flex items-center justify-center gap-2 disabled:opacity-40">
                          {loading ? 'Analyzing...' : <><Sparkles className="w-4 h-4" /> Calculate Score</>}
                        </motion.button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Results */}
                <div className="lg:col-span-3 space-y-4">
                  {!result ? (
                    <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                      <ShieldCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Select a Product to Score</h3>
                      <p className="text-gray-500">Choose from our database or enter custom ingredients to get a safety score.</p>
                    </div>
                  ) : (
                    <>
                      {/* Score + Gauge */}
                      <div className="bg-white rounded-2xl border border-gray-200 p-6">
                        <div className="flex items-start gap-6">
                          <ScoreGauge score={result.overall_score} grade={result.overall_grade} />
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-1">{result.product_name}</h3>
                            <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
                              <span>{result.ingredient_scores.length} ingredients analyzed</span>
                              <span>·</span>
                              <span>Fuzzy logic score</span>
                            </div>
                            {/* Fuzzy Output */}
                            <div className="grid grid-cols-3 gap-2">
                              {Object.entries(result.fuzzy_output).map(([key, val]) => (
                                <div key={key} className="bg-gray-50 rounded-lg p-2 text-center">
                                  <div className="text-lg font-bold text-gray-900">{(val as number * 100).toFixed(0)}%</div>
                                  <div className="text-[10px] text-gray-500 capitalize">{key.replace('_membership', '')}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 7 Dimensions */}
                      <div className="bg-white rounded-2xl border border-gray-200 p-5">
                        <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-pink-500" /> 7 Safety Dimensions
                        </h4>
                        <div className="space-y-2.5">
                          {Object.entries(result.components).map(([key, val]) => (
                            <DimensionBar key={key} name={key} value={val as number} />
                          ))}
                        </div>
                      </div>

                      {/* Warnings */}
                      {result.warnings.length > 0 && (
                        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5">
                          <h4 className="font-bold text-amber-700 mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" /> Safety Warnings
                          </h4>
                          <div className="space-y-1.5">
                            {result.warnings.map((w, i) => (
                              <div key={i} className="flex items-start gap-2 text-sm text-amber-700">
                                <XCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> {w}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Safe For / Avoid If */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-4">
                          <h4 className="font-bold text-emerald-700 text-sm mb-2 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Safe For
                          </h4>
                          {result.safe_for.map((s, i) => (
                            <div key={i} className="text-sm text-emerald-600">• {s}</div>
                          ))}
                        </div>
                        <div className="bg-red-50 rounded-2xl border border-red-200 p-4">
                          <h4 className="font-bold text-red-600 text-sm mb-2 flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4" /> Avoid If
                          </h4>
                          {result.avoid_if.map((a, i) => (
                            <div key={i} className="text-sm text-red-500">• {a}</div>
                          ))}
                        </div>
                      </div>

                      {/* Ingredient Breakdown */}
                      <div className="bg-white rounded-2xl border border-gray-200 p-5">
                        <h4 className="font-bold text-gray-900 mb-3">Ingredient Breakdown</h4>
                        <div className="space-y-2">
                          {result.ingredient_scores.map(ing => {
                            const isExpanded = expandedIng === ing.id;
                            const gc = GRADE_COLORS[ing.grade] || '#6b7280';
                            return (
                              <div key={ing.id} className="border border-gray-200 rounded-xl overflow-hidden">
                                <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                                  onClick={() => setExpandedIng(isExpanded ? null : ing.id)}>
                                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: gc }}>
                                    {ing.grade}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold text-gray-900">{ing.name}</div>
                                    <div className="text-xs text-gray-400 capitalize">{ing.category}</div>
                                  </div>
                                  <div className="text-lg font-bold" style={{ color: gc }}>{ing.score}</div>
                                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                </div>
                                <AnimatePresence>
                                  {isExpanded && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                      <div className="px-4 pb-4 pt-0 space-y-3">
                                        <div className="space-y-1.5">
                                          {Object.entries(ing.components).map(([k, v]) => (
                                            <DimensionBar key={k} name={k} value={v as number} />
                                          ))}
                                        </div>
                                        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                                          <span>EWG: {ing.details.ewg}</span>
                                          <span>·</span>
                                          <span>Comedogenic: {ing.details.comedogenic}/5</span>
                                          <span>·</span>
                                          <span>Irritation: {ing.details.irritation}%</span>
                                          <span>·</span>
                                          <span>Allergen: {ing.details.allergen ? 'Yes' : 'No'}</span>
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'leaderboard' && (
            <motion.div key="lb" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-gray-50 text-xs font-bold text-gray-600 border-b border-gray-200">
                  <div className="col-span-1">#</div>
                  <div className="col-span-4">Product</div>
                  <div className="col-span-2">Brand</div>
                  <div className="col-span-1">Price</div>
                  <div className="col-span-2">Score</div>
                  <div className="col-span-2">Grade</div>
                </div>
                {leaderboard.map((entry, idx) => {
                  const gc = GRADE_COLORS[entry.grade] || '#6b7280';
                  return (
                    <motion.div key={entry.product_id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors items-center">
                      <div className="col-span-1 text-sm font-bold text-gray-500">{idx + 1}</div>
                      <div className="col-span-4 text-sm font-bold text-gray-900 truncate">{entry.product_name}</div>
                      <div className="col-span-2 text-sm text-gray-600">{entry.brand}</div>
                      <div className="col-span-1 text-sm text-gray-600">${entry.price}</div>
                      <div className="col-span-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${entry.score}%`, backgroundColor: gc }} />
                          </div>
                          <span className="text-sm font-bold" style={{ color: gc }}>{entry.score}</span>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <span className="px-3 py-1 rounded-full text-sm font-bold text-white" style={{ backgroundColor: gc }}>{entry.grade}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {activeTab === 'how' && howItWorks && (
            <motion.div key="how" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{howItWorks.title}</h3>
                <p className="text-gray-600">{howItWorks.description}</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h4 className="font-bold text-gray-900 mb-3">7 Evaluation Dimensions</h4>
                <div className="space-y-3">
                  {howItWorks.dimensions.map((d: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center text-pink-600 text-sm font-bold flex-shrink-0">{i + 1}</div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">{d.name} <span className="text-gray-400 font-normal">({d.weight})</span></div>
                        <div className="text-xs text-gray-600 mt-0.5">{d.description}</div>
                        <div className="text-xs text-gray-400 mt-0.5">Range: {d.range}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h4 className="font-bold text-gray-900 mb-3">Fuzzy Logic Engine</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-sm font-bold text-gray-900">{howItWorks.fuzzy_logic.rule_count} Rules</div>
                    <div className="text-xs text-gray-600">{howItWorks.fuzzy_logic.description}</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-sm font-bold text-gray-900">Defuzzification</div>
                    <div className="text-xs text-gray-600">{howItWorks.fuzzy_logic.defuzzification}</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h4 className="font-bold text-gray-900 mb-3">Grading Scale</h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(howItWorks.grading).map(([grade, desc]) => {
                    const gc = GRADE_COLORS[grade] || '#6b7280';
                    return (
                      <div key={grade} className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg">
                        <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: gc }}>{grade}</span>
                        <span className="text-xs text-gray-700">{desc as string}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
