import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { BarChart2, MessageSquare, Clock, Zap, Trash2, TrendingUp, Users } from 'lucide-react';
import useAnalyticsStore from '../store/useAnalyticsStore';

const COLORS = {
  immigration: '#4A90D9',
  tax:         '#10b981',
  labor:       '#f59e0b',
  business:    '#8b5cf6',
  all:         '#6b7280',
};
const CONF_COLORS = { high: '#10b981', medium: '#f59e0b', low: '#ef4444' };

function StatCard({ icon: Icon, label, value, sub, color = 'blue' }) {
  const colorMap = {
    blue:   'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green:  'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    amber:  'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
  };
  return (
    <div className="bg-white dark:bg-navy-800 rounded-2xl p-5 border border-gray-100 dark:border-navy-700 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-navy-500 dark:text-white">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function Admin() {
  const {
    totalQueries,
    categoryBreakdown,
    confidenceCounts,
    llmUsedCount,
    llmFallbackCount,
    recentQuestions,
    exportCount,
    checklistCount,
    sessionStart,
    getAvgResponseTime,
    clearAnalytics,
  } = useAnalyticsStore();

  const avgMs = getAvgResponseTime();
  const sessionDuration = Math.round((Date.now() - sessionStart) / 60000);

  // Category chart data
  const categoryData = Object.entries(categoryBreakdown)
    .filter(([k]) => k !== 'all')
    .map(([name, count]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), count, fill: COLORS[name] }));

  // Confidence chart data
  const confidenceData = Object.entries(confidenceCounts).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    fill: CONF_COLORS[name],
  }));

  // LLM usage
  const llmData = [
    { name: 'Claude AI', value: llmUsedCount,    fill: '#8b5cf6' },
    { name: 'Fallback',  value: llmFallbackCount, fill: '#6b7280' },
  ];

  const llmPct = totalQueries > 0 ? Math.round((llmUsedCount / totalQueries) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-2xl font-bold text-navy-500 dark:text-white flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-nordic-500" />
            Analytics Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Session started {sessionDuration} min ago · Local client-side analytics
          </p>
        </div>
        <button
          onClick={() => { if (confirm('Clear all analytics data?')) clearAnalytics(); }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-200 dark:border-red-800 text-red-500 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <Trash2 className="w-4 h-4" /> Clear Data
        </button>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={MessageSquare} label="Total Queries"     value={totalQueries} color="blue"   sub="All-time questions asked" />
        <StatCard icon={Zap}          label="Claude AI Usage"   value={`${llmPct}%`} color="purple" sub={`${llmUsedCount} AI / ${llmFallbackCount} fallback`} />
        <StatCard icon={Clock}        label="Avg Response Time" value={avgMs ? `${avgMs}ms` : '—'}  color="green"  sub="Server response latency" />
        <StatCard icon={TrendingUp}   label="Exports + Lists"   value={exportCount + checklistCount} color="amber" sub={`${exportCount} exports, ${checklistCount} checklists`} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Category breakdown bar */}
        <div className="md:col-span-2 bg-white dark:bg-navy-800 rounded-2xl p-5 border border-gray-100 dark:border-navy-700 shadow-sm">
          <h3 className="font-semibold text-navy-500 dark:text-white mb-4">Queries by Category</h3>
          {categoryData.some((d) => d.count > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={categoryData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: '#1B2A4A', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12 }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {categoryData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
              No data yet — start asking questions
            </div>
          )}
        </div>

        {/* Confidence pie */}
        <div className="bg-white dark:bg-navy-800 rounded-2xl p-5 border border-gray-100 dark:border-navy-700 shadow-sm">
          <h3 className="font-semibold text-navy-500 dark:text-white mb-4">Confidence Distribution</h3>
          {confidenceData.some((d) => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={confidenceData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {confidenceData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1B2A4A', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12 }}
                />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
              No data yet
            </div>
          )}
        </div>
      </div>

      {/* LLM usage + Recent questions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* LLM usage donut */}
        <div className="bg-white dark:bg-navy-800 rounded-2xl p-5 border border-gray-100 dark:border-navy-700 shadow-sm">
          <h3 className="font-semibold text-navy-500 dark:text-white mb-4">AI vs Fallback</h3>
          {llmData.some((d) => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={llmData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                  {llmData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1B2A4A', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-gray-400 text-sm">No data</div>
          )}
        </div>

        {/* Recent questions */}
        <div className="md:col-span-2 bg-white dark:bg-navy-800 rounded-2xl p-5 border border-gray-100 dark:border-navy-700 shadow-sm">
          <h3 className="font-semibold text-navy-500 dark:text-white mb-4">
            Recent Questions
            <span className="ml-2 text-xs font-normal text-gray-400">({recentQuestions.length})</span>
          </h3>
          {recentQuestions.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
              No questions asked yet
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto scrollbar-thin pr-1">
              {recentQuestions.map((q, i) => (
                <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-gray-50 dark:bg-navy-700">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: COLORS[q.category] || '#6b7280' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 dark:text-gray-200 truncate">{q.query}</p>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                      <span className="capitalize">{q.category || 'all'}</span>
                      {q.confidence && <span>· {q.confidence} confidence</span>}
                      {q.llmUsed && <span className="text-purple-400">· Claude AI</span>}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {new Date(q.timestamp).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Note */}
      <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-8">
        Analytics are stored locally in your browser. Data resets when you clear localStorage.
      </p>
    </div>
  );
}