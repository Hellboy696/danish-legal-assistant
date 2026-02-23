import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Search, Clock, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

const TRENDING_QUERIES = [
  { text: 'What is the salary requirement for Pay Limit work permit?', category: 'immigration', hot: true },
  { text: 'How much income tax do I pay in Denmark?', category: 'tax', hot: true },
  { text: 'How many vacation days am I entitled to?', category: 'labor', hot: false },
  { text: 'Can I bring my family to Denmark?', category: 'immigration', hot: false },
  { text: 'What is VAT rate in Denmark?', category: 'tax', hot: true },
  { text: 'How do I register a company in Denmark?', category: 'business', hot: false },
  { text: 'What is the minimum wage in Denmark?', category: 'labor', hot: false },
  { text: 'EU Blue Card requirements Denmark', category: 'immigration', hot: false },
  { text: 'Notice period for termination of employment', category: 'labor', hot: false },
  { text: 'How to get a Danish CPR number?', category: 'immigration', hot: true },
];

const CATEGORY_COLORS = {
  immigration: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
  tax:         'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
  labor:       'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
  business:    'text-purple-500 bg-purple-50 dark:bg-purple-900/20',
};

export default function SearchSuggestions({ query, onSelect, visible }) {
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('danish-legal-recent-searches') || '[]');
      setRecentSearches(saved.slice(0, 3));
    } catch {}
  }, [visible]);

  useEffect(() => {
    if (!query || query.length < 2) { setSuggestions([]); return; }
    const q = query.toLowerCase();
    const matched = TRENDING_QUERIES.filter((t) => t.text.toLowerCase().includes(q)).slice(0, 5);
    setSuggestions(matched);
  }, [query]);

  const handleSelect = (text) => {
    try {
      const prev = JSON.parse(localStorage.getItem('danish-legal-recent-searches') || '[]');
      const updated = [text, ...prev.filter((s) => s !== text)].slice(0, 5);
      localStorage.setItem('danish-legal-recent-searches', JSON.stringify(updated));
    } catch {}
    onSelect(text);
  };

  const showTrending = !query && TRENDING_QUERIES.filter((t) => t.hot).length > 0;
  const showSuggestions = query && suggestions.length > 0;
  const showRecent = !query && recentSearches.length > 0;

  if (!visible || (!showTrending && !showSuggestions && !showRecent)) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -4, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -4, scale: 0.98 }}
        transition={{ duration: 0.15 }}
        className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-navy-800 rounded-2xl shadow-xl border border-gray-200 dark:border-navy-600 overflow-hidden z-40"
      >
        {showRecent && (
          <div className="px-3 pt-3 pb-1">
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 px-2 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3 h-3" /> Recent
            </p>
            {recentSearches.map((s, i) => (
              <button key={i} onClick={() => handleSelect(s)}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-navy-700 transition-colors">
                <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="truncate">{s}</span>
              </button>
            ))}
          </div>
        )}
        {showSuggestions && (
          <div className="px-3 pt-3 pb-1">
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 px-2 mb-1.5 flex items-center gap-1.5">
              <Search className="w-3 h-3" /> Suggestions
            </p>
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => handleSelect(s.text)}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-navy-700 transition-colors group">
                <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{s.text}</span>
                <span className={clsx('text-xs px-1.5 py-0.5 rounded-full flex-shrink-0', CATEGORY_COLORS[s.category])}>
                  {s.category}
                </span>
              </button>
            ))}
          </div>
        )}
        {showTrending && (
          <div className="px-3 pt-3 pb-3">
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 px-2 mb-1.5 flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3" /> Trending questions
            </p>
            {TRENDING_QUERIES.filter((t) => t.hot).slice(0, 4).map((t, i) => (
              <button key={i} onClick={() => handleSelect(t.text)}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-navy-700 transition-colors group">
                <TrendingUp className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{t.text}</span>
                <ArrowRight className="w-3 h-3 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 flex-shrink-0 transition-colors" />
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
