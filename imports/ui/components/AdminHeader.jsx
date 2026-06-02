import React from 'react';
import { Meteor } from 'meteor/meteor';
import { motion } from 'framer-motion';
import { Link, NavLink, useNavigate } from 'react-router-dom';

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
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100',
    isActive
      ? 'bg-primary/10 text-primary'
      : 'text-base-content/70 hover:bg-base-200 hover:text-base-content',
  ].join(' ');

function MenuIcon() {
  return (
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
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export default function AdminHeader() {
  const navigate = useNavigate();
  const onLogout = () => Meteor.logout(() => navigate('/'));

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="mb-6 overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-sm"
    >
      <div className="flex min-h-16 w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="dropdown lg:hidden">
            <button
              type="button"
              tabIndex={0}
              className="btn btn-ghost btn-square btn-sm rounded-md"
              aria-label="Open admin navigation"
            >
              <MenuIcon />
            </button>

            <ul
              tabIndex={0}
              className="menu dropdown-content z-50 mt-3 w-64 rounded-xl border border-base-300 bg-base-100 p-2 shadow-xl"
            >
              {navItems.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} end={item.end}>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          <Link
            to="/admin"
            className="flex min-w-0 items-center gap-3 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100"
            aria-label="Vistamate admin dashboard"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-content shadow-sm">
              V
            </span>

            <span className="hidden min-w-0 sm:block">
              <span className="block truncate text-sm font-semibold leading-5 text-base-content">
                Vistamate
              </span>
              <span className="block truncate text-xs text-base-content/55">
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
          <ThemeToggle className="btn btn-ghost btn-square btn-sm rounded-md" />

          <button
            type="button"
            className="btn btn-outline btn-sm rounded-md border-base-300 font-medium"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </motion.header>
  );
}
