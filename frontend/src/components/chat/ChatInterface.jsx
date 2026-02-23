import { useRef, useEffect, useState, useCallback } from 'react';
import { Scale, Send, ListChecks, GitCompare, Keyboard } from 'lucide-react';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import ChatMessage from './ChatMessage';
import TypingIndicator from '../ui/TypingIndicator';
import SearchSuggestions from './SearchSuggestions';
import ExportButton from './ExportButton';
import ChecklistGenerator from './ChecklistGenerator';
import ComparisonMode from './ComparisonMode';
import useChatStore from '../../store/useChatStore';
import { EXAMPLE_QUERIES, CATEGORY_CONFIG } from '../../data/mockData';

const CATEGORIES = ['immigration', 'tax', 'labor', 'business'];

// Threshold (px from bottom) within which we consider the user "at the bottom"
const SCROLL_THRESHOLD = 150;

export default function ChatInterface() {
  const { messages, isTyping, activeCategory, inputValue, usingRealApi, sendMessage, setCategory, setInputValue } =
    useChatStore();
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const inputRef = useRef(null);
  // Track whether the user has scrolled up away from the bottom
  const isNearBottomRef = useRef(true);
  // Throttle scroll-to-bottom calls during streaming
  const scrollRafRef = useRef(null);

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  /** Returns true if the scroll container is within SCROLL_THRESHOLD of the bottom. */
  const checkNearBottom = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < SCROLL_THRESHOLD;
  }, []);

  /** Scroll to bottom using requestAnimationFrame to avoid mid-paint jitter. */
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current);
    scrollRafRef.current = requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
    });
  }, []);

  // Track user scroll position so we don't force-scroll when they've scrolled up
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onScroll = () => {
      isNearBottomRef.current = checkNearBottom();
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [checkNearBottom]);

  // Auto-scroll: jump immediately on new user message; smooth-scroll during streaming
  // only when the user is already near the bottom.
  const prevMessageCountRef = useRef(0);
  useEffect(() => {
    const currentCount = messages.length;
    const isNewMessage = currentCount > prevMessageCountRef.current;
    prevMessageCountRef.current = currentCount;

    if (isNewMessage) {
      // New message added — always scroll to bottom (user just sent or first response came)
      scrollToBottom('smooth');
      isNearBottomRef.current = true;
      return;
    }

    // Streaming tokens update existing message content — only scroll if near bottom
    if (isNearBottomRef.current) {
      scrollToBottom('auto'); // 'auto' = instant, no jitter from smooth easing stacking
    }
  }, [messages, isTyping, scrollToBottom]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      // '/' to focus input (when not already in an input)
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
        toast('🔍 Search focused', { duration: 1200, icon: null, style: { fontSize: '13px', padding: '8px 14px' } });
      }
      // Escape to close modals or blur input
      if (e.key === 'Escape') {
        if (showChecklist) { setShowChecklist(false); return; }
        if (showComparison) { setShowComparison(false); return; }
        if (showSuggestions) { setShowSuggestions(false); return; }
        inputRef.current?.blur();
      }
      // Ctrl/Cmd + K → focus input
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      // Ctrl/Cmd + Shift + C → toggle checklist
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        setShowChecklist((v) => !v);
      }
      // ? → show shortcuts
      if (e.key === '?' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        setShowShortcuts((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showChecklist, showComparison, showSuggestions]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;
    setShowSuggestions(false);
    sendMessage(inputValue.trim());
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    setShowSuggestions(true);
  };

  const handleSuggestionSelect = (text) => {
    setInputValue(text);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleExampleClick = (query) => {
    if (isTyping) return;
    sendMessage(query);
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-gray-50 dark:bg-navy-900">
      {/* Messages area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto scrollbar-thin px-4 py-6">
        {isEmpty ? (
          /* Welcome state */
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="w-16 h-16 rounded-2xl bg-navy-500 dark:bg-nordic-600
                          flex items-center justify-center mb-5 shadow-lg"
            >
              <Scale className="w-8 h-8 text-white" />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl font-semibold text-navy-500 dark:text-white mb-2"
            >
              Danish Legal Assistant
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-sm text-gray-500 dark:text-gray-400 mb-2 max-w-xs"
            >
              Ask me anything about Danish immigration, tax, labor, or business law. 41 real laws indexed.
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="text-xs text-gray-400 dark:text-gray-500 mb-8 flex items-center gap-1"
            >
              <Keyboard className="w-3 h-3" /> Press <kbd className="px-1 py-0.5 rounded bg-gray-200 dark:bg-navy-700 font-mono text-xs">/</kbd> to focus search
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg"
            >
              {EXAMPLE_QUERIES.slice(0, 4).map(({ text }) => (
                <button
                  key={text}
                  onClick={() => handleExampleClick(text)}
                  className="px-4 py-3 rounded-xl border border-gray-200 dark:border-navy-700
                             bg-white dark:bg-navy-800 text-left text-sm
                             text-gray-700 dark:text-gray-300
                             hover:border-nordic-300 dark:hover:border-nordic-600
                             hover:bg-nordic-50 dark:hover:bg-nordic-900/20
                             transition-all duration-200"
                >
                  {text}
                </button>
              ))}
            </motion.div>

            {/* Feature shortcuts */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="flex items-center gap-3 mt-8"
            >
              <button
                onClick={() => setShowChecklist(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-navy-700 text-xs text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-navy-800 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all"
              >
                <ListChecks className="w-3.5 h-3.5" /> Checklists
              </button>
              <button
                onClick={() => setShowComparison(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-navy-700 text-xs text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-navy-800 hover:text-purple-600 dark:hover:text-purple-400 transition-all"
              >
                <GitCompare className="w-3.5 h-3.5" /> Compare Laws
              </button>
            </motion.div>
          </div>
        ) : (
          /* Message list */
          <div className="max-w-3xl mx-auto space-y-5">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  {...msg}
                  onFollowUp={(q) => {
                    if (!isTyping) sendMessage(q);
                  }}
                />
              ))}
            </AnimatePresence>
            {/* Show typing indicator while waiting for FIRST token (streaming not yet started) */}
            <TypingIndicator visible={isTyping && messages[messages.length - 1]?.isStreaming === true && messages[messages.length - 1]?.content === ''} />
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="border-t border-gray-200 dark:border-navy-700
                      bg-white dark:bg-navy-800 px-4 py-3">
        <div className="max-w-3xl mx-auto">
          {/* Top row: API status + tools */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {/* Tool buttons */}
              <button
                onClick={() => setShowChecklist(true)}
                title="Checklist Generator (Ctrl+Shift+C)"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-gray-500 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800"
              >
                <ListChecks className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Checklist</span>
              </button>
              <button
                onClick={() => setShowComparison(true)}
                title="Compare laws side-by-side"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-gray-500 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400 transition-colors border border-transparent hover:border-purple-200 dark:hover:border-purple-800"
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Compare</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <ExportButton messages={messages} />
              {usingRealApi !== null && (
                <span className={clsx(
                  'text-xs px-2 py-0.5 rounded-full font-medium',
                  usingRealApi
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                )}>
                  {usingRealApi ? '● Live AI' : '● Mock'}
                </span>
              )}
            </div>
          </div>

          {/* Category filters */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-xs text-gray-400 dark:text-gray-500">Filter:</span>
            <button
              onClick={() => setCategory(null)}
              className={clsx(
                'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                !activeCategory
                  ? 'bg-navy-500 text-white'
                  : 'bg-gray-100 dark:bg-navy-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-navy-600'
              )}
            >
              All
            </button>
            {CATEGORIES.map((cat) => {
              const config = CATEGORY_CONFIG[cat];
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setCategory(isActive ? null : cat)}
                  className={clsx(
                    'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                    isActive
                      ? `${config.bgClass} ${config.textClass}`
                      : 'bg-gray-100 dark:bg-navy-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-navy-600'
                  )}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
                  {config.label}
                </button>
              );
            })}
          </div>

          {/* Search input + suggestions */}
          <div className="relative">
            <SearchSuggestions
              query={inputValue}
              onSelect={handleSuggestionSelect}
              visible={showSuggestions}
            />
            <form onSubmit={handleSubmit} className="flex gap-3">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Ask a question about Danish law... (Enter to send, / to focus)"
                rows={1}
                disabled={isTyping}
                aria-label="Chat input"
                className="flex-1 resize-none px-4 py-3 rounded-xl border border-gray-200
                           dark:border-navy-600 bg-gray-50 dark:bg-navy-700
                           text-gray-900 dark:text-gray-100
                           placeholder:text-gray-400 dark:placeholder:text-gray-500
                           focus:outline-none focus:ring-2 focus:ring-nordic-500/40
                           focus:border-nordic-500 disabled:opacity-50
                           transition-all duration-200 text-sm"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isTyping}
                aria-label="Send message"
                className="flex items-center justify-center w-12 h-12 rounded-xl
                           bg-navy-500 dark:bg-nordic-600 text-white
                           hover:bg-navy-600 dark:hover:bg-nordic-700
                           disabled:opacity-40 disabled:cursor-not-allowed
                           transition-all duration-200 flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showChecklist && <ChecklistGenerator onClose={() => setShowChecklist(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showComparison && <ComparisonMode onClose={() => setShowComparison(false)} />}
      </AnimatePresence>

      {/* Keyboard shortcuts hint */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowShortcuts(false)}
          >
            <div className="bg-white dark:bg-navy-800 rounded-2xl p-6 shadow-2xl border border-gray-200 dark:border-navy-600 w-full max-w-sm">
              <h3 className="font-bold text-navy-500 dark:text-white mb-4 flex items-center gap-2">
                <Keyboard className="w-4 h-4" /> Keyboard Shortcuts
              </h3>
              <div className="space-y-2.5 text-sm">
                {[
                  ['/','Focus search input'],
                  ['Esc','Close modals / blur input'],
                  ['Ctrl+K','Focus search input'],
                  ['Ctrl+Shift+C','Toggle Checklist'],
                  ['?','Show this help'],
                  ['Enter','Send message'],
                  ['Shift+Enter','New line in message'],
                ].map(([key, desc]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300">{desc}</span>
                    <kbd className="px-2 py-0.5 rounded bg-gray-100 dark:bg-navy-700 font-mono text-xs text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-navy-600">
                      {key}
                    </kbd>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowShortcuts(false)}
                className="mt-5 w-full py-2 rounded-xl bg-navy-500 text-white text-sm hover:bg-navy-600 transition-colors"
              >
                Got it
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
