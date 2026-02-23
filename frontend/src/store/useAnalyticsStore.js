import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Client-side analytics tracking store.
 * Persisted in localStorage for the admin dashboard.
 */
const useAnalyticsStore = create(
  persist(
    (set, get) => ({
      /** Total chat queries sent */
      totalQueries: 0,
      /** Queries per category */
      categoryBreakdown: { immigration: 0, tax: 0, labor: 0, business: 0, all: 0 },
      /** Confidence distribution */
      confidenceCounts: { high: 0, medium: 0, low: 0 },
      /** Whether Claude API was used */
      llmUsedCount: 0,
      llmFallbackCount: 0,
      /** Response time samples (ms) */
      responseTimes: [],
      /** Recent questions (last 50) */
      recentQuestions: [],
      /** Session start time */
      sessionStart: Date.now(),
      /** Export count */
      exportCount: 0,
      /** Checklist completions */
      checklistCount: 0,

      trackQuery: ({ query, category, confidence, llmUsed, responseTimeMs }) => {
        set((s) => {
          const cat = category || 'all';
          const newTimes = [...s.responseTimes, responseTimeMs].slice(-100);
          const newQuestions = [
            { query, category: cat, timestamp: Date.now(), confidence, llmUsed },
            ...s.recentQuestions,
          ].slice(0, 50);

          return {
            totalQueries: s.totalQueries + 1,
            categoryBreakdown: {
              ...s.categoryBreakdown,
              [cat]: (s.categoryBreakdown[cat] || 0) + 1,
            },
            confidenceCounts: confidence
              ? { ...s.confidenceCounts, [confidence]: s.confidenceCounts[confidence] + 1 }
              : s.confidenceCounts,
            llmUsedCount: llmUsed ? s.llmUsedCount + 1 : s.llmUsedCount,
            llmFallbackCount: !llmUsed ? s.llmFallbackCount + 1 : s.llmFallbackCount,
            responseTimes: newTimes,
            recentQuestions: newQuestions,
          };
        });
      },

      trackExport: () => set((s) => ({ exportCount: s.exportCount + 1 })),
      trackChecklist: () => set((s) => ({ checklistCount: s.checklistCount + 1 })),

      getAvgResponseTime: () => {
        const { responseTimes } = get();
        if (!responseTimes.length) return 0;
        return Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length);
      },

      clearAnalytics: () =>
        set({
          totalQueries: 0,
          categoryBreakdown: { immigration: 0, tax: 0, labor: 0, business: 0, all: 0 },
          confidenceCounts: { high: 0, medium: 0, low: 0 },
          llmUsedCount: 0,
          llmFallbackCount: 0,
          responseTimes: [],
          recentQuestions: [],
          exportCount: 0,
          checklistCount: 0,
          sessionStart: Date.now(),
        }),
    }),
    {
      name: 'danish-legal-analytics',
    }
  )
);

export default useAnalyticsStore;
