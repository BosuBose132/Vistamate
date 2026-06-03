import React, { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Meteor } from 'meteor/meteor';
import { AnimatePresence, motion } from 'framer-motion';

import ThemeToggle from './ThemeToggle';

const navLinkClasses = ({ isActive }) =>
  [
    'text-base font-semibold rounded-md px-4 py-2 transition-colors',
    isActive
      ? 'text-[var(--vm-primary)]'
      : 'text-[var(--vm-muted)] hover:text-[var(--vm-text)]',
  ].join(' ');

const navActionClasses =
  'text-base font-semibold rounded-md px-4 py-2 transition-colors text-[var(--vm-muted)] hover:text-[var(--vm-text)]';

export function PublicHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === '/';
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const adminButtonClasses = [
    'text-sm font-medium rounded-md px-3 py-2 transition-colors',
    isLoginOpen
      ? 'text-[var(--vm-primary)]'
      : 'text-[var(--vm-muted)] hover:text-[var(--vm-text)]',
  ].join(' ');

  const toggleLogin = () => {
    setError('');
    setIsLoginOpen((open) => !open);
  };

  const closeLogin = () => {
    setError('');
    setPassword('');
    setIsLoginOpen(false);
  };

  const handleInlineLogin = (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    Meteor.loginWithPassword(email, password, (err) => {
      setIsSubmitting(false);

      if (err) {
        setError(err.reason || 'Login failed');
        return;
      }

      setPassword('');
      setIsLoginOpen(false);
      navigate('/admin');
    });
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className="sticky top-0 z-40 border-b border-[var(--vm-border)] bg-[var(--vm-content-bg)] backdrop-blur"
    >
      <div className="mx-auto flex h-28 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="relative shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vm-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--vm-content-bg)]"
          aria-label="Vistamate home"
        >
          <img
            src="/VistaMate.png"
            alt="Vistamate"
            className="h-40 w-auto object-contain"
          />
        </Link>

        <nav className="hidden items-center gap-2 lg:flex" aria-label="Primary">
          <NavLink to="/" className={navLinkClasses}>
            Home
          </NavLink>
          <Link to="/checkin" className={navActionClasses}>
            Check In
          </Link>
          {isHomePage ? (
            <button
              type="button"
              className={adminButtonClasses}
              onClick={toggleLogin}
              aria-expanded={isLoginOpen}
              aria-controls="inline-admin-login"
            >
              Admin Login
            </button>
          ) : (
            <NavLink to="/login" className={navLinkClasses}>
              Admin Login
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/checkin"
            className="hidden vm-btn-primary rounded-md px-6 py-3 text-base font-semibold sm:inline-block h-12 flex items-center"
          >
            Start Check-In
          </Link>

          <div className="flex items-center gap-2">
            <div className="hidden h-8 border-l border-[var(--vm-border)] pl-3 sm:flex sm:items-center">
              <ThemeToggle className="rounded-md p-2 text-[var(--vm-muted)] hover:text-[var(--vm-text)]" />
            </div>
            <div className="sm:hidden">
              <ThemeToggle className="rounded-md p-2 text-[var(--vm-muted)] hover:text-[var(--vm-text)]" />
            </div>
          </div>

          <div className="dropdown dropdown-end lg:hidden">
            <button
              type="button"
              tabIndex={0}
              className="rounded-md p-2 text-[var(--vm-muted)] hover:text-[var(--vm-text)]"
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
              className="dropdown-content menu mt-3 w-52 rounded-lg border border-[var(--vm-border)] bg-[var(--vm-surface)] p-2 shadow-xl"
            >
              <li>
                <NavLink to="/">Home</NavLink>
              </li>
              <li>
                <Link to="/checkin">Check In</Link>
              </li>
              <li>
                {isHomePage ? (
                  <button type="button" onClick={toggleLogin}>
                    Admin Login
                  </button>
                ) : (
                  <NavLink to="/login">Admin Login</NavLink>
                )}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isHomePage && isLoginOpen && (
          <motion.div
            id="inline-admin-login"
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            className="overflow-hidden border-t border-[var(--vm-border)] bg-[var(--vm-surface)]/95"
          >
            <div className="mx-auto flex w-full max-w-7xl justify-end px-4 py-3 sm:px-6 lg:px-8">
              <form
                onSubmit={handleInlineLogin}
                className="vm-card w-full rounded-xl p-4 lg:w-auto"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    type="email"
                    className="vm-input w-full rounded-md sm:w-44 lg:w-52"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                  <input
                    type="password"
                    className="vm-input w-full rounded-md sm:w-40 lg:w-48"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />

                  {error && (
                    <div className="rounded-md bg-[var(--vm-danger-soft)] px-3 py-2 text-sm text-[var(--vm-danger)]">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="vm-btn-primary rounded-md px-4 py-2 text-sm font-semibold sm:min-w-24"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="loading loading-spinner loading-xs" />
                        Logging in
                      </>
                    ) : (
                      'Login'
                    )}
                  </button>
                </div>
                <button type="button" className="sr-only" onClick={closeLogin}>
                  Close
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-[var(--vm-content-bg)] text-[var(--vm-text)]">
      <PublicHeader />
      <main>{children}</main>
      <footer className="border-t border-[var(--vm-border)] bg-[var(--vm-surface)]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 text-sm vm-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Vistamate. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link
              to="/checkin"
              className="font-medium hover:text-[var(--vm-text)] transition-colors"
            >
              Check In
            </Link>
            <Link
              to="/login"
              className="font-medium hover:text-[var(--vm-text)] transition-colors"
            >
              Admin Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
