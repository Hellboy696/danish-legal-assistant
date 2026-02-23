import { motion } from 'framer-motion';
import { ExternalLink, Scale, Zap } from 'lucide-react';
import clsx from 'clsx';
import LawCard from '../law/LawCard';

// Render markdown: **bold**, *italic*, newlines, [link](url)
function RenderMarkdown({ content }) {
  // Split into lines for paragraph handling
  const lines = content.split('\n');
  return (
    <div className="space-y-1.5">
      {lines.map((line, li) => {
        if (!line.trim()) return <div key={li} className="h-1" />;
        return <p key={li}><InlineMd text={line} /></p>;
      })}
    </div>
  );
}

function InlineMd({ text }) {
  // Process bold (**text**), italic (*text*), and [label](url) links
  const tokens = [];
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  let last = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) tokens.push({ type: 'text', val: text.slice(last, match.index) });
    if (match[1]) tokens.push({ type: 'bold', val: match[1] });
    else if (match[2]) tokens.push({ type: 'italic', val: match[2] });
    else if (match[3]) tokens.push({ type: 'link', val: match[3], href: match[4] });
    last = match.index + match[0].length;
  }
  if (last < text.length) tokens.push({ type: 'text', val: text.slice(last) });

  return (
    <>
      {tokens.map((tok, i) => {
        if (tok.type === 'bold') return <strong key={i} className="font-semibold">{tok.val}</strong>;
        if (tok.type === 'italic') return <em key={i}>{tok.val}</em>;
        if (tok.type === 'link') return (
          <a key={i} href={tok.href} target="_blank" rel="noopener noreferrer"
            className="text-blue-500 hover:underline inline-flex items-center gap-0.5">
            {tok.val}<ExternalLink className="w-3 h-3" />
          </a>
        );
        return <span key={i}>{tok.val}</span>;
      })}
    </>
  );
}

const CONFIDENCE_CONFIG = {
  high:   { label: 'High confidence',   cls: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' },
  medium: { label: 'Medium confidence', cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' },
  low:    { label: 'Low confidence',    cls: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' },
};

const RELEVANCE_COLORS = {
  high:   'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300',
  medium: 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300',
  low:    'border-gray-300 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
};

export default function ChatMessage({
  role,
  content,
  laws = [],
  sources = [],
  follow_up_questions = [],
  confidence,
  llm_used,
  isStreaming,
  timestamp,
  onFollowUp,
}) {
  const isUser = role === 'user';
  const confCfg = CONFIDENCE_CONFIG[confidence];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={clsx('flex gap-3', isUser ? 'justify-end' : 'justify-start')}
    >
      {/* AI Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-navy-500 flex items-center justify-center flex-shrink-0 mt-1">
          <Scale className="w-4 h-4 text-white" />
        </div>
      )}

      <div className={clsx('flex flex-col gap-2', isUser ? 'items-end max-w-[75%]' : 'items-start max-w-[90%]')}>
        {/* Message bubble */}
        <div
          className={clsx(
            'px-4 py-3 rounded-2xl text-sm leading-relaxed',
            isUser
              ? 'bg-navy-500 dark:bg-nordic-600 text-white rounded-tr-sm'
              : 'bg-white dark:bg-navy-700 border border-gray-100 dark:border-navy-600 text-gray-800 dark:text-gray-100 rounded-tl-sm'
          )}
        >
          {isUser ? (
            <span>{content}</span>
          ) : (
            <RenderMarkdown content={content} />
          )}
          {/* Streaming cursor */}
          {isStreaming && (
            <span className="inline-block w-0.5 h-4 ml-0.5 bg-gray-400 dark:bg-gray-500 animate-pulse align-middle" />
          )}
        </div>

        {/* Confidence + LLM badge (AI only, non-streaming) */}
        {!isUser && !isStreaming && (confidence || llm_used !== undefined) && (
          <div className="flex items-center gap-2 px-1">
            {confCfg && (
              <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', confCfg.cls)}>
                {confCfg.label}
              </span>
            )}
            {llm_used && (
              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium">
                <Zap className="w-3 h-3" />Claude AI
              </span>
            )}
          </div>
        )}

        {/* Cited sources (AI only, non-streaming) */}
        {!isUser && !isStreaming && sources.length > 0 && (
          <div className="w-full space-y-1.5">
            <p className="text-xs text-gray-400 dark:text-gray-500 px-1 font-medium uppercase tracking-wider">
              Sources cited
            </p>
            {sources.map((src, i) => (
              <div
                key={src.law_id || i}
                className={clsx(
                  'flex items-start gap-2 p-2.5 rounded-lg border-l-2 text-xs',
                  RELEVANCE_COLORS[src.relevance] || RELEVANCE_COLORS.medium
                )}
              >
                <div className="flex-1 min-w-0">
                  <span className="font-semibold">{src.title}</span>
                  <span className="mx-1.5 opacity-50">·</span>
                  <span className="font-mono">{src.law_reference}</span>
                  {src.cited_text && (
                    <p className="mt-1 italic opacity-80 line-clamp-2">"{src.cited_text}"</p>
                  )}
                </div>
                {src.source_url && (
                  <a
                    href={src.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Embedded law cards (AI only) */}
        {!isUser && laws.length > 0 && (
          <div className="w-full space-y-2">
            {laws.map((law) => (
              <LawCard key={law.id} law={law} variant="chat" />
            ))}
          </div>
        )}

        {/* Follow-up questions (AI only, non-streaming) */}
        {!isUser && !isStreaming && follow_up_questions.length > 0 && (
          <div className="w-full">
            <p className="text-xs text-gray-400 dark:text-gray-500 px-1 mb-1.5 font-medium uppercase tracking-wider">
              You might also ask
            </p>
            <div className="flex flex-col gap-1.5">
              {follow_up_questions.map((q) => (
                <button
                  key={q}
                  onClick={() => onFollowUp && onFollowUp(q)}
                  className="text-left text-xs px-3 py-2 rounded-lg
                             bg-gray-50 dark:bg-navy-800
                             border border-gray-200 dark:border-navy-600
                             text-gray-600 dark:text-gray-300
                             hover:bg-blue-50 dark:hover:bg-blue-900/20
                             hover:border-blue-300 dark:hover:border-blue-700
                             transition-colors duration-150"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Timestamp */}
        {timestamp && (
          <span className="text-xs text-gray-400 dark:text-gray-500 px-1">
            {new Date(timestamp).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}
      </div>
    </motion.div>
  );
}
