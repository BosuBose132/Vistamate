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
    'btn btn-ghost btn-sm rounded-md border border-transparent px-3',
    'font-medium text-base-content/70',
    isActive
      ? 'border-primary/20 bg-primary/10 text-primary shadow-sm'
      : 'hover:border-base-300 hover:bg-base-200/80',
  ].join(' ');

export default function AdminHeader() {
  const navigate = useNavigate();
  const onLogout = () => Meteor.logout(() => navigate('/login'));

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
      className="mb-6 rounded-2xl border border-base-300/80 bg-base-100/95 shadow-sm shadow-base-content/5 backdrop-blur"
    >
      <div className="flex min-h-16 flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-5">
        <div className="flex min-w-0 flex-1 flex-col gap-3 lg:flex-row lg:items-center">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-3 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100"
            aria-label="Vistamate home"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
              V
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-semibold tracking-wide">
                Vistamate
              </span>
              <span className="block text-xs font-medium text-base-content/55">
                Admin
              </span>
            </span>
          </Link>

          <nav
            className="flex gap-1 overflow-x-auto whitespace-nowrap pb-1 lg:pb-0"
            aria-label="Admin"
          >
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
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle className="btn btn-ghost btn-square rounded-md" />
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
