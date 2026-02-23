import { useState } from 'react';
import { ChevronDown, ExternalLink, Lightbulb } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import CategoryBadge from '../ui/CategoryBadge';
import { CATEGORY_CONFIG } from '../../data/mockData';
import { formatDate, truncateText } from '../../utils/formatUtils';

export default function LawCard({ law, variant = 'catalog' }) {
  const [expanded, setExpanded] = useState(false);
  const {
    category,
    title,
    title_da,
    law_reference,
    content,
    summary,
    keywords,
    key_facts,
    practical_tips,
    source_url,
    related_laws,
    date_updated,
    last_verified,
  } = law;
  const config = CATEGORY_CONFIG[category];

  const isCatalog = variant === 'catalog';
  const displayDate = last_verified || date_updated;

  return (
    <motion.div
      layout
      className={clsx(
        'rounded-xl border overflow-hidden transition-shadow duration-200',
        isCatalog
          ? clsx(
              'bg-white dark:bg-navy-800 p-5',
              'hover:shadow-md dark:hover:shadow-navy-900/40',
              'shadow-sm',
              config?.borderClass
            )
          : clsx(
              'bg-gray-50 dark:bg-navy-900 border-l-4 pl-4 pr-3 py-3',
              config?.borderLeftClass,
              'border-t-0 border-r-0 border-b-0'
            )
      )}
    >
      {/* Card header — always visible, clickable to expand */}
      <div
        className="flex items-start justify-between gap-3 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="min-w-0 flex-1">
          <CategoryBadge category={category} size={isCatalog ? 'md' : 'sm'} />
          <h3
            className={clsx(
              'mt-1.5 font-semibold text-navy-500 dark:text-white leading-snug',
              isCatalog ? 'text-sm' : 'text-xs'
            )}
          >
            {title}
            {title_da && (
              <span className="ml-1.5 font-normal text-gray-400 dark:text-gray-500 italic text-xs">
                ({title_da})
              </span>
            )}
          </h3>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 font-mono truncate">
            {law_reference}
          </p>
        </div>
        <ChevronDown
          className={clsx(
            'flex-shrink-0 text-gray-400 transition-transform duration-200',
            isCatalog ? 'w-4 h-4' : 'w-3.5 h-3.5',
            expanded && 'rotate-180'
          )}
        />
      </div>

      {/* Summary or preview text when collapsed */}
      {!expanded && (
        <p className="mt-2.5 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          {summary || truncateText(content, 180)}
        </p>
      )}

      {/* Expanded content */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {/* Full content */}
            <p
              className={clsx(
                'leading-relaxed text-gray-700 dark:text-gray-200',
                isCatalog ? 'mt-3 text-sm' : 'mt-2 text-xs'
              )}
            >
              {content}
            </p>

            {/* Key facts table */}
            {key_facts && Object.keys(key_facts).length > 0 && (
              <div className={clsx('mt-3 rounded-lg overflow-hidden border', 'border-gray-200 dark:border-navy-700')}>
                <table className="w-full text-xs">
                  <tbody>
                    {Object.entries(key_facts).map(([k, v], i) => (
                      <tr
                        key={k}
                        className={clsx(
                          i % 2 === 0
                            ? 'bg-gray-50 dark:bg-navy-900/50'
                            : 'bg-white dark:bg-navy-800'
                        )}
                      >
                        <td className="px-3 py-1.5 font-medium text-gray-500 dark:text-gray-400 capitalize whitespace-nowrap w-1/3">
                          {k.replace(/_/g, ' ')}
                        </td>
                        <td className="px-3 py-1.5 text-gray-700 dark:text-gray-200 font-mono">
                          {v}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Practical tips */}
            {practical_tips && (
              <div className="mt-3 flex gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                  {practical_tips}
                </p>
              </div>
            )}

            {/* Keywords */}
            {keywords && keywords.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {keywords.map((kw) => (
                  <span
                    key={kw}
                    className="text-xs px-2 py-0.5 rounded-full
                               bg-gray-100 dark:bg-navy-700
                               text-gray-500 dark:text-gray-400"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            )}

            {/* Related laws */}
            {related_laws && related_laws.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                <span className="text-xs text-gray-400 dark:text-gray-500">Related:</span>
                {related_laws.map((id) => (
                  <span
                    key={id}
                    className="text-xs px-2 py-0.5 rounded-full
                               bg-blue-50 dark:bg-blue-900/30
                               text-blue-600 dark:text-blue-400
                               border border-blue-200 dark:border-blue-800"
                  >
                    {id}
                  </span>
                ))}
              </div>
            )}

            {/* Footer: date + source link */}
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Verified: {formatDate(displayDate)}
              </p>
              {source_url && (
                <a
                  href={source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700
                             dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  Official source
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
