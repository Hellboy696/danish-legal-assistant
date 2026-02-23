export default function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-start p-6 rounded-2xl
                    bg-white dark:bg-navy-800 border border-gray-100 dark:border-navy-700
                    shadow-sm hover:shadow-md dark:hover:shadow-navy-900/40
                    transition-shadow duration-200">
      <div className="w-11 h-11 rounded-xl bg-nordic-50 dark:bg-nordic-900/30
                      flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-nordic-600 dark:text-nordic-400" />
      </div>
      <h3 className="font-semibold text-navy-500 dark:text-white mb-1.5">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}
