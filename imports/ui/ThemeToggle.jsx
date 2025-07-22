// ThemeToggle.js
import React from 'react';
import { useTheme } from './ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      className="btn btn-outline-secondary position-absolute top-0 end-0 m-3"
      onClick={toggleTheme}
      aria-label="Toggle dark/light mode"
    >
      {theme === 'dark' ? '🌙' : '☀️'}
    </button>
  );
};

export default ThemeToggle;