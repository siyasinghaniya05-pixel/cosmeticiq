'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Network, ArrowRight, AlertTriangle, CheckCircle2, XCircle, ZoomIn, ZoomOut, RotateCcw, Info, X, ChevronRight, Sparkles, Zap, Heart, Shield, ShieldCheck, Sun, Droplets, Leaf, Target, TrendingUp, Dna, FlaskConical } from 'lucide-react';
import api from '@/lib/api';

interface GraphNode {
  id: string;
  name: string;
  category: string;
  description: string;
  color: string;
  icon: string;
  degree: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface GraphEdge {
  source: string;
  target: string;
  type: string;
  label: string;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  categories: Record<string, string>;
  stats: Record<string, number>;
}

interface IngredientDetail {
  id: string;
  name: string;
  category: string;
  description: string;
  benefits: string[];
  side_effects: string[];
  compatible: string[];
  conflicting: string[];
  frequency: string;
  concentration: string;
  color: string;
  icon: string;
}

const ICON_MAP: Record<string, any> = {
  Sparkles, Sun, Shield, Droplets, FlaskConical, Zap, ShieldCheck, Heart,
  Target, TrendingUp, Dna, Leaf, AlertTriangle,
};

const CATEGORY_LABELS: Record<string, string> = {
  active: 'Active Ingredient',
  antioxidant: 'Antioxidant',
  hydrating: 'Hydrating',
  exfoliant: 'Exfoliant',
  emollient: 'Emollient',
};

function forceLayout(nodes: GraphNode[], edges: GraphEdge[], width: number, height: number): GraphNode[] {
  const positioned = nodes.map((n, i) => {
    const angle = (2 * Math.PI * i) / nodes.length;
    const radius = Math.min(width, height) * 0.32;
    return {
      ...n,
      x: width / 2 + radius * Math.cos(angle),
      y: height / 2 + radius * Math.sin(angle),
      vx: 0,
      vy: 0,
    };
  });

  const nodeMap = new Map(positioned.map(n => [n.id, n]));
  const repulsion = 8000;
  const attraction = 0.005;
  const centerPull = 0.01;
  const damping = 0.9;
  const iterations = 200;

  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < positioned.length; i++) {
      let fx = 0, fy = 0;
      for (let j = 0; j < positioned.length; j++) {
        if (i === j) continue;
        const dx = positioned[i].x! - positioned[j].x!;
        const dy = positioned[i].y! - positioned[j].y!;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        fx += (dx / dist) * repulsion / (dist * dist);
        fy += (dy / dist) * repulsion / (dist * dist);
      }
      positioned[i].vx = (positioned[i].vx! + fx) * damping;
      positioned[i].vy = (positioned[i].vy! + fy) * damping;
    }

    for (const edge of edges) {
      const s = nodeMap.get(edge.source);
      const t = nodeMap.get(edge.target);
      if (!s || !t) continue;
      const dx = t.x! - s.x!;
      const dy = t.y! - s.y!;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const idealDist = edge.type === 'conflicting' ? 200 : 120;
      const force = (dist - idealDist) * attraction;
      s.vx += (dx / dist) * force;
      s.vy += (dy / dist) * force;
      t.vx -= (dx / dist) * force;
      t.vy -= (dy / dist) * force;
    }

    for (const node of positioned) {
      node.vx += (width / 2 - node.x!) * centerPull;
      node.vy += (height / 2 - node.y!) * centerPull;
      node.x! += node.vx!;
      node.y! += node.vy!;
      node.x = Math.max(60, Math.min(width - 60, node.x!));
      node.y = Math.max(60, Math.min(height - 60, node.y!));
    }
  }

  return positioned;
}

export default function KnowledgeGraphPage() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<IngredientDetail | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());
  const [highlightType, setHighlightType] = useState<'compatible' | 'conflicting' | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [showLegend, setShowLegend] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 650 });

  useEffect(() => {
    api.get('/knowledge-graph/graph')
      .then(r => { setGraphData(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const positionedNodes = useMemo(() => {
    if (!graphData) return [];
    const nodes = filterCategory
      ? graphData.nodes.filter(n => n.category === filterCategory)
      : graphData.nodes;
    return forceLayout(nodes, graphData.edges, dimensions.width, dimensions.height);
  }, [graphData, filterCategory, dimensions]);

  const nodeMap = useMemo(() => new Map(positionedNodes.map(n => [n.id, n])), [positionedNodes]);

  const visibleEdges = useMemo(() => {
    if (!graphData) return [];
    return graphData.edges.filter(e => nodeMap.has(e.source) && nodeMap.has(e.target));
  }, [graphData, nodeMap]);

  const handleNodeClick = useCallback(async (nodeId: string) => {
    setSelectedNode(nodeId);
    try {
      const r = await api.get(`/knowledge-graph/ingredient/${nodeId}`);
      setSelectedDetail(r.data);
    } catch { setSelectedDetail(null); }

    const neighbors = new Set<string>([nodeId]);
    const typeSet = new Set<'compatible' | 'conflicting'>();
    for (const edge of visibleEdges) {
      if (edge.source === nodeId || edge.target === nodeId) {
        const neighbor = edge.source === nodeId ? edge.target : edge.source;
        neighbors.add(neighbor);
        typeSet.add(edge.type as 'compatible' | 'conflicting');
      }
    }
    setHighlightedNodes(neighbors);
    setHighlightType(typeSet.has('conflicting') ? 'conflicting' : 'compatible');
  }, [visibleEdges]);

  const handleClearSelection = () => {
    setSelectedNode(null);
    setSelectedDetail(null);
    setHighlightedNodes(new Set());
    setHighlightType(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.max(0.3, Math.min(3, z + (e.deltaY > 0 ? -0.1 : 0.1))));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as Element).closest('.graph-node')) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
  };

  const handleMouseUp = () => setIsPanning(false);

  const filteredSearchResults = useMemo(() => {
    if (!graphData || searchQuery.length < 1) return [];
    const q = searchQuery.toLowerCase();
    return graphData.nodes.filter(n => n.name.toLowerCase().includes(q) || n.id.includes(q)).slice(0, 8);
  }, [graphData, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
          <Network className="w-12 h-12 text-pink-500" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Ingredient <span className="gradient-text">Knowledge Graph</span>
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explore how skincare ingredients interact. Click any node to see benefits, side effects, and relationships.
          </p>
        </motion.div>

        {/* Stats */}
        {graphData && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="flex flex-wrap justify-center gap-4 mb-6">
            {[
              { label: 'Ingredients', value: graphData.stats.total_ingredients, color: 'text-pink-600' },
              { label: 'Compatible Pairs', value: graphData.stats.compatible_pairs, color: 'text-emerald-600' },
              { label: 'Conflicting Pairs', value: graphData.stats.conflicting_pairs, color: 'text-red-500' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-200 px-5 py-3 flex items-center gap-3">
                <span className={`text-2xl font-bold ${s.color}`}>{s.value}</span>
                <span className="text-sm text-gray-500">{s.label}</span>
              </div>
            ))}
          </motion.div>
        )}

        <div className="flex gap-6">
          {/* Controls Sidebar */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="w-72 flex-shrink-0 space-y-4">

            {/* Search */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 relative">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Search Ingredients</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="e.g. Retinol, Vitamin C..."
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
              {filteredSearchResults.length > 0 && (
                <div className="mt-2 space-y-1">
                  {filteredSearchResults.map(n => (
                    <button key={n.id} onClick={() => { handleNodeClick(n.id); setSearchQuery(''); }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 flex items-center gap-2 transition-colors">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: n.color }} />
                      <span className="text-sm text-gray-700 truncate">{n.name}</span>
                      <ChevronRight className="w-3 h-3 text-gray-400 ml-auto flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Category Filter */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Filter by Category</h3>
              <div className="space-y-2">
                <button onClick={() => setFilterCategory(null)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!filterCategory ? 'bg-pink-50 text-pink-600 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}>
                  All Ingredients ({graphData?.stats.total_ingredients})
                </button>
                {graphData && Object.entries(graphData.categories).map(([cat, color]) => {
                  const count = graphData.nodes.filter(n => n.category === cat).length;
                  return (
                    <button key={cat} onClick={() => setFilterCategory(filterCategory === cat ? null : cat)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${filterCategory === cat ? 'bg-pink-50 text-pink-600 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}>
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                      <span className="capitalize">{CATEGORY_LABELS[cat] || cat}</span>
                      <span className="ml-auto text-gray-400 text-xs">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Zoom Controls */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">View Controls</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setZoom(z => Math.min(3, z + 0.2))}
                  className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                  <ZoomIn className="w-4 h-4 text-gray-600" />
                </button>
                <span className="text-sm text-gray-500 flex-1 text-center">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(z => Math.max(0.3, z - 0.2))}
                  className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                  <ZoomOut className="w-4 h-4 text-gray-600" />
                </button>
                <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
                  className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                  <RotateCcw className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Legend */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <button onClick={() => setShowLegend(!showLegend)}
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 w-full">
                <Info className="w-4 h-4" /> How to Read This Graph
              </button>
              <AnimatePresence>
                {showLegend && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="mt-3 space-y-2 text-xs text-gray-600">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-0.5 bg-emerald-400 rounded" />
                        <span>Compatible — safe to use together</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-0.5 bg-red-400 rounded border-dashed" style={{ borderTop: '2px dashed #f87171', height: 0, background: 'none' }} />
                        <span>Conflicting — avoid combining</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-pink-400" />
                        <span>Larger node = more connections</span>
                      </div>
                      <p className="pt-2 text-gray-400">Click a node to see full ingredient details. Scroll to zoom. Drag to pan.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Graph Area */}
          <div className="flex-1 relative">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm"
              style={{ height: '700px', cursor: isPanning ? 'grabbing' : 'grab' }}>
              <svg ref={svgRef} width="100%" height="100%" viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
                onWheel={handleWheel} onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
                <defs>
                  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.1" />
                  </filter>
                </defs>

                <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                  {/* Edges */}
                  {visibleEdges.map((edge, i) => {
                    const s = nodeMap.get(edge.source);
                    const t = nodeMap.get(edge.target);
                    if (!s || !t) return null;
                    const isHighlighted = highlightedNodes.has(edge.source) && highlightedNodes.has(edge.target);
                    const isCompatible = edge.type === 'compatible';
                    const opacity = highlightedNodes.size === 0 ? 0.15 : isHighlighted ? 0.8 : 0.04;
                    const midX = (s.x! + t.x!) / 2;
                    const midY = (s.y! + t.y!) / 2;
                    const dx = t.x! - s.x!;
                    const dy = t.y! - s.y!;
                    const curveOffset = isCompatible ? 0 : Math.sqrt(dx * dx + dy * dy) * 0.15;
                    const normX = -dy / (Math.sqrt(dx * dx + dy * dy) || 1);
                    const normY = dx / (Math.sqrt(dx * dx + dy * dy) || 1);
                    return (
                      <g key={i}>
                        <path
                          d={`M ${s.x} ${s.y} Q ${midX + normX * curveOffset} ${midY + normY * curveOffset} ${t.x} ${t.y}`}
                          fill="none"
                          stroke={isCompatible ? '#10b981' : '#ef4444'}
                          strokeWidth={isHighlighted ? 2.5 : 1.2}
                          strokeDasharray={isCompatible ? 'none' : '6 4'}
                          opacity={opacity}
                          strokeLinecap="round"
                        />
                        {isHighlighted && (
                          <circle cx={midX + normX * curveOffset * 0.5} cy={midY + normY * curveOffset * 0.5}
                            r="3" fill={isCompatible ? '#10b981' : '#ef4444'} opacity={0.6} />
                        )}
                      </g>
                    );
                  })}

                  {/* Nodes */}
                  {positionedNodes.map(node => {
                    const isSelected = selectedNode === node.id;
                    const isHighlighted = highlightedNodes.size === 0 || highlightedNodes.has(node.id);
                    const IconComp = ICON_MAP[node.icon] || Sparkles;
                    const nodeRadius = 22 + Math.min(node.degree * 2, 14);
                    return (
                      <g key={node.id} className="graph-node" style={{ cursor: 'pointer' }}
                        onClick={(e) => { e.stopPropagation(); handleNodeClick(node.id); }}>
                        {/* Glow ring on selected */}
                        {isSelected && (
                          <circle cx={node.x} cy={node.y} r={nodeRadius + 10}
                            fill="none" stroke={node.color} strokeWidth="2" opacity="0.4"
                            filter="url(#glow)" />
                        )}
                        {/* Main circle */}
                        <circle cx={node.x} cy={node.y} r={nodeRadius}
                          fill={isHighlighted ? node.color : '#e5e7eb'}
                          opacity={isHighlighted ? 1 : 0.2}
                          stroke={isSelected ? '#1f2937' : '#fff'}
                          strokeWidth={isSelected ? 3 : 2}
                          filter={isSelected ? 'url(#shadow)' : undefined}
                          style={{ transition: 'all 0.3s ease' }}
                        />
                        {/* Icon */}
                        <foreignObject x={node.x! - 10} y={node.y! - 10} width={20} height={20}
                          style={{ pointerEvents: 'none' }}>
                          <IconComp className="w-5 h-5 text-white" style={{ opacity: isHighlighted ? 1 : 0.3 }} />
                        </foreignObject>
                        {/* Label */}
                        <text x={node.x} y={node.y! + nodeRadius + 14}
                          textAnchor="middle" fontSize="11" fontWeight={isSelected ? '700' : '500'}
                          fill={isHighlighted ? '#1f2937' : '#d1d5db'}
                          style={{ pointerEvents: 'none', transition: 'fill 0.3s' }}>
                          {node.name}
                        </text>
                      </g>
                    );
                  })}
                </g>
              </svg>
            </div>

            {/* Detail Panel */}
            <AnimatePresence>
              {selectedDetail && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="absolute top-4 right-4 w-80 bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden"
                  style={{ maxHeight: 'calc(100% - 2rem)' }}>
                  <div className="p-5 overflow-y-auto" style={{ maxHeight: '650px' }}>
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: selectedDetail.color }}>
                          {(() => { const I = ICON_MAP[selectedDetail.icon] || Sparkles; return <I className="w-5 h-5 text-white" />; })()}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{selectedDetail.name}</h3>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                            style={{ backgroundColor: selectedDetail.color + '20', color: selectedDetail.color }}>
                            {CATEGORY_LABELS[selectedDetail.category] || selectedDetail.category}
                          </span>
                        </div>
                      </div>
                      <button onClick={handleClearSelection} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <p className="text-sm text-gray-600 mb-4">{selectedDetail.description}</p>

                    {/* Quick Info */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-gray-50 rounded-lg px-3 py-2">
                        <div className="text-xs text-gray-400">Frequency</div>
                        <div className="text-sm font-medium text-gray-700">{selectedDetail.frequency}</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg px-3 py-2">
                        <div className="text-xs text-gray-400">Concentration</div>
                        <div className="text-sm font-medium text-gray-700">{selectedDetail.concentration}</div>
                      </div>
                    </div>

                    {/* Benefits */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Benefits
                      </h4>
                      <div className="space-y-1">
                        {selectedDetail.benefits.map((b, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                            <span className="text-emerald-400 mt-0.5">&#8226;</span>{b}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Side Effects */}
                    {selectedDetail.side_effects.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-500" /> Side Effects
                        </h4>
                        <div className="space-y-1">
                          {selectedDetail.side_effects.map((s, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                              <span className="text-amber-400 mt-0.5">&#8226;</span>{s}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Compatible */}
                    {selectedDetail.compatible.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Compatible With
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedDetail.compatible.map((c, i) => (
                            <button key={i}
                              onClick={() => { const n = graphData?.nodes.find(x => x.id === c.toLowerCase()); if (n) handleNodeClick(n.id); }}
                              className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs hover:bg-emerald-100 transition-colors">
                              {graphData?.nodes.find(x => x.id === c.toLowerCase())?.name || c}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Conflicting */}
                    {selectedDetail.conflicting.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                          <XCircle className="w-4 h-4 text-red-500" /> Conflicts With
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedDetail.conflicting.map((c, i) => (
                            <button key={i}
                              onClick={() => { const n = graphData?.nodes.find(x => x.id === c.toLowerCase()); if (n) handleNodeClick(n.id); }}
                              className="px-2.5 py-1 bg-red-50 text-red-600 rounded-full text-xs hover:bg-red-100 transition-colors">
                              {graphData?.nodes.find(x => x.id === c.toLowerCase())?.name || c}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
