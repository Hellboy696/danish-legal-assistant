import { AlertTriangle, Scale } from 'lucide-react';

const DISCLAIMER =
  'This database provides summaries of Danish law for informational purposes only. ' +
  'Information is based on official government sources verified as of February 2025. ' +
  'Always consult official sources and a licensed legal professional for authoritative legal advice.';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-navy-700
                       bg-white dark:bg-navy-900 py-4 px-4">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center
                      justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
          <span>{DISCLAIMER}</span>
        </span>
        <span className="flex items-center gap-1.5 flex-shrink-0">
          <Scale className="w-3 h-3" />
          Danish Legal Assistant v2.0 — {new Date().getFullYear()}
        </span>
      </div>
    </footer>
  );
}
