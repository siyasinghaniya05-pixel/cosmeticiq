'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FlaskConical, Search, AlertTriangle, 
  CheckCircle2, XCircle, Info, ExternalLink 
} from 'lucide-react';

export default function AnalyzePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [ingredientInfo, setIngredientInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const searchIngredient = async () => {
    if (!searchTerm.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/ingredients/search/${encodeURIComponent(searchTerm)}`
      );
      const data = await response.json();
      setIngredientInfo(data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSafetyColor = (score: number) => {
    if (score >= 0.7) return 'text-green-400';
    if (score >= 0.5) return 'text-yellow-400';
    if (score >= 0.3) return 'text-orange-400';
    return 'text-red-400';
  };

  const getSafetyLabel = (score: number) => {
    if (score >= 0.7) return 'Safe';
    if (score >= 0.5) return 'Moderate';
    if (score >= 0.3) return 'Caution';
    return 'Avoid';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Ingredient Analyzer</h1>
        <p className="text-gray-500">
          Search any ingredient to learn about its safety, functions, and scientific evidence
        </p>
      </motion.div>

      {/* Search */}
      <div className="glass p-6">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search ingredient (e.g., Retinol, Hyaluronic Acid, Paraben...)"
              className="input-glass pl-12"
              onKeyPress={(e) => e.key === 'Enter' && searchIngredient()}
            />
          </div>
          <button
            onClick={searchIngredient}
            disabled={isLoading}
            className="glass-button"
          >
            {isLoading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
      </div>

      {/* Results */}
      {ingredientInfo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Main Info Card */}
          <div className="glass p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">{ingredientInfo.name}</h2>
                {ingredientInfo.inci_name && (
                  <p className="text-gray-500">INCI: {ingredientInfo.inci_name}</p>
                )}
              </div>
              <div className={`text-right ${getSafetyColor(ingredientInfo.safety_score)}`}>
                <div className="text-4xl font-bold">
                  {(ingredientInfo.safety_score * 100).toFixed(0)}%
                </div>
                <div className="text-sm">{getSafetyLabel(ingredientInfo.safety_score)}</div>
              </div>
            </div>

            <p className="text-gray-600 mb-6">{ingredientInfo.description}</p>

            {/* Safety Meter */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Safety Score</span>
                <span className={getSafetyColor(ingredientInfo.safety_score)}>
                  {getSafetyLabel(ingredientInfo.safety_score)}
                </span>
              </div>
              <div className="safety-meter">
                <div
                  className={`safety-meter-fill ${
                    ingredientInfo.safety_score >= 0.7
                      ? 'safety-excellent'
                      : ingredientInfo.safety_score >= 0.5
                      ? 'safety-good'
                      : ingredientInfo.safety_score >= 0.3
                      ? 'safety-moderate'
                      : 'safety-dangerous'
                  }`}
                  style={{ width: `${ingredientInfo.safety_score * 100}%` }}
                />
              </div>
            </div>

            {/* Functions */}
            {ingredientInfo.functions?.length > 0 && (
              <div className="mb-6">
                <h4 className="text-gray-900 font-semibold mb-3">Functions</h4>
                <div className="flex flex-wrap gap-2">
                  {ingredientInfo.functions.map((func: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm border border-purple-500/30"
                    >
                      {func}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Safety Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass p-4">
              <div className="flex items-center gap-2 mb-2">
                {ingredientInfo.is_comedogenic ? (
                  <XCircle className="w-5 h-5 text-red-400" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                )}
                <span className="text-gray-900 text-sm">Comedogenic</span>
              </div>
              {ingredientInfo.is_comedogenic && (
                <p className="text-gray-500 text-xs">
                  Rating: {ingredientInfo.comedogenic_rating}/5
                </p>
              )}
            </div>

            <div className="glass p-4">
              <div className="flex items-center gap-2 mb-2">
                {ingredientInfo.is_fragrance ? (
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                )}
                <span className="text-gray-900 text-sm">Fragrance</span>
              </div>
              {ingredientInfo.is_fragrance && (
                <p className="text-gray-500 text-xs">Potential allergen</p>
              )}
            </div>

            <div className="glass p-4">
              <div className="flex items-center gap-2 mb-2">
                {ingredientInfo.is_allergen ? (
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                )}
                <span className="text-gray-900 text-sm">Allergen</span>
              </div>
              {ingredientInfo.is_allergen && (
                <p className="text-gray-500 text-xs">May cause reactions</p>
              )}
            </div>

            <div className="glass p-4">
              <div className="flex items-center gap-2 mb-2">
                {ingredientInfo.is_endocrine_disruptor ? (
                  <XCircle className="w-5 h-5 text-red-400" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                )}
                <span className="text-gray-900 text-sm">Endocrine</span>
              </div>
              {ingredientInfo.is_endocrine_disruptor && (
                <p className="text-gray-500 text-xs">Hormone disruption</p>
              )}
            </div>
          </div>

          {/* Additional Warnings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`glass p-4 ${ingredientInfo.is_pregnancy_unsafe ? 'border-yellow-500/50' : ''}`}>
              <div className="flex items-center gap-2">
                {ingredientInfo.is_pregnancy_unsafe ? (
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                )}
                <span className="text-gray-900">Pregnancy Safe</span>
              </div>
              {ingredientInfo.is_pregnancy_unsafe && (
                <p className="text-yellow-300 text-sm mt-2">
                  Not recommended during pregnancy
                </p>
              )}
            </div>

            <div className={`glass p-4 ${ingredientInfo.is_microplastic ? 'border-red-500/50' : ''}`}>
              <div className="flex items-center gap-2">
                {ingredientInfo.is_microplastic ? (
                  <XCircle className="w-5 h-5 text-red-400" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                )}
                <span className="text-gray-900">Microplastic</span>
              </div>
              {ingredientInfo.is_microplastic && (
                <p className="text-red-300 text-sm mt-2">
                  Environmental concern
                </p>
              )}
            </div>

            <div className={`glass p-4 ${ingredientInfo.is_irritant ? 'border-orange-500/50' : ''}`}>
              <div className="flex items-center gap-2">
                {ingredientInfo.is_irritant ? (
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                )}
                <span className="text-gray-900">Irritant</span>
              </div>
              {ingredientInfo.is_irritant && (
                <p className="text-orange-300 text-sm mt-2">
                  May cause irritation
                </p>
              )}
            </div>
          </div>

          {/* Warnings */}
          {ingredientInfo.warnings?.length > 0 && (
            <div className="glass p-6 border-yellow-500/30">
              <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                Warnings & Precautions
              </h4>
              <ul className="space-y-2">
                {ingredientInfo.warnings.map((warning: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-600">
                    <span className="text-yellow-400">•</span>
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* External References */}
          <div className="glass p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-400" />
              Scientific References
            </h4>
            <div className="space-y-2">
              <a
                href={`https://www.ewg.org/skindeep/search/?search=${encodeURIComponent(ingredientInfo.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
              >
                <ExternalLink className="w-4 h-4" />
                EWG Skin Deep Database
              </a>
              <a
                href={`https://incidecoder.com/ingredients/${encodeURIComponent(ingredientInfo.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
              >
                <ExternalLink className="w-4 h-4" />
                INCIDecoder
              </a>
              <a
                href={`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(ingredientInfo.name + ' cosmetic')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
              >
                <ExternalLink className="w-4 h-4" />
                PubMed Research
              </a>
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick Links */}
      {!ingredientInfo && (
        <div className="glass p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Popular Ingredients</h3>
          <div className="flex flex-wrap gap-3">
            {[
              'Hyaluronic Acid', 'Retinol', 'Vitamin C', 'Niacinamide',
              'Salicylic Acid', 'Glycolic Acid', 'Ceramides', 'Aloe Vera',
              'Paraben', 'Alcohol Denat', 'Fragrance', 'Formaldehyde'
            ].map((ing) => (
              <button
                key={ing}
                onClick={() => {
                  setSearchTerm(ing);
                  setTimeout(() => searchIngredient(), 100);
                }}
                className="px-4 py-2 glass rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all"
              >
                {ing}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
