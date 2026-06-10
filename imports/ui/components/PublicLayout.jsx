import React, { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Meteor } from 'meteor/meteor';
import { AnimatePresence, motion } from 'framer-motion';
import { Button, Input, Spinner } from '@mieweb/ui';
import { Menu } from 'lucide-react';

import ThemeToggle from './ThemeToggle';

const navLinkClasses = ({ isActive }) =>
  [
    'text-base font-semibold rounded-md px-4 py-2 transition-colors',
    isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
  ].join(' ');

const navActionClasses =
  'text-base font-semibold rounded-md px-4 py-2 transition-colors text-muted-foreground hover:text-foreground';

export function PublicHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === '/';
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const adminButtonClasses = [
    'text-sm font-medium rounded-md px-3 py-2 transition-colors',
    isLoginOpen ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
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
      className="sticky top-0 z-40 border-b border-border bg-background backdrop-blur"
    >
      <div className="mx-auto flex h-28 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="relative shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
            <Button
              type="button"
              variant="ghost"
              className={adminButtonClasses}
              onClick={toggleLogin}
              aria-expanded={isLoginOpen}
              aria-controls="inline-admin-login"
            >
              Admin Login
            </Button>
          ) : (
            <NavLink to="/login" className={navLinkClasses}>
              Admin Login
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/checkin"
            className="hidden vm-btn-primary rounded-md px-6 py-3 text-base font-semibold sm:inline-flex h-12 items-center"
          >
            Start Check-In
          </Link>

          <div className="flex items-center gap-2">
            <div className="hidden h-8 border-l border-border pl-3 sm:flex sm:items-center">
              <ThemeToggle className="rounded-md p-2 text-muted-foreground hover:text-foreground" />
            </div>
            <div className="sm:hidden">
              <ThemeToggle className="rounded-md p-2 text-muted-foreground hover:text-foreground" />
            </div>
          </div>

          <div className="relative lg:hidden">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-md"
              aria-label="Open navigation"
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen((o) => !o)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {mobileNavOpen && (
              <ul className="absolute right-0 top-full z-50 mt-2 w-52 rounded-lg border border-border bg-card p-2 shadow-xl">
                <li>
                  <NavLink
                    to="/"
                    className="block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                    onClick={() => setMobileNavOpen(false)}
                  >
                    Home
                  </NavLink>
                </li>
                <li>
                  <Link
                    to="/checkin"
                    className="block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                    onClick={() => setMobileNavOpen(false)}
                  >
                    Check In
                  </Link>
                </li>
                <li>
                  {isHomePage ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full justify-start rounded-md px-3 py-2 text-sm font-medium"
                      onClick={() => {
                        setMobileNavOpen(false);
                        toggleLogin();
                      }}
                    >
                      Admin Login
                    </Button>
                  ) : (
                    <NavLink
                      to="/login"
                      className="block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                      onClick={() => setMobileNavOpen(false)}
                    >
                      Admin Login
                    </NavLink>
                  )}
                </li>
              </ul>
            )}
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
            className="overflow-hidden border-t border-border bg-card/95"
          >
            <div className="mx-auto flex w-full max-w-7xl justify-end px-4 py-3 sm:px-6 lg:px-8">
              <form
                onSubmit={handleInlineLogin}
                className="vm-card w-full rounded-xl p-4 lg:w-auto"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Input
                    type="email"
                    className="w-full sm:w-44 lg:w-52"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                  <Input
                    type="password"
                    className="w-full sm:w-40 lg:w-48"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />

                  {error && (
                    <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    className="rounded-md px-4 py-2 text-sm font-semibold sm:min-w-24"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner size="sm" className="me-1" />
                        Logging in
                      </>
                    ) : (
                      'Login'
                    )}
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="sr-only"
                  onClick={closeLogin}
                >
                  Close
                </Button>
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
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader />
      <main>{children}</main>
      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 text-sm vm-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Vistamate. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link
              to="/checkin"
              className="font-medium hover:text-foreground transition-colors"
            >
              Check In
            </Link>
            <Link
              to="/login"
              className="font-medium hover:text-foreground transition-colors"
            >
              Admin Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
