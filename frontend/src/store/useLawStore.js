import { create } from 'zustand';
import { LAWS } from '../data/mockData';

const API_BASE = '/api/v1';

/**
 * Fetch all laws from FastAPI backend (41 production records).
 * Falls back to LAWS from mockData if backend is unavailable.
 */
async function fetchLaws() {
  const resp = await fetch(`${API_BASE}/laws?page_size=50`, {
    signal: AbortSignal.timeout(8000),
  });
  if (!resp.ok) throw new Error(`API error ${resp.status}`);
  const data = await resp.json();
  return data.laws.map((l) => ({
    ...l,
    keywords: Array.isArray(l.keywords) ? l.keywords : [],
    content: l.content || l.content_preview || '',
  }));
}

// Holds the timeout ID for the isLoading debounce so rapid calls don't stack
let _loadingTimer = null;

const useLawStore = create((set, get) => ({
  laws: LAWS,          // Start with mock data immediately (no loading flash)
  searchQuery: '',
  activeCategory: null,
  selectedLawId: null,
  isLoading: false,
  apiLoaded: false,
  apiError: false,  // true when last load attempt failed — allows retry on next mount

  /** Load laws from real API on mount (called from Laws page) */
  loadFromApi: async () => {
    const { apiLoaded, apiError } = get();
    // Skip if already loaded successfully; retry if previously failed
    if (apiLoaded && !apiError) return;
    try {
      const laws = await fetchLaws();
      set({ laws, apiLoaded: true, apiError: false });
    } catch (err) {
      console.warn('[useLawStore] API unavailable, using mock data:', err.message);
      // Mark as error so next mount will retry the API
      set({ apiLoaded: true, apiError: true });
    }
  },

  // Derived: filter laws based on current state
  getFilteredLaws: () => {
    const { searchQuery, activeCategory, laws } = get();
    let result = laws;

    if (activeCategory) {
      result = result.filter((l) => l.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          (l.title_da || '').toLowerCase().includes(q) ||
          (l.content || '').toLowerCase().includes(q) ||
          (l.summary || '').toLowerCase().includes(q) ||
          (Array.isArray(l.keywords) ? l.keywords : []).some((kw) =>
            kw.toLowerCase().includes(q)
          ) ||
          l.law_reference.toLowerCase().includes(q)
      );
    }

    return result;
  },

  setSearchQuery: (query) => {
    // Debounce the loading indicator so rapid typing doesn't cause flicker
    if (_loadingTimer) clearTimeout(_loadingTimer);
    set({ isLoading: true, searchQuery: query });
    _loadingTimer = setTimeout(() => set({ isLoading: false }), 150);
  },

  setCategory: (category) => {
    if (_loadingTimer) clearTimeout(_loadingTimer);
    set({ isLoading: true, activeCategory: category });
    _loadingTimer = setTimeout(() => set({ isLoading: false }), 150);
  },

  toggleLaw: (id) => {
    const { selectedLawId } = get();
    set({ selectedLawId: selectedLawId === id ? null : id });
  },

  clearFilters: () => {
    set({ searchQuery: '', activeCategory: null, selectedLawId: null });
  },
}));

export default useLawStore;
