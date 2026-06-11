import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { NavLink, useNavigate } from 'react-router-dom';
import { Button } from '@mieweb/ui';
import { Menu } from 'lucide-react';

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
      ? 'bg-[var(--vm-sidebar-soft)] text-[var(--vm-primary)]'
      : 'text-neutral-300 hover:bg-white/10 hover:text-white',
  ].join(' ');

export default function AdminShell({
  title = 'Dashboard',
  eyebrow = 'Vistamate',
  children,
}) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const onLogout = () => {
    Meteor.logout(() => navigate('/'));
  };

  return (
    <div className="min-h-screen vm-app">
      <div className="flex min-h-screen w-full overflow-hidden">
        <aside className="vm-sidebar hidden w-72 shrink-0 lg:flex lg:flex-col">
          <div className="flex h-24 items-center px-7">
            <img
              src="/VistaMate.png"
              alt="Vistamate"
              className="max-h-45 w-auto object-contain"
            />
          </div>

          <div className="vm-sidebar-card mx-5 rounded-xl p-3">
            <p className="text-xs uppercase tracking-wide text-neutral-400">
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
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="vm-topbar flex h-20 items-center justify-between gap-4 border-b px-4 sm:px-6 lg:px-8">
            <div className="vm-content flex min-w-0 flex-1 flex-col">
              <div className="relative lg:hidden">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-xl"
                  aria-label="Open navigation"
                  aria-expanded={mobileMenuOpen}
                  onClick={() => setMobileMenuOpen((o) => !o)}
                >
                  <Menu className="h-5 w-5" />
                </Button>

                {mobileMenuOpen && (
                  <ul className="absolute left-0 top-full z-50 mt-2 w-56 rounded-2xl border border-border bg-card p-2 shadow-xl">
                    {navItems.map((item) => (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          end={item.end}
                          className="block rounded-xl px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {item.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
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
                className="rounded-xl text-sm font-semibold"
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
