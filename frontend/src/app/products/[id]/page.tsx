'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft, Shield, FlaskConical, Brain,
  Star, DollarSign, AlertTriangle, CheckCircle2,
  ExternalLink, Loader2, Heart, BarChart3
} from 'lucide-react';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [params.id]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/products/${params.id}`
      );
      const data = await response.json();
      setProduct(data);
    } catch (error) {
      console.error('Failed to fetch product');
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeProduct = async () => {
    setIsAnalyzing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/recommendations/analyze`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ product_id: product.id }),
        }
      );
      const data = await response.json();
      setAnalysis(data);
    } catch (error) {
      console.error('Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-900">Product not found</h2>
        <Link href="/scan" className="text-pink-400 mt-4 inline-block">
          Back to Scanner
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>

      {/* Product Header */}
      <div className="glass p-8">
        <div className="flex flex-col md:flex-row gap-8">
          {product.image_url && (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full md:w-64 h-64 object-cover rounded-xl"
            />
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
            <p className="text-xl text-gray-500 mb-4">{product.brand}</p>
            
            <div className="flex flex-wrap gap-4 mb-6">
              {product.price && (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  <span className="text-gray-900 text-xl">${product.price}</span>
                </div>
              )}
              {product.rating > 0 && (
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span className="text-gray-900">{product.rating}/5</span>
                  <span className="text-gray-500">({product.review_count} reviews)</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {product.is_vegan && (
                <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">
                  Vegan
                </span>
              )}
              {product.is_cruelty_free && (
                <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                  Cruelty-Free
                </span>
              )}
              {product.is_organic && (
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-sm">
                  Organic
                </span>
              )}
            </div>

            {product.description && (
              <p className="text-gray-600 mb-6">{product.description}</p>
            )}

            <button
              onClick={analyzeProduct}
              disabled={isAnalyzing}
              className="glass-button flex items-center gap-2"
            >
              {isAnalyzing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Brain className="w-5 h-5" />
              )}
              {isAnalyzing ? 'Analyzing...' : 'Analyze for My Profile'}
            </button>
          </div>
        </div>
      </div>

      {/* Safety Scores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Safety Score', value: product.safety_score || 0.5, icon: Shield },
          { label: 'Scientific Score', value: product.scientific_score || 0.5, icon: FlaskConical },
          { label: 'Comedogenic', value: product.comedogenic_score || 0, icon: AlertTriangle, max: 5 },
          { label: 'Fragrance', value: product.fragrance_level || 0, icon: AlertTriangle },
        ].map((metric) => (
          <div key={metric.label} className="glass-card text-center">
            <metric.icon className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {metric.max ? metric.value.toFixed(1) : (metric.value * 100).toFixed(0)}%
            </p>
            <p className="text-gray-500 text-sm">{metric.label}</p>
          </div>
        ))}
      </div>

      {/* Analysis Results */}
      {analysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Fuzzy Score */}
          <div className="glass p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Fuzzy Logic Suitability</h3>
            <div className="text-6xl font-bold gradient-text mb-2">
              {(analysis.fuzzy_output?.suitability_score * 100).toFixed(0)}%
            </div>
            <p className={`text-2xl font-semibold ${
              analysis.fuzzy_output?.linguistic_output === 'Excellent' ? 'text-green-400' :
              analysis.fuzzy_output?.linguistic_output === 'Good' ? 'text-emerald-400' :
              analysis.fuzzy_output?.linguistic_output === 'Average' ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {analysis.fuzzy_output?.linguistic_output}
            </p>
          </div>

          {/* Explanation */}
          <div className="glass p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Explanation</h3>
            <div className="text-gray-600 whitespace-pre-wrap">
              {analysis.explanation}
            </div>
          </div>

          {/* Triggered Rules */}
          {analysis.fuzzy_output?.triggered_rules?.length > 0 && (
            <div className="glass p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-400" />
                Fuzzy Rules Triggered
              </h3>
              <div className="space-y-2">
                {analysis.fuzzy_output.triggered_rules.map((rule: any, idx: number) => (
                  <div key={idx} className="p-3 glass-card text-sm">
                    <span className="text-purple-400">Rule #{idx + 1}:</span>{' '}
                    <span className="text-gray-600">
                      {Object.entries(rule.conditions || {}).map(([k, v]) => (
                        <span key={k}>
                          <span className="text-gray-900">{k.replace(/_/g, ' ')}</span> is{' '}
                          <span className="text-pink-400">{v as string}</span>
                        </span>
                      )).reduce((prev: any, curr: any) => [prev, ' AND ', curr], '')}
                    </span>
                    <span className="text-gray-500"> → </span>
                    <span className="text-green-400">{rule.output}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Link href="/compare" className="glass-button flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Compare Products
        </Link>
        <button className="glass flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-900">
          <Heart className="w-5 h-5" />
          Add to Wishlist
        </button>
      </div>
    </div>
  );
}
