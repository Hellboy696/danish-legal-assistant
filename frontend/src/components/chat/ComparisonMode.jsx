import { useState } from 'react';
import { motion } from 'framer-motion';
import { Scale, X, Zap, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const COMPARISON_PRESETS = [
  { a: 'EU Blue Card', b: 'Pay Limit Scheme work permit' },
  { a: 'Enkeltmandsvirksomhed (sole trader)', b: 'ApS (private limited company)' },
  { a: 'Bottom tax bracket', b: 'Top tax bracket in Denmark' },
  { a: 'Temporary work permit', b: 'Permanent residence permit' },
];

export default function ComparisonMode({ onClose }) {
  const [topicA, setTopicA] = useState('');
  const [topicB, setTopicB] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCompare = async () => {
    if (!topicA.trim() || !topicB.trim()) {
      toast.error('Please enter both topics to compare');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    const query = `Compare "${topicA}" vs "${topicB}" in Danish law. Provide a detailed side-by-side comparison table with: requirements, processing time, costs, validity period, and key differences. Format as structured comparison.`;

    try {
      const resp = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, top_k: 5 }),
        signal: AbortSignal.timeout(30000),
      });
      if (!resp.ok) throw new Error('API error');
      const data = await resp.json();
      setResult(data);
    } catch (e) {
      setError('Could not generate comparison. Please try again.');
      toast.error('Comparison failed — please retry');
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (preset) => {
    setTopicA(preset.a);
    setTopicB(preset.b);
    setResult(null);
  };

  // Parse answer into comparison table rows
  const parseComparison = (answer) => {
    if (!answer) return null;
    const lines = answer.split('\n').filter((l) => l.trim());
    return lines;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="w-full max-w-3xl bg-white dark:bg-navy-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-navy-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Scale className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="font-bold text-navy-500 dark:text-white">Comparison Mode</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Side-by-side AI comparison of Danish legal topics</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Input area */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Topic A</label>
              <input
                value={topicA}
                onChange={(e) => setTopicA(e.target.value)}
                placeholder="e.g. EU Blue Card"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-navy-600 bg-gray-50 dark:bg-navy-700 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-nordic-500/40 focus:border-nordic-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Topic B</label>
              <input
                value={topicB}
                onChange={(e) => setTopicB(e.target.value)}
                placeholder="e.g. Pay Limit Scheme"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-navy-600 bg-gray-50 dark:bg-navy-700 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-nordic-500/40 focus:border-nordic-500 transition-all"
              />
            </div>
          </div>

          {/* Presets */}
          <div className="mb-4">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">Popular comparisons:</p>
            <div className="flex flex-wrap gap-1.5">
              {COMPARISON_PRESETS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => applyPreset(p)}
                  className="text-xs px-3 py-1.5 rounded-full border border-gray-200 dark:border-navy-600 text-gray-600 dark:text-gray-300 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                >
                  {p.a} vs {p.b}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleCompare}
            disabled={loading || !topicA.trim() || !topicB.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-navy-500 dark:bg-nordic-600 text-white font-semibold text-sm hover:bg-navy-600 dark:hover:bg-nordic-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 mb-6"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Comparing with Claude AI...</>
            ) : (
              <><Zap className="w-4 h-4" /> Compare with AI</>
            )}
          </button>

          {/* Error */}
          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400 mb-4">
              {error}
            </div>
          )}

          {/* Result */}
          {result && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Header cards */}
              <div className="grid grid-cols-2 gap-3">
                {[topicA, topicB].map((t, i) => (
                  <div key={i} className={clsx(
                    'p-3 rounded-xl border-2 text-center',
                    i === 0
                      ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20'
                  )}>
                    <p className={clsx('font-bold text-sm', i === 0 ? 'text-blue-700 dark:text-blue-300' : 'text-purple-700 dark:text-purple-300')}>
                      {t}
                    </p>
                  </div>
                ))}
              </div>

              {/* Answer */}
              <div className="bg-gray-50 dark:bg-navy-700 rounded-xl p-4 text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap border border-gray-200 dark:border-navy-600">
                {result.answer}
              </div>

              {/* Sources */}
              {result.sources?.length > 0 && (
                <div className="text-xs text-gray-400 dark:text-gray-500">
                  <span className="font-medium">Sources: </span>
                  {result.sources.map((s, i) => (
                    <span key={i}>{s.title}{i < result.sources.length - 1 ? ' · ' : ''}</span>
                  ))}
                </div>
              )}

              {result.llm_used && (
                <div className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400">
                  <Zap className="w-3 h-3" /> Generated by Claude AI
                </div>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
