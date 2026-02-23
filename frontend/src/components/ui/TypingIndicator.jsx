import { AnimatePresence, motion } from 'framer-motion';
import { Scale } from 'lucide-react';

export default function TypingIndicator({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2 }}
          className="flex items-end gap-3 py-1"
        >
          {/* AI Avatar */}
          <div className="w-8 h-8 rounded-full bg-navy-500 flex items-center justify-center flex-shrink-0">
            <Scale className="w-4 h-4 text-white" />
          </div>

          {/* Bouncing dots */}
          <div className="bg-white dark:bg-navy-700 border border-gray-100 dark:border-navy-600
                          rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-typing-dot"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
