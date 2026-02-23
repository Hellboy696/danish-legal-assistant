import { MessageSquare, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import useChatStore from '../../store/useChatStore';
import { CATEGORY_CONFIG } from '../../data/mockData';

// Categories with expected counts from the production database
const CATEGORIES = [
  { key: 'immigration', count: 16 },
  { key: 'tax', count: 10 },
  { key: 'labor', count: 10 },
  { key: 'business', count: 5 },
];

export default function Sidebar() {
  const { activeCategory, setCategory, clearHistory, messages } = useChatStore();

  const userMessages = messages.filter((m) => m.role === 'user');

  return (
    <aside className="w-72 flex-shrink-0 border-r border-gray-200 dark:border-navy-700
                      bg-white dark:bg-navy-800 flex flex-col overflow-hidden">
      {/* Category filters */}
      <div className="p-4 border-b border-gray-100 dark:border-navy-700">
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Filter by Category
        </h2>
        <div className="flex flex-col gap-1.5">
          {/* All */}
          <button
            onClick={() => setCategory(null)}
            className={clsx(
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left',
              !activeCategory
                ? 'bg-navy-50 dark:bg-navy-700 text-navy-500 dark:text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-navy-700'
            )}
          >
            <span className="w-2 h-2 rounded-full bg-gray-400 flex-shrink-0" />
            All Categories
          </button>

          {CATEGORIES.map(({ key: cat, count }) => {
            const config = CATEGORY_CONFIG[cat];
            if (!config) return null;
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategory(isActive ? null : cat)}
                className={clsx(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left w-full',
                  isActive
                    ? `${config.bgClass} ${config.textClass}`
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-navy-700'
                )}
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${config.dotClass}`} />
                <span className="flex-1">{config.emoji} {config.label}</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat history */}
      <div className="flex-1 p-4 overflow-y-auto scrollbar-thin">
        <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Recent Questions
        </h2>

        {userMessages.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-6 h-6 text-gray-300 dark:text-navy-600 mx-auto mb-2" />
            <p className="text-xs text-gray-400 dark:text-gray-500">Your questions will appear here</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {userMessages.slice().reverse().map((msg) => (
              <div
                key={msg.id}
                className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-navy-700
                           text-xs text-gray-600 dark:text-gray-300 leading-relaxed
                           truncate"
                title={msg.content}
              >
                {msg.content}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clear history */}
      {messages.length > 0 && (
        <div className="p-4 border-t border-gray-100 dark:border-navy-700">
          <button
            onClick={clearHistory}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs
                       text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20
                       hover:text-red-500 dark:hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear history
          </button>
        </div>
      )}
    </aside>
  );
}
