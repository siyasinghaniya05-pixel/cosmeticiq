'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, AlertTriangle, CheckCircle2, 
  XCircle, HelpCircle, ExternalLink, Loader2 
} from 'lucide-react';

export default function ClaimsPage() {
  const [claim, setClaim] = useState('');
  const [productName, setProductName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const analyzeClaim = async () => {
    if (!claim.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/claims/analyze`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: claim,
            product_name: productName || undefined,
          }),
        }
      );
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Analysis failed');
    } finally {
      setIsLoading(false);
    }
  };

  const getVerdictConfig = (verdict: string) => {
    switch (verdict) {
      case 'supported':
        return {
          icon: CheckCircle2,
          color: 'text-green-400',
          bg: 'bg-green-500/20 border-green-500/30',
          label: 'Scientifically Supported',
        };
      case 'partially_supported':
        return {
          icon: HelpCircle,
          color: 'text-yellow-400',
          bg: 'bg-yellow-500/20 border-yellow-500/30',
          label: 'Partially Supported',
        };
      case 'misleading':
        return {
          icon: AlertTriangle,
          color: 'text-orange-400',
          bg: 'bg-orange-500/20 border-orange-500/30',
          label: 'Potentially Misleading',
        };
      case 'no_evidence':
        return {
          icon: XCircle,
          color: 'text-red-400',
          bg: 'bg-red-500/20 border-red-500/30',
          label: 'No Scientific Evidence',
        };
      default:
        return {
          icon: HelpCircle,
          color: 'text-gray-500',
          bg: 'bg-gray-500/20 border-gray-500/30',
          label: 'Unknown',
        };
    }
  };

  const sampleClaims = [
    "This product cures acne in 3 days",
    "Hyaluronic acid hydrates skin by holding 1000x its weight in water",
    "Retinol reduces wrinkles and fine lines",
    "This serum will make you look 10 years younger overnight",
    "Vitamin C brightens skin and fades dark spots",
    "This product is 100% natural and chemical-free",
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Influencer Truth Detector</h1>
        <p className="text-gray-500">
          Verify cosmetic claims against scientific evidence
        </p>
      </motion.div>

      {/* Input */}
      <div className="glass p-6 space-y-4">
        <div>
          <label className="block text-gray-600 text-sm mb-2">Claim to Verify</label>
          <textarea
            value={claim}
            onChange={(e) => setClaim(e.target.value)}
            placeholder="Enter the claim you want to verify (e.g., 'This serum removes all wrinkles in 1 week')"
            className="input-glass h-24 resize-none"
          />
        </div>
        <div>
          <label className="block text-gray-600 text-sm mb-2">Product Name (optional)</label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Enter product name for context"
            className="input-glass"
          />
        </div>
        <button
          onClick={analyzeClaim}
          disabled={isLoading || !claim.trim()}
          className="glass-button w-full flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Search className="w-5 h-5" />
              Analyze Claim
            </>
          )}
        </button>
      </div>

      {/* Sample Claims */}
      {!result && (
        <div className="glass p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Try These Sample Claims</h3>
          <div className="space-y-2">
            {sampleClaims.map((sample, idx) => (
              <button
                key={idx}
                onClick={() => setClaim(sample)}
                className="w-full text-left p-3 glass-card text-gray-600 hover:text-gray-900 text-sm"
              >
                "{sample}"
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Verdict Card */}
          {(() => {
            const config = getVerdictConfig(result.verdict);
            return (
              <div className={`glass p-8 border-2 ${config.bg}`}>
                <div className="flex items-center gap-4 mb-4">
                  <config.icon className={`w-12 h-12 ${config.color}`} />
                  <div>
                    <h2 className={`text-2xl font-bold ${config.color}`}>
                      {config.label}
                    </h2>
                    <p className="text-gray-500">
                      Confidence: {(result.confidence_score * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
                <p className="text-gray-600 text-lg">{result.explanation}</p>
              </div>
            );
          })()}

          {/* Confidence Meter */}
          <div className="glass p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confidence Score</h3>
            <div className="relative h-4 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${result.confidence_score * 100}%` }}
                transition={{ duration: 0.5 }}
                className={`h-full ${
                  result.confidence_score >= 0.7
                    ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                    : result.confidence_score >= 0.4
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                    : 'bg-gradient-to-r from-red-400 to-pink-500'
                }`}
              />
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-500">
              <span>Low Confidence</span>
              <span>High Confidence</span>
            </div>
          </div>

          {/* Evidence */}
          {result.evidence?.length > 0 && (
            <div className="glass p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Supporting Evidence</h3>
              <div className="space-y-3">
                {result.evidence.map((source: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-3 p-3 glass-card">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-400 text-sm font-bold">{idx + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900">{source.title || source.source}</p>
                      {source.url && (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 text-sm flex items-center gap-1 hover:text-blue-300"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View Source
                        </a>
                      )}
                    </div>
                    {source.relevance && (
                      <span className="text-gray-500 text-sm">
                        {(source.relevance * 100).toFixed(0)}% relevant
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="glass p-4 border-yellow-500/30">
            <p className="text-yellow-600 text-sm">
              <strong>Disclaimer:</strong> This analysis is for informational purposes only. 
              Always consult a dermatologist for personalized medical advice.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
