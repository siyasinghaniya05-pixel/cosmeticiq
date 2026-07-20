'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert, CheckCircle2, XCircle, AlertTriangle, Search,
  Flower2, Leaf, Shirt, CircleDashed, FlaskConical, Palette,
  Droplets, Skull, CircleDot, Wheat, Pill,
  ChevronDown, ChevronUp, Info, Shield, Eye,
  Package, Beaker, ClipboardList, TrendingDown,
} from 'lucide-react';
import api from '@/lib/api';

interface Allergen {
  id: string; name: string; description: string; icon: string;
  color: string; severity: string; prevalence: string;
  alternative_tips: string; alias_count: number;
}

interface FlaggedItem {
  ingredient: string; allergen_category: string; allergen_name: string;
  severity: string; color: string; matched_aliases: string[];
}

interface ProductResult {
  product_id: string; product_name: string; category: string;
  is_safe: boolean; total_flags: number; flags: FlaggedItem[]; risk_level: string;
}

interface IngredientResult {
  ingredient: string; is_safe: boolean; flags: FlaggedItem[];
}

const ICON_MAP: Record<string, any> = {
  Flower2, Leaf, Shirt, CircleDashed, FlaskConical, Palette,
  Droplets, Skull, CircleDot, Wheat, AlertTriangle, Pill,
};

const RISK_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  safe: { label: 'Safe', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  low: { label: 'Low Risk', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200', icon: AlertTriangle },
  medium: { label: 'Medium Risk', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', icon: AlertTriangle },
  high: { label: 'High Risk', color: 'text-red-600', bg: 'bg-red-50 border-red-200', icon: XCircle },
  severe: { label: 'Severe', color: 'text-red-700', bg: 'bg-red-100 border-red-300', icon: ShieldAlert },
};

export default function AllergyPage() {
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<ProductResult[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [customResult, setCustomResult] = useState<IngredientResult | null>(null);
  const [customChecking, setCustomChecking] = useState(false);
  const [expandedAllergen, setExpandedAllergen] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'select' | 'scan' | 'custom'>('select');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    Promise.all([api.get('/allergy/allergens'), api.get('/allergy/stats')])
      .then(([a, s]) => { setAllergens(a.data); setStats(s.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const toggleAllergen = (id: string) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    setResults([]); setCustomResult(null);
  };
  const selectAll = () => setSelected(new Set(allergens.map(a => a.id)));
  const clearAll = () => { setSelected(new Set()); setResults([]); setCustomResult(null); };

  const runScan = async () => {
    if (selected.size === 0) return;
    setScanning(true);
    try { const r = await api.post('/allergy/check-products', { allergies: Array.from(selected) }); setResults(r.data.flagged_products); setActiveTab('scan'); } catch {}
    setScanning(false);
  };

  const checkCustom = async () => {
    if (!customInput.trim() || selected.size === 0) return;
    setCustomChecking(true);
    try { const r = await api.post('/allergy/check-ingredients', { allergies: Array.from(selected), ingredient: customInput }); setCustomResult(r.data); setActiveTab('custom'); } catch {}
    setCustomChecking(false);
  };

  const flaggedCount = results.filter(r => !r.is_safe).length;
  const safeCount = results.filter(r => r.is_safe).length;

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}>
        <ShieldAlert className="w-12 h-12 text-pink-500" />
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Allergy <span className="gradient-text">Prediction</span></h1>
          <p className="text-gray-600 max-w-2xl mx-auto">Select your known allergies, then scan products or paste ingredient lists to find hidden allergens before they find you.</p>
        </motion.div>

        {stats && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 text-center">
              <div className="text-2xl font-bold text-pink-600">{stats.total_allergens}</div>
              <div className="text-sm text-gray-500">Allergen Categories</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.total_aliases}</div>
              <div className="text-sm text-gray-500">Hidden Aliases Tracked</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total_products}</div>
              <div className="text-sm text-gray-500">Products in Database</div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Allergen Selection */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-pink-500" /> Your Allergies
                </h2>
                <div className="flex gap-2">
                  <button onClick={selectAll} className="text-xs text-pink-600 hover:text-pink-700 font-medium">Select All</button>
                  <span className="text-gray-300">|</span>
                  <button onClick={clearAll} className="text-xs text-gray-500 hover:text-gray-700 font-medium">Clear</button>
                </div>
              </div>
              {selected.size > 0 && (
                <div className="mb-4 px-3 py-2 bg-pink-50 rounded-lg border border-pink-100">
                  <span className="text-sm text-pink-700 font-medium">{selected.size} allerg{selected.size === 1 ? 'y' : 'ies'} selected</span>
                </div>
              )}
              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {allergens.map(allergen => {
                  const IconComp = ICON_MAP[allergen.icon] || AlertTriangle;
                  const isSelected = selected.has(allergen.id);
                  const isExpanded = expandedAllergen === allergen.id;
                  return (
                    <motion.div key={allergen.id} layout
                      className={`rounded-xl border transition-all ${isSelected ? 'border-pink-300 bg-pink-50/50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                      <div className="flex items-center gap-3 p-3 cursor-pointer" onClick={() => toggleAllergen(allergen.id)}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'bg-pink-500' : ''}`}
                          style={isSelected ? {} : { backgroundColor: allergen.color + '20' }}>
                          <IconComp className={`w-4 h-4 ${isSelected ? 'text-white' : ''}`} style={isSelected ? {} : { color: allergen.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{allergen.name}</div>
                          <div className="text-xs text-gray-400">{allergen.alias_count} aliases tracked</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            allergen.severity === 'very_high' ? 'bg-red-100 text-red-600' :
                            allergen.severity === 'high' ? 'bg-orange-100 text-orange-600' :
                            allergen.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {allergen.severity === 'very_high' ? 'Critical' : allergen.severity === 'high' ? 'High' : allergen.severity === 'medium' ? 'Medium' : 'Low'}
                          </span>
                          <button onClick={e => { e.stopPropagation(); setExpandedAllergen(isExpanded ? null : allergen.id); }}
                            className="text-gray-400 hover:text-gray-600">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="px-3 pb-3 pt-0 space-y-2">
                              <p className="text-xs text-gray-600">{allergen.description}</p>
                              <div className="flex items-center gap-1 text-xs text-gray-400">
                                <Info className="w-3 h-3" /><span>Prevalence: {allergen.prevalence}</span>
                              </div>
                              <div className="bg-emerald-50 rounded-lg px-3 py-2 border border-emerald-100">
                                <div className="text-xs font-medium text-emerald-700 mb-1">Alternatives:</div>
                                <p className="text-xs text-emerald-600">{allergen.alternative_tips}</p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={runScan} disabled={selected.size === 0 || scanning}
              className="w-full glass-button py-3 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
              {scanning ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><Beaker className="w-5 h-5" /></motion.div>
                : <><ShieldAlert className="w-5 h-5" /> Scan All Products ({selected.size} allerg{selected.size === 1 ? 'y' : 'ies'})</>}
            </motion.button>
          </div>

          {/* Right: Results */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex bg-white rounded-xl border border-gray-200 p-1 gap-1">
              {([
                { key: 'select' as const, label: 'Overview', icon: ClipboardList },
                { key: 'scan' as const, label: `Product Scan${results.length ? ` (${flaggedCount} flagged)` : ''}`, icon: Package },
                { key: 'custom' as const, label: 'Custom Check', icon: Beaker },
              ]).map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.key ? 'bg-pink-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>
                  <tab.icon className="w-4 h-4" /> {tab.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'select' && (
                <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                  {selected.size === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                      <ShieldAlert className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Select Your Allergies</h3>
                      <p className="text-gray-500 max-w-sm mx-auto">Toggle the allergens on the left that you know you react to. We&apos;ll scan all products and flag anything that contains hidden traces.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-white rounded-2xl border border-gray-200 p-5">
                        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Eye className="w-5 h-5 text-pink-500" /> What We&apos;re Scanning For</h3>
                        <div className="space-y-2">
                          {Array.from(selected).map(id => {
                            const a = allergens.find(x => x.id === id);
                            if (!a) return null;
                            const IconComp = ICON_MAP[a.icon] || AlertTriangle;
                            return (
                              <div key={id} className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg">
                                <IconComp className="w-4 h-4" style={{ color: a.color }} />
                                <span className="text-sm font-medium text-gray-700">{a.name}</span>
                                <span className="text-xs text-gray-400 ml-auto">{a.alias_count} aliases</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      {stats && (
                        <div className="bg-white rounded-2xl border border-gray-200 p-5">
                          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><TrendingDown className="w-5 h-5 text-pink-500" /> Risk by Allergen</h3>
                          <div className="space-y-2">
                            {Array.from(selected).map(id => {
                              const a = allergens.find(x => x.id === id);
                              if (!a) return null;
                              const flagged = stats.products_flagged?.[id] || 0;
                              const total = stats.total_products;
                              const pct = total ? (flagged / total) * 100 : 0;
                              return (
                                <div key={id} className="flex items-center gap-3">
                                  <span className="text-sm text-gray-700 w-40 truncate">{a.name}</span>
                                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: a.color }} />
                                  </div>
                                  <span className="text-xs text-gray-500 w-12 text-right">{flagged}/{total}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={runScan} disabled={scanning} className="w-full glass-button py-3 flex items-center justify-center gap-2">
                        <ShieldAlert className="w-5 h-5" /> Run Full Scan
                      </motion.button>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'scan' && (
                <motion.div key="scan" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
                  {results.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                      <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-gray-900 mb-2">No Scan Results Yet</h3>
                      <p className="text-gray-500">Select allergies and click &quot;Scan All Products&quot; to check for hidden allergens.</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                          <div className="text-xl font-bold text-gray-900">{results.length}</div>
                          <div className="text-xs text-gray-500">Products Checked</div>
                        </div>
                        <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4 text-center">
                          <div className="text-xl font-bold text-emerald-600">{safeCount}</div>
                          <div className="text-xs text-emerald-600">Safe for You</div>
                        </div>
                        <div className="bg-red-50 rounded-xl border border-red-200 p-4 text-center">
                          <div className="text-xl font-bold text-red-600">{flaggedCount}</div>
                          <div className="text-xs text-red-600">Flagged</div>
                        </div>
                      </div>
                      {[...results].sort((a, b) => {
                        const order: Record<string, number> = { severe: 0, high: 1, medium: 2, low: 3, safe: 4 };
                        return (order[a.risk_level] ?? 5) - (order[b.risk_level] ?? 5);
                      }).map((product, idx) => {
                        const rc = RISK_CONFIG[product.risk_level] || RISK_CONFIG.safe;
                        const RiskIcon = rc.icon;
                        return (
                          <motion.div key={product.product_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                            className={`bg-white rounded-2xl border p-5 transition-all ${product.is_safe ? 'border-emerald-200' : 'border-red-200'}`}>
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-bold text-gray-900">{product.product_name}</h4>
                                <span className="text-xs text-gray-400 capitalize">{product.category}</span>
                              </div>
                              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${rc.bg} ${rc.color}`}>
                                <RiskIcon className="w-4 h-4" /> {rc.label}
                              </div>
                            </div>
                            {!product.is_safe && (
                              <div className="space-y-2 mt-3">
                                {product.flags.map((flag, fi) => (
                                  <div key={fi} className="flex items-start gap-3 px-3 py-2 bg-red-50 rounded-lg border border-red-100">
                                    <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-medium text-gray-900">{flag.ingredient}</span>
                                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: flag.color + '20', color: flag.color }}>{flag.allergen_name}</span>
                                      </div>
                                      <div className="text-xs text-gray-500 mt-0.5">Matched: {flag.matched_aliases.join(', ')}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            {product.is_safe && (
                              <div className="flex items-center gap-2 text-emerald-600 mt-2">
                                <CheckCircle2 className="w-4 h-4" /><span className="text-sm">No allergens detected — safe for your profile</span>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </>
                  )}
                </motion.div>
              )}

              {activeTab === 'custom' && (
                <motion.div key="custom" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                  <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Beaker className="w-5 h-5 text-pink-500" /> Paste Ingredient List</h3>
                    <p className="text-sm text-gray-500 mb-4">Paste any ingredient list (comma-separated or line-by-line) to check against your selected allergies.</p>
                    <textarea value={customInput} onChange={e => setCustomInput(e.target.value)}
                      placeholder="e.g. Water, Glycerin, Fragrance, Paraben, Retinol, Hyaluronic Acid, Methylparaben..."
                      className="w-full h-32 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent" />
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={checkCustom} disabled={!customInput.trim() || selected.size === 0 || customChecking}
                      className="mt-3 px-6 py-2.5 glass-button flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                      {customChecking ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><Beaker className="w-4 h-4" /></motion.div>
                        : <><Search className="w-4 h-4" /> Check Ingredients</>}
                    </motion.button>
                    {selected.size === 0 && <p className="text-xs text-amber-500 mt-2">Select at least one allergy on the left first.</p>}
                  </div>

                  {customResult && (
                    <div className={`rounded-2xl border p-5 ${customResult.is_safe ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                      <div className="flex items-center gap-3 mb-3">
                        {customResult.is_safe
                          ? <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                          : <XCircle className="w-6 h-6 text-red-500" />}
                        <h4 className={`font-bold ${customResult.is_safe ? 'text-emerald-700' : 'text-red-700'}`}>
                          {customResult.is_safe ? 'No Allergens Found' : `${customResult.flags.length} Allergen${customResult.flags.length !== 1 ? 's' : ''} Detected`}
                        </h4>
                      </div>
                      {!customResult.is_safe && (
                        <div className="space-y-2">
                          {customResult.flags.map((flag, i) => (
                            <div key={i} className="flex items-start gap-3 px-3 py-2 bg-white rounded-lg border border-red-100">
                              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-medium text-gray-900">{flag.ingredient}</span>
                                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: flag.color + '20', color: flag.color }}>{flag.allergen_name}</span>
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">Matched: {flag.matched_aliases.join(', ')}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
