import { Moon, Sun } from 'lucide-react';
import useThemeStore from '../../store/useThemeStore';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      className="p-2 rounded-lg text-gray-500 dark:text-gray-400
                 hover:bg-gray-100 dark:hover:bg-navy-700
                 transition-colors duration-200"
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5" />
      ) : (
        <Sun className="w-5 h-5" />
      )}
    </button>
  );
}
