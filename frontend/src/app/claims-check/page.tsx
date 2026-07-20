'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert, CheckCircle2, XCircle, AlertTriangle, HelpCircle,
  Search, ClipboardList, Lightbulb, BookOpen, ChevronRight,
  TrendingUp, BadgeCheck, BadgeX, BadgeAlert, BadgeHelp,
  Sparkles, Info, ExternalLink,
} from 'lucide-react';
import api from '@/lib/api';

interface ClaimAnalysis {
  claim: string; verdict: string; confidence: number; explanation: string;
  evidence_level: string; category: string; red_flags: string[];
  scientific_consensus: string; better_claims: string[];
  detected_patterns: string[];
}

interface KnownClaim {
  id: string; claim: string; verdict: string; confidence: number; category: string;
}

interface ClaimStats {
  total_known: number;
  verdict_counts: Record<string, number>;
  category_counts: Record<string, number>;
}

const VERDICT_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: any; description: string }> = {
  supported: { label: 'Supported', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-300', icon: BadgeCheck, description: 'Backed by scientific evidence' },
  misleading: { label: 'Misleading', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-300', icon: BadgeAlert, description: 'Contains truth but twists it' },
  false: { label: 'False', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-300', icon: BadgeX, description: 'Contradicted by scientific evidence' },
  insufficient: { label: 'Insufficient Evidence', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-300', icon: BadgeHelp, description: 'Not enough data to verify' },
};

const EXAMPLE_CLAIMS = [
  "Removes acne in 2 days",
  "All-natural ingredients — chemical-free formula",
  "Detoxifies your skin and removes toxins",
  "Vitamin C brightens skin and boosts collagen",
  "Clinically proven to reduce wrinkles by 50% in 4 weeks",
  "This cream penetrates all 7 layers of skin",
  "Doctor-recommended number 1 dermatologist brand",
  "Cures eczema permanently",
  "Retinol reverses aging",
  "Niacinamide shrinks pores permanently",
];

export default function ClaimsCheckPage() {
  const [input, setInput] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<ClaimAnalysis | null>(null);
  const [knownClaims, setKnownClaims] = useState<KnownClaim[]>([]);
  const [stats, setStats] = useState<ClaimStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'analyze' | 'database'>('analyze');
  const [expandedClaim, setExpandedClaim] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.get('/claims-check/known-claims'), api.get('/claims-check/stats')])
      .then(([c, s]) => { setKnownClaims(c.data); setStats(s.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const analyze = async (text?: string) => {
    const claim = (text || input).trim();
    if (!claim) return;
    setAnalyzing(true);
    try {
      const r = await api.post('/claims-check/analyze', { claim });
      setResult(r.data);
      setActiveTab('analyze');
    } catch {}
    setAnalyzing(false);
  };

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
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Fake Claims <span className="gradient-text">Detector</span></h1>
          <p className="text-gray-600 max-w-2xl mx-auto">Paste any beauty advertisement or influencer claim. Our AI checks it against scientific evidence and tells you the truth.</p>
        </motion.div>

        {/* Stats */}
        {stats && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 px-5 py-3 flex items-center gap-3">
              <span className="text-2xl font-bold text-pink-600">{stats.total_known}</span>
              <span className="text-sm text-gray-500">Claims Analyzed</span>
            </div>
            {Object.entries(stats.verdict_counts).map(([v, count]) => {
              const vc = VERDICT_CONFIG[v];
              if (!vc) return null;
              return (
                <div key={v} className="bg-white rounded-xl border border-gray-200 px-5 py-3 flex items-center gap-3">
                  <vc.icon className={`w-5 h-5 ${vc.color}`} />
                  <span className="text-lg font-bold text-gray-900">{count}</span>
                  <span className="text-sm text-gray-500">{vc.label}</span>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Input Area */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Search className="w-5 h-5 text-pink-500" /> Paste a Claim to Analyze
          </h2>
          <textarea
            value={input} onChange={e => setInput(e.target.value)}
            placeholder="e.g. &quot;Removes acne in 2 days&quot; or &quot;All-natural chemical-free formula&quot;..."
            className="w-full h-24 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); analyze(); } }}
          />
          <div className="flex items-center justify-between mt-3">
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-gray-400 py-1">Try:</span>
              {EXAMPLE_CLAIMS.slice(0, 4).map(ex => (
                <button key={ex} onClick={() => setInput(ex)}
                  className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs hover:bg-gray-200 transition-colors truncate max-w-[200px]">
                  {ex}
                </button>
              ))}
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => analyze()} disabled={!input.trim() || analyzing}
              className="glass-button px-6 py-2.5 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0">
              {analyzing ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Sparkles className="w-4 h-4" /></motion.div>
                : <><ShieldAlert className="w-4 h-4" /> Analyze Claim</>}
            </motion.button>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex bg-white rounded-xl border border-gray-200 p-1 gap-1 mb-6">
          <button onClick={() => setActiveTab('analyze')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'analyze' ? 'bg-pink-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>
            <ShieldAlert className="w-4 h-4" /> Analysis Result
          </button>
          <button onClick={() => setActiveTab('database')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'database' ? 'bg-pink-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>
            <BookOpen className="w-4 h-4" /> Claims Database ({knownClaims.length})
          </button>
        </div>

        <AnimatePresence mode="wait">
          {/* Analysis Result */}
          {activeTab === 'analyze' && (
            <motion.div key="analyze" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {!result ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                  <ShieldAlert className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Paste a Claim Above</h3>
                  <p className="text-gray-500 max-w-sm mx-auto">Enter any beauty advertisement, influencer claim, or product promise to check against scientific evidence.</p>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                  {/* Verdict Banner */}
                  {(() => {
                    const vc = VERDICT_CONFIG[result.verdict] || VERDICT_CONFIG.insufficient;
                    const Icon = vc.icon;
                    return (
                      <div className={`${vc.bg} rounded-2xl border ${vc.border} p-6`}>
                        <div className="flex items-center gap-4 mb-4">
                          <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${vc.bg}`}>
                            <Icon className={`w-8 h-8 ${vc.color}`} />
                          </div>
                          <div>
                            <div className={`text-2xl font-bold ${vc.color}`}>{vc.label}</div>
                            <div className="text-sm text-gray-600">{vc.description}</div>
                          </div>
                          <div className="ml-auto text-right">
                            <div className="text-3xl font-bold text-gray-900">{result.confidence}%</div>
                            <div className="text-xs text-gray-500">Confidence</div>
                          </div>
                        </div>
                        <div className="bg-white/60 rounded-xl p-4">
                          <h4 className="font-bold text-gray-900 mb-2">Claim Analyzed:</h4>
                          <p className="text-gray-800 italic">&ldquo;{result.claim}&rdquo;</p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Explanation */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-amber-500" /> Explanation
                    </h3>
                    <p className="text-sm text-gray-700 leading-relaxed">{result.explanation}</p>
                  </div>

                  {/* Detected Patterns */}
                  {result.detected_patterns.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-200 p-5">
                      <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <Info className="w-5 h-5 text-blue-500" /> Detected Red Flag Patterns
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {result.detected_patterns.map(p => (
                          <span key={p} className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-medium capitalize">
                            {p.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Red Flags */}
                  {result.red_flags.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-200 p-5">
                      <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" /> Red Flags
                      </h3>
                      <div className="space-y-2">
                        {result.red_flags.map((flag, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                            {flag}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Scientific Consensus */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-purple-500" /> Scientific Consensus
                    </h3>
                    <p className="text-sm text-gray-700">{result.scientific_consensus}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-gray-400">Evidence Level:</span>
                      <span className="text-xs px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full font-medium">{result.evidence_level}</span>
                    </div>
                  </div>

                  {/* Better Claims */}
                  {result.better_claims.length > 0 && (
                    <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-5">
                      <h3 className="font-bold text-emerald-700 mb-2 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" /> Better Alternatives
                      </h3>
                      <div className="space-y-2">
                        {result.better_claims.map((bc, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-emerald-700">
                            <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span className="italic">&ldquo;{bc}&rdquo;</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Try Another */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-pink-500" /> Try Another Claim
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {EXAMPLE_CLAIMS.filter(ex => ex !== result.claim).slice(0, 6).map(ex => (
                        <button key={ex} onClick={() => { setInput(ex); analyze(ex); }}
                          className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs hover:bg-gray-200 transition-colors text-left">
                          {ex}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Database */}
          {activeTab === 'database' && (
            <motion.div key="database" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="space-y-3">
              {knownClaims.map((claim, idx) => {
                const vc = VERDICT_CONFIG[claim.verdict] || VERDICT_CONFIG.insufficient;
                const Icon = vc.icon;
                const isExpanded = expandedClaim === claim.id;
                return (
                  <motion.div key={claim.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setExpandedClaim(isExpanded ? null : claim.id)}>
                      <Icon className={`w-6 h-6 ${vc.color} flex-shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">&ldquo;{claim.claim}&rdquo;</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${vc.bg} ${vc.color}`}>{vc.label}</span>
                          <span className="text-xs text-gray-400 capitalize">{claim.category}</span>
                          <span className="text-xs text-gray-400">{claim.confidence}%</span>
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 text-gray-300 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="px-4 pb-4 pt-0 space-y-3">
                            <button onClick={e => { e.stopPropagation(); setInput(claim.claim); setActiveTab('analyze'); analyze(claim.claim); }}
                              className="text-xs text-pink-600 hover:text-pink-700 font-medium flex items-center gap-1">
                              <ExternalLink className="w-3 h-3" /> Re-analyze this claim
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
