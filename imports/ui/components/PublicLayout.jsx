import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';

import ThemeToggle from './ThemeToggle';

const navLinkClasses = ({ isActive }) =>
  [
    'btn btn-ghost btn-sm rounded-md font-medium',
    isActive ? 'bg-primary/10 text-primary' : 'text-base-content/75',
  ].join(' ');

const sectionLinkClasses =
  'btn btn-ghost btn-sm rounded-md font-medium text-base-content/75';

export function PublicHeader() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className="sticky top-0 z-40 border-b border-base-300/80 bg-base-100/95 shadow-sm backdrop-blur"
    >
      <div className="navbar mx-auto min-h-16 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="navbar-start gap-2">
          <div className="dropdown lg:hidden">
            <button
              type="button"
              tabIndex={0}
              className="btn btn-ghost btn-square rounded-md"
              aria-label="Open navigation"
            >
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <ul
              tabIndex={0}
              className="menu dropdown-content mt-3 w-64 rounded-lg border border-base-300 bg-base-100 p-2 shadow-xl"
            >
              <li>
                <NavLink to="/">Home</NavLink>
              </li>
              <li>
                <Link to="/#platform">Platform</Link>
              </li>
              <li>
                <Link to="/#workflow">Workflow</Link>
              </li>
              <li>
                <NavLink to="/login">Admin Login</NavLink>
              </li>
            </ul>
          </div>

          <Link
            to="/"
            className="relative h-16 w-40 shrink-0 rounded-md sm:w-48 lg:w-56 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100"
            aria-label="Vistamate home"
          >
            <img
              src="/VistaMate.png"
              alt="Vistamate"
              className="absolute left-0 top-1/2 h-28 w-auto max-w-none -translate-y-1/2 object-contain sm:h-32 lg:h-36"
            />
          </Link>
        </div>

        <div className="navbar-center hidden lg:flex">
          <nav className="flex items-center gap-1" aria-label="Primary">
            <NavLink to="/" className={navLinkClasses}>
              Home
            </NavLink>
            <Link to="/#platform" className={sectionLinkClasses}>
              Platform
            </Link>
            <Link to="/#workflow" className={sectionLinkClasses}>
              Workflow
            </Link>
          </nav>
        </div>

        <div className="navbar-end gap-2">
          <ThemeToggle className="btn btn-ghost btn-square rounded-md" />
          <NavLink to="/login" className={navLinkClasses}>
            Admin Login
          </NavLink>
          <Link to="/checkin" className="btn btn-primary btn-sm rounded-md">
            Check In
          </Link>
        </div>
      </div>
    </motion.header>
  );
}

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-base-200 text-base-content">
      <PublicHeader />
      <main>{children}</main>
      <footer className="border-t border-base-300/80 bg-base-100">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 text-sm text-base-content/65 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Vistamate. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/checkin" className="link-hover font-medium">
              Check In
            </Link>
            <Link to="/login" className="link-hover font-medium">
              Admin Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
