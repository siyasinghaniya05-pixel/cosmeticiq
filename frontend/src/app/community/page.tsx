'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, Star, ThumbsUp, MapPin, Thermometer, Calendar,
  ChevronRight, Sparkles, Heart, Filter, UserCheck, Package,
  TrendingUp, Award, Droplets, Sun, Wind, Snowflake,
} from 'lucide-react';
import api from '@/lib/api';

interface CommunityUser {
  id: string; username: string; age: number; skin_type: string;
  concerns: string[]; climate: string; avatar_color: string;
  products_helped: number; match_score: number; match_percentage: number;
}

interface ProductReview {
  user_id: string; username: string; product_name: string; brand: string;
  rating: number; helpful: number; review: string; category: string;
  avatar_color: string;
}

interface ProductRec {
  product_name: string; brand: string; category: string;
  avg_rating: number; total_reviews: number; total_helpful: number;
  reviews: ProductReview[];
}

interface MatchResult {
  matches: CommunityUser[];
  total_community: number;
  avg_match_score: number;
  top_concerns_matched: Record<string, number>;
}

interface CommunityStats {
  total_users: number; total_reviews: number;
  skin_types: Record<string, number>; climates: Record<string, number>;
  top_concerns: Record<string, number>;
}

const SKIN_TYPES = ['oily', 'dry', 'combination', 'sensitive', 'normal'];
const CONCERNS = ['acne', 'wrinkles', 'fine lines', 'dryness', 'oiliness', 'sensitivity', 'redness', 'hyperpigmentation', 'dark spots', 'large pores', 'scarring', 'sun damage', 'dullness', 'uneven tone', 'loss of elasticity', 'rosacea', 'eczema', 'flaking', 'blackheads', 'texture', 'age spots', 'loss of firmness'];
const CLIMATES = [
  { id: 'humid', label: 'Humid', icon: Droplets, color: '#0EA5E9' },
  { id: 'dry', label: 'Dry', icon: Sun, color: '#F59E0B' },
  { id: 'tropical', label: 'Tropical', icon: Thermometer, color: '#EF4444' },
  { id: 'temperate', label: 'Temperate', icon: Wind, color: '#22C55E' },
  { id: 'cold', label: 'Cold', icon: Snowflake, color: '#6366F1' },
];

const STARS = [5, 4, 3, 2, 1];

function getMatchColor(score: number) {
  if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
  if (score >= 40) return 'text-amber-600 bg-amber-50 border-amber-200';
  return 'text-gray-600 bg-gray-50 border-gray-200';
}

function getMatchLabel(score: number) {
  if (score >= 80) return 'Excellent Match';
  if (score >= 60) return 'Great Match';
  if (score >= 40) return 'Good Match';
  return 'Possible Match';
}

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} className={`w-3.5 h-3.5 ${s <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
      ))}
    </div>
  );
}

export default function CommunityPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [age, setAge] = useState('');
  const [skinType, setSkinType] = useState('');
  const [selectedConcerns, setSelectedConcerns] = useState<Set<string>>(new Set());
  const [climate, setClimate] = useState('');
  const [results, setResults] = useState<MatchResult | null>(null);
  const [products, setProducts] = useState<ProductRec[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<CommunityUser | null>(null);
  const [userReviews, setUserReviews] = useState<ProductReview[]>([]);
  const [activeTab, setActiveTab] = useState<'matches' | 'products'>('matches');
  const [concernSearch, setConcernSearch] = useState('');

  useEffect(() => {
    api.get('/community/stats').then(r => { setStats(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const toggleConcern = (c: string) => {
    setSelectedConcerns(prev => { const n = new Set(prev); n.has(c) ? n.delete(c) : n.add(c); return n; });
  };

  const runMatch = async () => {
    if (!age || !skinType) return;
    setSearching(true);
    try {
      const body = { age: parseInt(age), skin_type: skinType, concerns: Array.from(selectedConcerns), climate: climate || undefined };
      const [matchRes, prodRes] = await Promise.all([
        api.post('/community/match', body),
        api.post('/community/top-products?limit=8', body),
      ]);
      setResults(matchRes.data);
      setProducts(prodRes.data);
      setActiveTab('matches');
    } catch {}
    setSearching(false);
  };

  const loadUser = async (userId: string) => {
    try {
      const r = await api.get(`/community/user/${userId}`);
      setSelectedUser(r.data);
      setUserReviews(r.data.reviews || []);
    } catch {}
  };

  const filteredConcerns = CONCERNS.filter(c => !concernSearch || c.toLowerCase().includes(concernSearch.toLowerCase()));

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}>
        <Users className="w-12 h-12 text-pink-500" />
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Community <span className="gradient-text">Skin Match</span></h1>
          <p className="text-gray-600 max-w-2xl mx-auto">Find users with similar skin profiles and discover which products actually worked for people like you.</p>
        </motion.div>

        {stats && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 text-center">
              <div className="text-2xl font-bold text-pink-600">{stats.total_users}</div>
              <div className="text-sm text-gray-500">Community Members</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.total_reviews}</div>
              <div className="text-sm text-gray-500">Product Reviews</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{Object.keys(stats.skin_types).length}</div>
              <div className="text-sm text-gray-500">Skin Types</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 text-center">
              <div className="text-2xl font-bold text-emerald-600">{Object.keys(stats.climates).length}</div>
              <div className="text-sm text-gray-500">Climate Zones</div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Profile Form */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-pink-500" /> Your Profile
              </h2>

              {/* Age */}
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Age</label>
                <input type="number" value={age} onChange={e => setAge(e.target.value)}
                  placeholder="e.g. 28" min={10} max={120}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent" />
              </div>

              {/* Skin Type */}
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Skin Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {SKIN_TYPES.map(st => (
                    <button key={st} onClick={() => setSkinType(skinType === st ? '' : st)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-all ${skinType === st ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Concerns */}
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Skin Concerns {selectedConcerns.size > 0 && <span className="text-pink-500">({selectedConcerns.size})</span>}
                </label>
                <div className="relative mb-2">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input type="text" value={concernSearch} onChange={e => setConcernSearch(e.target.value)}
                    placeholder="Search concerns..."
                    className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500" />
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {filteredConcerns.map(c => (
                    <button key={c} onClick={() => toggleConcern(c)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all capitalize ${selectedConcerns.has(c) ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Climate */}
              <div className="mb-5">
                <label className="text-sm font-medium text-gray-700 mb-2 block">Climate</label>
                <div className="grid grid-cols-3 gap-2">
                  {CLIMATES.map(cl => {
                    const Icon = cl.icon;
                    return (
                      <button key={cl.id} onClick={() => setClimate(climate === cl.id ? '' : cl.id)}
                        className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg text-xs font-medium transition-all ${climate === cl.id ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                        <Icon className="w-4 h-4" style={climate === cl.id ? {} : { color: cl.color }} />
                        {cl.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={runMatch} disabled={!age || !skinType || searching}
                className="w-full glass-button py-3 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                {searching ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Sparkles className="w-5 h-5" /></motion.div>
                  : <><Users className="w-5 h-5" /> Find My Community</>}
              </motion.button>
            </div>
          </div>

          {/* Right: Results */}
          <div className="lg:col-span-3 space-y-4">
            {!results ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">Find Your Skin Twins</h3>
                <p className="text-gray-500 max-w-sm mx-auto">Fill in your profile and hit &quot;Find My Community&quot; to discover people with similar skin who can share their product experiences.</p>
              </div>
            ) : (
              <>
                {/* Tabs */}
                <div className="flex bg-white rounded-xl border border-gray-200 p-1 gap-1">
                  <button onClick={() => setActiveTab('matches')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'matches' ? 'bg-pink-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>
                    <Users className="w-4 h-4" /> Skin Matches ({results.matches.filter(m => m.match_score >= 40).length})
                  </button>
                  <button onClick={() => setActiveTab('products')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'products' ? 'bg-pink-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>
                    <Package className="w-4 h-4" /> Top Products ({products.length})
                  </button>
                </div>

                {/* Match Summary */}
                {activeTab === 'matches' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                        <div className="text-xl font-bold text-pink-600">{results.total_community}</div>
                        <div className="text-xs text-gray-500">Total Members</div>
                      </div>
                      <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                        <div className="text-xl font-bold text-blue-600">{results.matches.filter(m => m.match_score >= 60).length}</div>
                        <div className="text-xs text-gray-500">Strong Matches</div>
                      </div>
                      <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                        <div className="text-xl font-bold text-emerald-600">{results.avg_match_score.toFixed(0)}%</div>
                        <div className="text-xs text-gray-500">Avg Match Score</div>
                      </div>
                    </div>

                    {Object.keys(results.top_concerns_matched).length > 0 && (
                      <div className="bg-white rounded-2xl border border-gray-200 p-4">
                        <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                          <Heart className="w-4 h-4 text-pink-500" /> Concerns Shared With Community
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(results.top_concerns_matched).sort((a, b) => b[1] - a[1]).map(([concern, count]) => (
                            <span key={concern} className="px-3 py-1 bg-pink-50 text-pink-600 rounded-full text-xs font-medium capitalize">
                              {concern} ({count} members)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Match Cards */}
                    {results.matches.map((match, idx) => (
                      <motion.div key={match.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-md transition-all cursor-pointer"
                        onClick={() => loadUser(match.id)}>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                            style={{ backgroundColor: match.avatar_color }}>
                            {getInitials(match.username)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900 truncate">@{match.username}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${getMatchColor(match.match_percentage)}`}>
                                {match.match_percentage.toFixed(0)}%
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                              <span>Age {match.age}</span>
                              <span className="capitalize">{match.skin_type}</span>
                              <span className="capitalize">{match.climate}</span>
                              <span>{match.products_helped} reviews</span>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {match.concerns.map(c => (
                            <span key={c} className={`px-2 py-0.5 rounded-full text-xs capitalize ${selectedConcerns.has(c) ? 'bg-pink-100 text-pink-600 font-medium' : 'bg-gray-100 text-gray-500'}`}>
                              {c} {selectedConcerns.has(c) && '✓'}
                            </span>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {activeTab === 'products' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                    {products.length === 0 ? (
                      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-900 mb-2">No Products Found</h3>
                        <p className="text-gray-500">Try adjusting your profile to find better matches.</p>
                      </div>
                    ) : products.map((prod, idx) => (
                      <motion.div key={prod.product_name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white rounded-2xl border border-gray-200 p-5">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900">{prod.product_name}</h4>
                            <p className="text-sm text-gray-500">{prod.brand}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <StarRating rating={Math.round(prod.avg_rating)} />
                            <span className="text-sm font-bold text-amber-600">{prod.avg_rating}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                          <span className="capitalize bg-gray-100 px-2 py-0.5 rounded-full">{prod.category}</span>
                          <span>{prod.total_reviews} review{prod.total_reviews !== 1 ? 's' : ''}</span>
                          <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {prod.total_helpful}</span>
                        </div>
                        <div className="space-y-2">
                          {prod.reviews.map((rev, ri) => (
                            <div key={ri} className="bg-gray-50 rounded-xl px-4 py-3">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                                  style={{ backgroundColor: rev.avatar_color }}>
                                  {getInitials(rev.username)}
                                </div>
                                <span className="text-sm font-medium text-gray-700">@{rev.username}</span>
                                <StarRating rating={rev.rating} />
                                <span className="flex items-center gap-1 text-xs text-gray-400 ml-auto">
                                  <ThumbsUp className="w-3 h-3" /> {rev.helpful}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">{rev.review}</p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </>
            )}
          </div>
        </div>

        {/* User Detail Modal */}
        <AnimatePresence>
          {selectedUser && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
              onClick={() => setSelectedUser(null)}>
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-lg overflow-hidden"
                onClick={e => e.stopPropagation()}>
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: selectedUser.avatar_color }}>
                      {getInitials(selectedUser.username)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">@{selectedUser.username}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>Age {selectedUser.age}</span>
                        <span className="capitalize">{selectedUser.skin_type} skin</span>
                        <span className="capitalize">{selectedUser.climate}</span>
                      </div>
                    </div>
                    <button onClick={() => setSelectedUser(null)} className="ml-auto text-gray-400 hover:text-gray-600">
                      <span className="sr-only">Close</span>✕
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {selectedUser.concerns.map(c => (
                      <span key={c} className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs capitalize">{c}</span>
                    ))}
                  </div>
                  <div className="text-sm text-gray-500 mb-4">{selectedUser.products_helped} products reviewed</div>
                  <h4 className="font-bold text-gray-900 mb-3">Reviews ({userReviews.length})</h4>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {userReviews.map((rev, i) => (
                      <div key={i} className="bg-gray-50 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">{rev.product_name}</span>
                          <StarRating rating={rev.rating} />
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{rev.review}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span>{rev.brand}</span>
                          <span>·</span>
                          <span className="capitalize">{rev.category}</span>
                          <span>·</span>
                          <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {rev.helpful} found helpful</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
