import { useEffect } from 'react';
import LawCatalog from '../components/law/LawCatalog';
import useLawStore from '../store/useLawStore';

export default function Laws() {
  const loadFromApi = useLawStore((s) => s.loadFromApi);

  // Attempt to load from real API when the page mounts
  useEffect(() => {
    loadFromApi();
  }, [loadFromApi]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy-500 dark:text-white mb-2">
          Danish Law Catalog
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Browse all 10 laws across immigration, tax, and labor categories.
          Click any card to expand the full legal text.
        </p>
      </div>
      <LawCatalog />
    </div>
  );
}
