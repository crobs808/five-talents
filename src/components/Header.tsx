'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { LogoIcon } from './Logo';

interface NavItem {
  label: string;
  href: string;
  requiresAuth?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Check-In', href: '/checkin' },
  { label: 'Admin', href: '/admin' },
];

export function Header() {
  const [isStaff, setIsStaff] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check if staff is authenticated
    const staffAuth = sessionStorage.getItem('staffAuthed');
    setIsStaff(staffAuth === 'true');

    // Initialize theme from localStorage or default to light
    const savedTheme = localStorage.getItem('theme');
    const shouldBeDark = savedTheme === 'dark';
    setIsDark(shouldBeDark);
    
    // Apply theme to document immediately
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    setMounted(true);
  }, []);

  const handleToggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    
    // Update DOM immediately
    if (newIsDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Render minimal header until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <nav className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <LogoIcon width={40} height={40} />
              <span className="text-xl font-bold text-gray-900 dark:text-gray-100">Five Talents</span>
            </Link>
          </div>
        </nav>
      </header>
    );
  }

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <nav className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <LogoIcon width={40} height={40} />
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">Five Talents</span>
          </Link>
          <div className="flex gap-6 items-center">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={handleToggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle theme"
              type="button"
            >
              {isDark ? (
                // Sun icon - shown in dark mode, click to go light
                <svg className="w-6 h-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                // Moon icon - shown in light mode, click to go dark
                <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}
