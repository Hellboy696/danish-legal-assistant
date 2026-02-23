import { CATEGORY_CONFIG } from '../../data/mockData';
import SearchBar from '../ui/SearchBar';
import SkeletonCard from '../ui/SkeletonCard';
import LawCard from './LawCard';
import useLawStore from '../../store/useLawStore';
import clsx from 'clsx';

const CATEGORIES = ['immigration', 'tax', 'labor', 'business'];

export default function LawCatalog() {
  const { searchQuery, activeCategory, isLoading, laws, setSearchQuery, setCategory, clearFilters } =
    useLawStore();
  const filteredLaws = useLawStore((s) => s.getFilteredLaws());

  function getCategoryCount(category) {
    return laws.filter((l) => l.category === category).length;
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search laws by topic, keyword, reference..."
          className="flex-1"
        />
        <div className="flex items-center gap-2 flex-wrap">
          {/* All filter */}
          <button
            onClick={clearFilters}
            className={clsx(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-colors duration-200',
              !activeCategory
                ? 'bg-navy-500 text-white'
                : 'bg-gray-100 dark:bg-navy-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-navy-600'
            )}
          >
            All ({laws.length})
          </button>

          {CATEGORIES.map((cat) => {
            const config = CATEGORY_CONFIG[cat];
            if (!config) return null;
            const count = getCategoryCount(cat);
            if (count === 0) return null;
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategory(isActive ? null : cat)}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors duration-200',
                  isActive
                    ? `${config.bgClass} ${config.textClass}`
                    : 'bg-gray-100 dark:bg-navy-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-navy-600'
                )}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
                {config.emoji} {config.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {isLoading ? 'Loading laws...' : `${filteredLaws.length} law${filteredLaws.length !== 1 ? 's' : ''} found`}
      </p>

      {/* Law grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)
          : filteredLaws.length > 0
          ? filteredLaws.map((law) => <LawCard key={law.id} law={law} variant="catalog" />)
          : (
            <div className="col-span-full text-center py-16 text-gray-400 dark:text-gray-500">
              <p className="text-lg font-medium mb-1">No laws found</p>
              <p className="text-sm">Try a different search term or clear the filters.</p>
            </div>
          )}
      </div>
    </div>
  );
}
