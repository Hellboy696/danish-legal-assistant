import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Zap, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import useChatStore from '../../store/useChatStore';

const PLACEHOLDERS = [
  'Can I work in Denmark with a Ukrainian passport?',
  'What is the income tax rate in Denmark?',
  'How many vacation days am I entitled to?',
  'What are the EU Blue Card requirements?',
];

export default function HeroSection() {
  const navigate = useNavigate();
  const { sendMessage, setInputValue } = useChatStore();
  const [query, setQuery] = useState('');
  const [placeholderIdx] = useState(() => Math.floor(Math.random() * PLACEHOLDERS.length));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setInputValue(query.trim());
    navigate('/chat');
    // Small delay to let routing complete before sending
    setTimeout(() => sendMessage(query.trim()), 100);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-warmwhite to-white
                        dark:from-navy-900 dark:to-navy-800 py-20 md:py-28 px-4">
      {/* Subtle background grid */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #1B2A4A 1px, transparent 1px), linear-gradient(to bottom, #1B2A4A 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full
                     bg-nordic-50 dark:bg-nordic-900/30 border border-nordic-100 dark:border-nordic-800
                     text-xs font-medium text-nordic-600 dark:text-nordic-400 mb-6"
        >
          <Zap className="w-3 h-3" />
          AI-Powered Semantic Search
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-navy-500 dark:text-white
                     leading-tight mb-6"
        >
          Your AI-Powered
          <br />
          <span className="text-nordic-500 dark:text-nordic-400">Danish Legal Guide</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg text-gray-500 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed"
        >
          Instant answers on Danish immigration, tax, and labor law — powered by semantic
          search. Every answer cites the official law reference.
        </motion.p>

        {/* Animated search input */}
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          onSubmit={handleSubmit}
          className="flex gap-3 max-w-2xl mx-auto mb-8"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={PLACEHOLDERS[placeholderIdx]}
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200
                         dark:border-navy-600 bg-white dark:bg-navy-800
                         text-gray-900 dark:text-gray-100
                         placeholder:text-gray-400 dark:placeholder:text-gray-500
                         focus:outline-none focus:ring-2 focus:ring-nordic-500/40
                         focus:border-nordic-500 text-sm shadow-sm transition-all"
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-4 rounded-2xl
                       bg-navy-500 dark:bg-nordic-600 text-white font-medium
                       hover:bg-navy-600 dark:hover:bg-nordic-700
                       transition-colors duration-200 shadow-sm whitespace-nowrap"
          >
            Ask AI
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.form>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="flex items-center justify-center gap-4"
        >
          <Link
            to="/chat"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl
                       bg-navy-500 dark:bg-nordic-600 text-white text-sm font-medium
                       hover:bg-navy-600 dark:hover:bg-nordic-700 transition-colors"
          >
            Start Chatting
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            to="/laws"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl
                       border border-gray-300 dark:border-navy-600
                       text-gray-700 dark:text-gray-300 text-sm font-medium
                       hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Browse Laws
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
