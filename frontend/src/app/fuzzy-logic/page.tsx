'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, Sliders, ArrowRight, Info,
  ChevronDown, ChevronUp
} from 'lucide-react';

const skinTypes = ['dry', 'oily', 'combination', 'sensitive', 'acne_prone', 'normal'];
const climates = ['humid', 'dry', 'cold', 'temperate', 'tropical', 'moderate'];

export default function FuzzyLogicPage() {
  const [inputs, setInputs] = useState({
    skin_type: 'normal',
    age: 30,
    climate: 'moderate',
    budget: 200,
    ingredient_safety: 0.7,
    comedogenic_rating: 0,
    fragrance_level: 0.2,
    alcohol_presence: 0.1,
    product_rating: 3.5,
    scientific_evidence: 0.7,
    dermatologist_approval: 0.6,
  });
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const evaluateFuzzy = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/recommendations/fuzzy-evaluate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(inputs),
        }
      );
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Evaluation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const sliders = [
    { key: 'ingredient_safety', label: 'Ingredient Safety', min: 0, max: 1, step: 0.1 },
    { key: 'comedogenic_rating', label: 'Comedogenic Rating', min: 0, max: 5, step: 0.5 },
    { key: 'fragrance_level', label: 'Fragrance Level', min: 0, max: 1, step: 0.1 },
    { key: 'alcohol_presence', label: 'Alcohol Presence', min: 0, max: 1, step: 0.1 },
    { key: 'product_rating', label: 'Product Rating', min: 0, max: 5, step: 0.5 },
    { key: 'scientific_evidence', label: 'Scientific Evidence', min: 0, max: 1, step: 0.1 },
    { key: 'dermatologist_approval', label: 'Dermatologist Approval', min: 0, max: 1, step: 0.1 },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
          <Brain className="w-10 h-10 text-purple-400" />
          Fuzzy Logic Decision Engine
        </h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Our core decision engine uses soft computing and fuzzy logic to mimic human decision-making.
          Unlike simple scoring, fuzzy logic considers multiple factors simultaneously.
        </p>
      </motion.div>

      {/* How It Works */}
      <div className="glass p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-400" />
          How Fuzzy Logic Works
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="glass-card p-4">
            <h4 className="text-pink-400 font-medium mb-2">1. Fuzzification</h4>
            <p className="text-gray-500">
              Convert crisp input values (like "fragrance = 0.8") into fuzzy sets 
              (like "fragrance = HIGH with 0.9 membership").
            </p>
          </div>
          <div className="glass-card p-4">
            <h4 className="text-purple-400 font-medium mb-2">2. Rule Evaluation</h4>
            <p className="text-gray-500">
              Apply 50+ IF-THEN rules that encode expert knowledge. 
              Multiple rules can fire simultaneously with different strengths.
            </p>
          </div>
          <div className="glass-card p-4">
            <h4 className="text-indigo-400 font-medium mb-2">3. Defuzzification</h4>
            <p className="text-gray-500">
              Convert the fuzzy output back to a crisp suitability score using 
              centroid calculation for precise recommendations.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Controls */}
        <div className="space-y-6">
          <div className="glass p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-purple-400" />
              Configure Inputs
            </h3>

            {/* Skin Type */}
            <div className="mb-6">
              <label className="block text-gray-600 text-sm mb-2">Skin Type</label>
              <div className="flex flex-wrap gap-2">
                {skinTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setInputs({ ...inputs, skin_type: type })}
                    className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-all ${
                      inputs.skin_type === type
                        ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                        : 'glass text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {type.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Climate */}
            <div className="mb-6">
              <label className="block text-gray-600 text-sm mb-2">Climate</label>
              <div className="flex flex-wrap gap-2">
                {climates.map((climate) => (
                  <button
                    key={climate}
                    onClick={() => setInputs({ ...inputs, climate })}
                    className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-all ${
                      inputs.climate === climate
                        ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                        : 'glass text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {climate}
                  </button>
                ))}
              </div>
            </div>

            {/* Age */}
            <div className="mb-6">
              <label className="block text-gray-600 text-sm mb-2">Age: {inputs.age}</label>
              <input
                type="range"
                min="15"
                max="75"
                value={inputs.age}
                onChange={(e) => setInputs({ ...inputs, age: parseInt(e.target.value) })}
                className="w-full accent-pink-500"
              />
            </div>

            {/* Budget */}
            <div className="mb-6">
              <label className="block text-gray-600 text-sm mb-2">Budget: ${inputs.budget}</label>
              <input
                type="range"
                min="10"
                max="1000"
                step="10"
                value={inputs.budget}
                onChange={(e) => setInputs({ ...inputs, budget: parseInt(e.target.value) })}
                className="w-full accent-pink-500"
              />
            </div>

            {/* Sliders */}
            <div className="space-y-4">
              {sliders.map((slider) => (
                <div key={slider.key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{slider.label}</span>
                    <span className="text-gray-900 font-mono">
                      {(inputs as any)[slider.key].toFixed(1)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={slider.min}
                    max={slider.max}
                    step={slider.step}
                    value={(inputs as any)[slider.key]}
                    onChange={(e) => setInputs({
                      ...inputs,
                      [slider.key]: parseFloat(e.target.value),
                    })}
                    className="w-full accent-purple-500"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={evaluateFuzzy}
              disabled={isLoading}
              className="glass-button w-full mt-6 flex items-center justify-center gap-2"
            >
              {isLoading ? 'Evaluating...' : 'Run Fuzzy Evaluation'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {result ? (
            <>
              {/* Main Score */}
              <div className="glass p-8 text-center">
                <p className="text-gray-500 mb-2">Suitability Score</p>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-7xl font-bold gradient-text mb-2"
                >
                  {(result.suitability_score * 100).toFixed(0)}%
                </motion.div>
                <p className={`text-2xl font-semibold ${
                  result.linguistic_output === 'Excellent' ? 'text-green-400' :
                  result.linguistic_output === 'Good' ? 'text-emerald-400' :
                  result.linguistic_output === 'Average' ? 'text-yellow-400' :
                  result.linguistic_output === 'Bad' ? 'text-orange-400' :
                  'text-red-400'
                }`}>
                  {result.linguistic_output}
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Confidence: {(result.confidence * 100).toFixed(0)}%
                </p>
              </div>

              {/* Membership Values */}
              <div className="glass p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Fuzzy Membership Values</h3>
                <div className="space-y-3">
                  {Object.entries(result.membership_values || {}).map(([key, value]) => (
                    <div key={key}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 capitalize">{key.replace('_', ' ')}</span>
                        <span className="text-gray-900">{((value as number) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(value as number) * 100}%` }}
                          className={`h-full ${
                            key === 'excellent' ? 'bg-green-500' :
                            key === 'good' ? 'bg-emerald-500' :
                            key === 'average' ? 'bg-yellow-500' :
                            key === 'bad' ? 'bg-orange-500' :
                            'bg-red-500'
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Triggered Rules */}
              {result.triggered_rules?.length > 0 && (
                <div className="glass p-6">
                  <button
                    onClick={() => setShowRules(!showRules)}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <h3 className="text-lg font-semibold text-gray-900">
                      Triggered Rules ({result.triggered_rules.length})
                    </h3>
                    {showRules ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                  {showRules && (
                    <div className="mt-4 space-y-2">
                      {result.triggered_rules.map((rule: any, idx: number) => (
                        <div key={idx} className="p-3 glass-card text-sm">
                          <p className="text-gray-600">
                            <span className="text-purple-400">IF</span>{' '}
                            {Object.entries(rule.conditions || {}).map(([key, val]) => (
                              <span key={key}>
                                <span className="text-gray-900">{key.replace(/_/g, ' ')}</span>{' '}
                                <span className="text-pink-400">is {val as string}</span>
                              </span>
                            )).reduce((prev: any, curr: any) => [prev, ' AND ', curr], '')}
                          </p>
                          <p className="text-gray-600 mt-1">
                            <span className="text-purple-400">THEN</span>{' '}
                            <span className="text-green-400">suitability = {rule.output}</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
}
