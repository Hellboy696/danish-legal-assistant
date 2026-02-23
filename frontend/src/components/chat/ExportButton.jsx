import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Link2, FileText, ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import useAnalyticsStore from '../../store/useAnalyticsStore';

function exportAsTxt(messages) {
  const lines = [];
  lines.push('Danish Legal Assistant — Conversation Export');
  lines.push('Generated: ' + new Date().toLocaleString());
  lines.push('='.repeat(60));
  lines.push('');
  messages.filter((m) => m.role === 'user' || m.role === 'assistant').forEach((m) => {
    const role = m.role === 'user' ? 'YOU' : 'DANISH LEGAL ASSISTANT';
    const time = m.timestamp ? new Date(m.timestamp).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }) : '';
    lines.push('[' + role + ']' + (time ? ' (' + time + ')' : ''));
    lines.push(m.content);
    if (m.sources?.length) {
      lines.push('Sources: ' + m.sources.map((s) => s.title + ' (' + s.law_reference + ')').join(', '));
    }
    lines.push('');
    lines.push('-'.repeat(60));
    lines.push('');
  });
  lines.push('Disclaimer: For informational purposes only — not legal advice.');
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'danish-legal-chat-' + Date.now() + '.txt';
  a.click();
  URL.revokeObjectURL(url);
}

function copyShareLink(messages) {
  const lastQ = messages.filter((m) => m.role === 'user').slice(-1)[0]?.content || '';
  const url = window.location.origin + '/chat?q=' + encodeURIComponent(lastQ.slice(0, 150));
  navigator.clipboard.writeText(url)
    .then(() => toast.success('\uD83D\uDD17 Link copied to clipboard!'))
    .catch(() => toast.error('Could not copy link'));
}

export default function ExportButton({ messages = [] }) {
  const [open, setOpen] = useState(false);
  const { trackExport } = useAnalyticsStore();

  const hasContent = messages.some((m) => m.role === 'assistant' && m.content);
  if (!hasContent) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-navy-600 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors"
        aria-label="Export conversation"
      >
        <Download className="w-3.5 h-3.5" />
        Export
        <ChevronDown className={clsx('w-3 h-3 transition-transform', open && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 4 }}
              transition={{ duration: 0.12 }}
              className="absolute bottom-full right-0 mb-2 w-48 bg-white dark:bg-navy-800 rounded-xl shadow-xl border border-gray-200 dark:border-navy-600 overflow-hidden z-40 py-1"
            >
              <button onClick={() => { exportAsTxt(messages); trackExport(); toast.success('\uD83D\uDCC4 Exported!'); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-navy-700 transition-colors">
                <FileText className="w-4 h-4 text-blue-500" />
                Save as .txt
              </button>
              <button onClick={() => { copyShareLink(messages); trackExport(); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-navy-700 transition-colors">
                <Link2 className="w-4 h-4 text-emerald-500" />
                Copy share link
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
