/* eslint-disable-next-line unused-imports/no-unused-imports */
import React from 'react';
import { useEffect, useState } from 'react';

const THEME_KEY = 'daisy-theme';
const LIGHT_THEME = 'vistamate';
const DARK_THEME = 'dark';

function getCurrentTheme() {
  return (
    localStorage.getItem(THEME_KEY) ||
    document.documentElement.getAttribute('data-theme') ||
    LIGHT_THEME
  );
}

function applyTheme(theme) {
  const isDark = theme === DARK_THEME;

  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.classList.toggle('dark', isDark);

  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // ignore storage errors
  }

  if (typeof window.__setTheme === 'function') {
    window.__setTheme(theme);
  }
}

function ThemeToggle({ className = '' }) {
  const [isDark, setIsDark] = useState(() => getCurrentTheme() === DARK_THEME);

  useEffect(() => {
    const currentTheme = getCurrentTheme();
    applyTheme(currentTheme);
    setIsDark(currentTheme === DARK_THEME);

    const obs = new MutationObserver(() => {
      const theme = document.documentElement.getAttribute('data-theme');
      setIsDark(theme === DARK_THEME);
    });

    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class'],
    });

    return () => obs.disconnect();
  }, []);

  return (
    <button
      type="button"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() => {
        const next = isDark ? LIGHT_THEME : DARK_THEME;
        applyTheme(next);
        setIsDark(next === DARK_THEME);
      }}
      className={`cursor-pointer ${className}`}
    >
      {isDark ? (
        <svg
          aria-hidden="true"
          className="h-6 w-6"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
        >
          <g
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            fill="none"
            stroke="currentColor"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </g>
        </svg>
      ) : (
        <svg
          aria-hidden="true"
          className="h-6 w-6"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
        >
          <g
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            fill="none"
            stroke="currentColor"
          >
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </g>
        </svg>
      )}
    </button>
  );
}

export default ThemeToggle;
