import React from 'react';
import { Card } from '@mieweb/ui';

const toneClasses = {
  primary: 'bg-[var(--vm-primary-soft)] text-[var(--vm-primary)]',
  success: 'bg-[var(--vm-success-soft)] text-[var(--vm-success)]',
  info: 'bg-[color-mix(in_oklab,var(--vm-primary),transparent_88%)] text-[var(--vm-primary)]',
  warning: 'bg-amber-500/10 text-amber-500',
};

export default function StatCard({ title, value, icon, tone = 'primary' }) {
  return (
    <Card className="vm-card p-5 transition-all duration-200 hover:-translate-y-0.5">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
            toneClasses[tone] || toneClasses.primary
          }`}
        >
          <span className="text-sm font-bold">{icon}</span>
        </div>

        <div className="min-w-0">
          <p className="text-2xl font-bold tracking-tight text-[var(--vm-heading)]">
            {value}
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-[var(--vm-muted)]">
            {title}
          </p>
        </div>
      </div>
    </Card>
  );
}
