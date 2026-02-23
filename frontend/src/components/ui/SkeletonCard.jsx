export default function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-100 dark:border-navy-700
                    bg-white dark:bg-navy-800 p-5 animate-pulse">
      {/* Badge placeholder */}
      <div className="h-5 w-24 bg-gray-200 dark:bg-navy-600 rounded-full mb-3" />
      {/* Title placeholder */}
      <div className="h-5 w-3/4 bg-gray-200 dark:bg-navy-600 rounded mb-2" />
      {/* Reference placeholder */}
      <div className="h-4 w-1/2 bg-gray-200 dark:bg-navy-600 rounded mb-4" />
      {/* Content lines */}
      <div className="space-y-2">
        <div className="h-3 w-full bg-gray-100 dark:bg-navy-700 rounded" />
        <div className="h-3 w-5/6 bg-gray-100 dark:bg-navy-700 rounded" />
        <div className="h-3 w-4/6 bg-gray-100 dark:bg-navy-700 rounded" />
      </div>
    </div>
  );
}
