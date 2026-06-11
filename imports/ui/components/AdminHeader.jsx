import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { motion } from 'framer-motion';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Button } from '@mieweb/ui';
import { Menu } from 'lucide-react';

import ThemeToggle from '/imports/ui/components/ThemeToggle';

const navItems = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/checkins', label: 'Check-ins' },
  { to: '/admin/stations', label: 'Stations' },
  { to: '/admin/surveys', label: 'Surveys' },
];

const navLinkClass = ({ isActive }) =>
  [
    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    isActive
      ? 'bg-primary/10 text-primary'
      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
  ].join(' ');

export default function AdminHeader() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const onLogout = () => Meteor.logout(() => navigate('/'));

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="mb-6 overflow-hidden rounded-xl border border-border bg-card shadow-sm"
    >
      <div className="flex min-h-16 w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative lg:hidden">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-md"
              aria-label="Open admin navigation"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((o) => !o)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {mobileMenuOpen && (
              <ul className="absolute left-0 top-full z-50 mt-2 w-56 rounded-xl border border-border bg-card p-2 shadow-xl">
                {navItems.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      className="block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Link
            to="/admin"
            className="flex min-w-0 items-center gap-3 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="Vistamate admin dashboard"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-sm">
              V
            </span>

            <span className="hidden min-w-0 sm:block">
              <span className="block truncate text-sm font-semibold leading-5 text-foreground">
                Vistamate
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                Admin Suite
              </span>
            </span>
          </Link>
        </div>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Admin">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={navLinkClass}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle className="rounded-md p-2 text-muted-foreground hover:text-foreground" />

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-md font-medium"
            onClick={onLogout}
          >
            Logout
          </Button>
        </div>
      </div>
    </motion.header>
  );
}
