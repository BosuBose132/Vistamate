import React from 'react';
import { Meteor } from 'meteor/meteor';
import { NavLink, useNavigate } from 'react-router-dom';
import { Button } from '@mieweb/ui';

import ThemeToggle from '/imports/ui/components/ThemeToggle';

const navItems = [
  { to: '/admin', label: 'Dashboard', end: true, icon: GridIcon },
  { to: '/admin/checkins', label: 'Check-ins', icon: LogIcon },
  { to: '/admin/stations', label: 'Stations', icon: KioskIcon },
  { to: '/admin/surveys', label: 'Surveys', icon: FormIcon },
];

const sidebarLinkClass = ({ isActive }) =>
  [
    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all',
    isActive
      ? 'bg-[#123f4c] text-[#55ddd8] shadow-sm'
      : 'text-slate-300 hover:bg-white/10 hover:text-white',
  ].join(' ');

export default function AdminShell({
  title = 'Dashboard',
  eyebrow = 'Vistamate',
  children,
}) {
  const navigate = useNavigate();

  const onLogout = () => {
    Meteor.logout(() => navigate('/'));
  };

  return (
    <div className="min-h-screen vm-app">
      <div className="flex min-h-screen w-full overflow-hidden">
        <aside className="vm-sidebar hidden w-72 shrink-0 lg:flex lg:flex-col">
          <div className="flex h-24 items-center px-7">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#23b6b6] text-white shadow-lg shadow-teal-900/30">
                <LogoMark />
              </div>
              <div>
                <p className="text-xl font-bold tracking-tight">Vistamate</p>
                <p className="text-xs font-medium text-slate-400">
                  MIE Visitor Suite
                </p>
              </div>
            </div>
          </div>

          <div className="vm-sidebar-card mx-5 rounded-xl p-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Active location
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-white">
              Main Reception
            </p>
          </div>

          <nav className="mt-7 flex-1 space-y-1 px-5" aria-label="Admin">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={sidebarLinkClass}
                >
                  <Icon />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="m-5 rounded-2xl bg-[#123f4c] p-5">
            <p className="text-sm font-semibold text-white">Setup progress</p>
            <p className="mt-1 text-xs text-slate-400">
              Stations, surveys, and check-in flow configured.
            </p>
            <div className="mt-4 h-2 rounded-full bg-white/10">
              <div className="h-full w-4/5 rounded-full bg-[#55ddd8]" />
            </div>
            <p className="mt-4 text-sm font-semibold text-[#f6d883]">
              Continue setup →
            </p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="vm-topbar flex h-20 items-center justify-between gap-4 border-b px-4 sm:px-6 lg:px-8">
            <div className="vm-content flex min-w-0 flex-1 flex-col">
              <div className="dropdown lg:hidden">
                <button
                  type="button"
                  tabIndex={0}
                  className="btn btn-ghost btn-square btn-sm rounded-xl"
                  aria-label="Open navigation"
                >
                  <MenuIcon />
                </button>

                <ul
                  tabIndex={0}
                  className="menu dropdown-content z-50 mt-3 w-64 rounded-2xl border border-base-300 bg-base-100 p-2 shadow-xl"
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

              <div>
                <p className="vm-kicker">{eyebrow}</p>
                <h1 className="vm-heading truncate text-lg sm:text-xl">
                  {title}
                </h1>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <div className="vm-pill hidden md:block">
                Live visitor operations
              </div>

              <ThemeToggle className="rounded-xl text-[var(--vm-heading)]" />

              <Button
                type="button"
                variant="outline"
                className="rounded-xl border-[#d9eceb] bg-white text-sm font-semibold text-[#17323b] hover:bg-[#e9f7f6]"
                onClick={onLogout}
              >
                Logout
              </Button>
            </div>
          </header>

          <main className="min-w-0 flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

function LogoMark() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3l7 4v5c0 4.4-2.8 7.7-7 9-4.2-1.3-7-4.6-7-9V7l7-4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M9 11h6M12 8v6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LogIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 4h12v16H6V4Zm3 5h6M9 13h6M9 17h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function KioskIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
      <path
        d="M8 3h8v14H8V3Zm2 18h4m-2-4v4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FormIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
      <path
        d="M7 4h10v16H7V4Zm3 5h4m-4 4h4m-4 4h2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
