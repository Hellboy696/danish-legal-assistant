import { Scale, AlertTriangle, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { STATS } from '../data/mockData';

const TECH_STACK = [
  { name: 'LanceDB', role: 'Vector database for semantic search', category: 'Backend' },
  { name: 'Sentence Transformers', role: 'Text embedding (all-MiniLM-L6-v2)', category: 'Backend' },
  { name: 'Python / Streamlit', role: 'Original MVP backend', category: 'Backend' },
  { name: 'React 18 + Vite', role: 'Frontend framework and build tool', category: 'Frontend' },
  { name: 'Tailwind CSS v3', role: 'Utility-first styling', category: 'Frontend' },
  { name: 'Framer Motion', role: 'Animations and transitions', category: 'Frontend' },
  { name: 'Zustand', role: 'Client-side state management', category: 'Frontend' },
];

export default function About() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-navy-500 dark:bg-nordic-600 flex items-center justify-center">
          <Scale className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-navy-500 dark:text-white">About This Project</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            Danish Legal Assistant — AI-Powered Law Search
          </p>
        </div>
      </div>

      {/* Description */}
      <div className="prose prose-gray dark:prose-invert max-w-none mb-10">
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
          Danish Legal Assistant is a portfolio project demonstrating AI-powered semantic search
          over Danish legal texts. It uses vector embeddings to find the most relevant regulations
          for any question you ask in plain English — covering immigration, tax, and labor law.
        </p>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          The backend is built with Python, LanceDB, and Sentence Transformers. The frontend
          uses React with a Nordic Minimalism design system, featuring a ChatGPT-style
          conversation interface and animated law cards.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Danish Laws', value: STATS.lawCount },
          { label: 'Categories', value: STATS.categoryCount },
          { label: 'Avg Search', value: `${STATS.avgSearchMs}ms` },
          { label: 'Accuracy', value: STATS.accuracy },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="bg-white dark:bg-navy-800 border border-gray-100 dark:border-navy-700
                       rounded-xl p-4 text-center"
          >
            <p className="text-2xl font-bold text-navy-500 dark:text-white">{value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tech stack */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold text-navy-500 dark:text-white mb-4">Tech Stack</h2>
        <div className="bg-white dark:bg-navy-800 border border-gray-100 dark:border-navy-700 rounded-xl overflow-hidden">
          {TECH_STACK.map(({ name, role, category }, i) => (
            <div
              key={name}
              className={`flex items-center justify-between px-5 py-3.5 text-sm
                          ${i < TECH_STACK.length - 1 ? 'border-b border-gray-100 dark:border-navy-700' : ''}`}
            >
              <div>
                <span className="font-medium text-navy-500 dark:text-white">{name}</span>
                <span className="text-gray-400 dark:text-gray-500 ml-2">— {role}</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-navy-700
                               text-gray-500 dark:text-gray-400 flex-shrink-0">
                {category}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Legal disclaimer */}
      <div className="rounded-xl border border-amber-200 dark:border-amber-800/50
                      bg-amber-50 dark:bg-amber-900/20 p-5 mb-8">
        <div className="flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-800 dark:text-amber-400 mb-1">Legal Disclaimer</h3>
            <p className="text-sm text-amber-700 dark:text-amber-300/80 leading-relaxed">
              This tool is for informational purposes only and does not constitute legal advice.
              The information may be outdated or incomplete. Always consult a licensed Danish
              legal professional for advice specific to your situation.
            </p>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="flex gap-4">
        <Link
          to="/chat"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl
                     bg-navy-500 dark:bg-nordic-600 text-white text-sm font-medium
                     hover:bg-navy-600 dark:hover:bg-nordic-700 transition-colors"
        >
          Try the Assistant
        </Link>
        <Link
          to="/laws"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl
                     border border-gray-300 dark:border-navy-600
                     text-gray-700 dark:text-gray-300 text-sm font-medium
                     hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors"
        >
          Browse Laws
        </Link>
      </div>
    </div>
  );
}
