import { CATEGORY_CONFIG } from '../../data/mockData';

export default function CategoryBadge({ category, size = 'md' }) {
  const config = CATEGORY_CONFIG[category];
  if (!config) return null;

  const sizeClasses = size === 'sm'
    ? 'text-xs px-2 py-0.5 gap-1'
    : 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium
        ${sizeClasses}
        ${config.bgClass} ${config.textClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dotClass}`} />
      {config.label}
    </span>
  );
}
