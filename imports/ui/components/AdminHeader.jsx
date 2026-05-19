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
    'btn btn-ghost btn-sm rounded-md font-medium',
    isActive ? 'bg-primary/10 text-primary' : 'text-base-content/75',
  ].join(' ');

export default function AdminHeader() {
  const navigate = useNavigate();
  const onLogout = () => Meteor.logout(() => navigate('/'));

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
      className="mb-6 rounded-2xl border border-base-300/80 bg-base-100/95 shadow-sm shadow-base-content/5 backdrop-blur"
    >
      <div className="navbar min-h-16 w-full px-4 sm:px-6 lg:px-8">
        <div className="navbar-start gap-2">
          <div className="dropdown lg:hidden">
            <button
              type="button"
              tabIndex={0}
              className="btn btn-ghost btn-square rounded-md"
              aria-label="Open admin navigation"
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
                  strokeLinecap="round"
                  strokeWidth="2"
                />
              </svg>
            </button>
            <ul
              tabIndex={0}
              className="menu dropdown-content mt-3 w-64 rounded-lg border border-base-300 bg-base-100 p-2 shadow-xl"
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
          <nav
            className="flex items-center gap-1"
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

        <div className="navbar-end gap-2">
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
