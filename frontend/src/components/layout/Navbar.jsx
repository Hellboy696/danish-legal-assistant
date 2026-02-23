import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Scale, Menu, X, BarChart2 } from 'lucide-react';
import ThemeToggle from '../ui/ThemeToggle';
import clsx from 'clsx';

const navLinks = [
  { to: '/', label: 'Home', end: true },
  { to: '/chat', label: 'Ask AI' },
  { to: '/laws', label: 'Browse Laws' },
  { to: '/about', label: 'About' },
];

const linkClass = ({ isActive }) =>
  clsx(
    'text-sm font-medium transition-colors duration-200',
    isActive
      ? 'text-nordic-600 dark:text-nordic-400'
      : 'text-gray-600 dark:text-gray-300 hover:text-navy-500 dark:hover:text-white'
  );

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-navy-700
                       bg-white/80 dark:bg-navy-900/80 backdrop-blur-md">
      <nav className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 font-semibold text-navy-500 dark:text-white
                     hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 rounded-lg bg-navy-500 dark:bg-nordic-600
                          flex items-center justify-center">
            <Scale className="w-4 h-4 text-white" />
          </div>
          <span className="hidden sm:block">
            Danish Legal
            <span className="text-nordic-500 dark:text-nordic-400"> Assistant</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              {label}
            </NavLink>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {/* Admin icon link */}
          <NavLink
            to="/admin"
            title="Analytics Dashboard"
            className={({ isActive }) => clsx(
              'hidden md:flex items-center justify-center w-9 h-9 rounded-xl transition-colors',
              isActive
                ? 'bg-navy-100 dark:bg-navy-700 text-navy-500 dark:text-white'
                : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-navy-700 hover:text-gray-600 dark:hover:text-gray-300'
            )}
          >
            <BarChart2 className="w-4 h-4" />
          </NavLink>
          <Link
            to="/chat"
            className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl
                       bg-navy-500 dark:bg-nordic-600 text-white text-sm font-medium
                       hover:bg-navy-600 dark:hover:bg-nordic-700
                       transition-colors duration-200"
          >
            Ask a Question
          </Link>
          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-500 dark:text-gray-400
                       hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-navy-700
                        bg-white dark:bg-navy-900 px-4 py-3 flex flex-col gap-1">
          {navLinks.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                clsx(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-nordic-50 dark:bg-nordic-900/30 text-nordic-600 dark:text-nordic-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-800'
                )
              }
            >
              {label}
            </NavLink>
          ))}
          <NavLink
            to="/admin"
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-nordic-50 dark:bg-nordic-900/30 text-nordic-600 dark:text-nordic-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-navy-800'
              )
            }
          >
            <BarChart2 className="w-4 h-4" /> Analytics
          </NavLink>
          <Link
            to="/chat"
            onClick={() => setMobileOpen(false)}
            className="mt-2 px-3 py-2 rounded-xl bg-navy-500 dark:bg-nordic-600
                       text-white text-sm font-medium text-center
                       hover:bg-navy-600 dark:hover:bg-nordic-700 transition-colors"
          >
            Ask a Question
          </Link>
        </div>
      )}
    </header>
  );
}
