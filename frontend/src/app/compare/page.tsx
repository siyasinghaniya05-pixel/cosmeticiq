'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, X, BarChart3, Shield, FlaskConical,
  DollarSign, Star, AlertTriangle, Loader2, AlertCircle
} from 'lucide-react';
import { getErrorMessage } from '@/lib/errors';

interface Product {
  id: number;
  name: string;
  brand: string;
  price: number;
  rating: number;
}

export default function ComparePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const searchProducts = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setError(null);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/products/search/${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();
      setSearchResults(data.products || []);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setIsSearching(false);
    }
  };

  const addProduct = (product: Product) => {
    if (products.length < 4 && !products.find(p => p.id === product.id)) {
      setProducts([...products, product]);
    }
    setSearchResults([]);
    setSearchQuery('');
  };

  const removeProduct = (id: number) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const compareProducts = async () => {
    if (products.length < 2) return;
    setIsComparing(true);
    setError(null);
    setComparisonResult(null);

    try {
      const token = localStorage.getItem('token');
      let url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/recommendations/compare`;
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/recommendations/compare`;
      } else {
        url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/recommendations/compare-public`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          product_ids: products.map(p => p.id),
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error ${response.status}`);
      }

      const data = await response.json();
      setComparisonResult(data);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Product Comparator</h1>
        <p className="text-gray-500">
          Compare up to 4 products side-by-side with fuzzy logic analysis
        </p>
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass p-4 border-red-500/50 flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-300">{error}</span>
        </motion.div>
      )}

      {/* Product Selection */}
      <div className="glass p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Products to Compare</h3>
        
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products (e.g., CeraVe, sunscreen, serum)..."
            className="input-glass flex-1"
            onKeyPress={(e) => e.key === 'Enter' && searchProducts()}
          />
          <button
            onClick={searchProducts}
            disabled={isSearching}
            className="glass-button"
          >
            {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mb-4 p-4 bg-gray-100 rounded-xl max-h-60 overflow-y-auto">
            {searchResults.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                onClick={() => addProduct(product)}
              >
                <div>
                  <p className="text-gray-900">{product.name}</p>
                  <p className="text-gray-500 text-sm">{product.brand} &middot; ${product.price}</p>
                </div>
                <button
                  disabled={products.length >= 4 || products.find(p => p.id === product.id) !== undefined}
                  className="text-pink-400 hover:text-pink-300 disabled:text-gray-600"
                >
                  {products.find(p => p.id === product.id) ? (
                    <span className="text-green-400 text-sm">Added</span>
                  ) : (
                    <Plus className="w-5 h-5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Selected Products */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="glass p-4 relative"
            >
              <button
                onClick={() => removeProduct(product.id)}
                className="absolute top-2 right-2 text-gray-500 hover:text-red-400"
              >
                <X className="w-4 h-4" />
              </button>
              <p className="text-gray-900 font-medium pr-6">{product.name}</p>
              <p className="text-gray-500 text-sm">{product.brand}</p>
              {product.price && (
                <p className="text-pink-400 mt-2">${product.price}</p>
              )}
            </div>
          ))}
          
          {products.length < 4 && (
            <div className="glass p-4 border-dashed border-gray-200 text-gray-500 flex items-center justify-center min-h-[100px]">
              <Plus className="w-8 h-8" />
            </div>
          )}
        </div>

        {products.length >= 2 && (
          <button
            onClick={compareProducts}
            disabled={isComparing}
            className="glass-button mt-6 w-full flex items-center justify-center gap-2"
          >
            {isComparing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing with Fuzzy Logic...
              </>
            ) : (
              <>
                <BarChart3 className="w-5 h-5" />
                Compare Products
              </>
            )}
          </button>
        )}
      </div>

      {/* Comparison Results */}
      {comparisonResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <h2 className="text-2xl font-bold text-gray-900">Comparison Results</h2>

          {/* Suitability Scores */}
          <div className="glass p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              Fuzzy Suitability Scores
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {comparisonResult.products?.map((rec: any, idx: number) => {
                const score = rec.fuzzy_output?.suitability_score ?? 0;
                return (
                  <div key={idx} className="text-center glass p-4 rounded-xl">
                    <div className="text-4xl font-bold gradient-text">
                      {(score * 100).toFixed(0)}%
                    </div>
                    <p className="text-gray-900 text-sm mt-1">{rec.product?.name}</p>
                    <p className="text-gray-500 text-xs">
                      {rec.fuzzy_output?.linguistic_output || 'N/A'}
                    </p>
                    <p className="text-pink-400 text-xs mt-1">
                      ${rec.product?.price}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Comparison Table */}
          <div className="glass p-6 overflow-x-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-400" />
              Detailed Breakdown
            </h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-gray-500 py-3 px-2">Metric</th>
                  {comparisonResult.products?.map((rec: any, idx: number) => (
                    <th key={idx} className="text-center text-gray-900 py-3 px-2">{rec.product?.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="text-gray-500 py-3 px-2">Brand</td>
                  {comparisonResult.products?.map((rec: any, idx: number) => (
                    <td key={idx} className="text-center text-gray-900 py-3 px-2">{rec.product?.brand}</td>
                  ))}
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="text-gray-500 py-3 px-2">Price</td>
                  {comparisonResult.products?.map((rec: any, idx: number) => (
                    <td key={idx} className="text-center text-pink-400 py-3 px-2">${rec.product?.price}</td>
                  ))}
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="text-gray-500 py-3 px-2">Suitability</td>
                  {comparisonResult.products?.map((rec: any, idx: number) => (
                    <td key={idx} className="text-center text-green-400 py-3 px-2 font-bold">
                      {((rec.fuzzy_output?.suitability_score ?? 0) * 100).toFixed(0)}%
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="text-gray-500 py-3 px-2">Confidence</td>
                  {comparisonResult.products?.map((rec: any, idx: number) => (
                    <td key={idx} className="text-center text-gray-900 py-3 px-2">
                      {((rec.confidence_score ?? 0.5) * 100).toFixed(0)}%
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="text-gray-500 py-3 px-2">Linguistic</td>
                  {comparisonResult.products?.map((rec: any, idx: number) => (
                    <td key={idx} className="text-center text-purple-400 py-3 px-2">
                      {rec.fuzzy_output?.linguistic_output || 'N/A'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="text-gray-500 py-3 px-2">Explanation</td>
                  {comparisonResult.products?.map((rec: any, idx: number) => (
                    <td key={idx} className="text-center text-gray-600 py-3 px-2 text-xs leading-relaxed">
                      {rec.explanation ? rec.explanation.substring(0, 120) + '...' : 'N/A'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Recommendation */}
          {comparisonResult.recommendation && (
            <div className="glass p-6 border-purple-500/30">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Recommendation</h3>
              <p className="text-gray-600">{comparisonResult.recommendation}</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Empty State */}
      {!comparisonResult && products.length < 2 && (
        <div className="glass p-12 text-center">
          <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Select Products to Compare
          </h3>
          <p className="text-gray-500">
            Search and add at least 2 products to see a detailed fuzzy logic comparison
          </p>
        </div>
      )}
    </div>
  );
}
