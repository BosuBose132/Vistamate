import React, { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Meteor } from 'meteor/meteor';
import { AnimatePresence, motion } from 'framer-motion';

import ThemeToggle from './ThemeToggle';

const navLinkClasses = ({ isActive }) =>
  [
    'btn btn-ghost btn-sm rounded-md font-medium',
    isActive ? 'bg-primary/10 text-primary' : 'text-base-content/75',
  ].join(' ');

const sectionLinkClasses =
  'btn btn-ghost btn-sm rounded-md font-medium text-base-content/75';

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
    'btn btn-ghost btn-sm rounded-md font-medium',
    isLoginOpen ? 'bg-primary/10 text-primary' : 'text-base-content/75',
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
          <Link to="/checkin" className="btn btn-primary btn-sm rounded-md">
            Check In
          </Link>
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
            className="overflow-hidden border-t border-base-300/70 bg-base-100/95"
          >
            <div className="mx-auto flex w-full max-w-7xl justify-end px-4 py-3 sm:px-6 lg:px-8">
              <form
                onSubmit={handleInlineLogin}
                className="w-full rounded-2xl border border-base-300 bg-base-100 p-3 shadow-xl shadow-base-content/5 lg:w-auto"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    type="email"
                    className="input input-bordered input-sm w-full rounded-md sm:w-44 lg:w-52"
                    placeholder="Username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                  <input
                    type="password"
                    className="input input-bordered input-sm w-full rounded-md sm:w-40 lg:w-48"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />

                  {error && (
                    <div className="alert alert-error rounded-md py-2 text-sm">
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-primary btn-sm rounded-md sm:min-w-24"
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
                <button
                  type="button"
                  className="sr-only"
                  onClick={closeLogin}
                >
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
