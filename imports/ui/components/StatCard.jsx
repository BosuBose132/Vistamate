import React from 'react';
import { Card } from '@mieweb/ui';

// imports/ui/components/StatCard.jsx

const toneClasses = {
  primary: 'bg-[#e9f7f6] text-[#23b6b6]',
  success: 'bg-emerald-50 text-emerald-600',
  info: 'bg-sky-50 text-sky-600',
  warning: 'bg-amber-50 text-amber-600',
};

export default function StatCard({ title, value, icon, tone = 'primary' }) {
  return (
    <Card className="rounded-2xl border border-[#d9eceb] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
            toneClasses[tone] || toneClasses.primary
          }`}
        >
          <span className="text-sm font-bold">{icon}</span>
        </div>

        <div className="min-w-0">
          <p className="text-2xl font-bold tracking-tight text-[#17323b]">
            {value}
          </p>
          <p className="mt-1 truncate text-sm font-medium text-[#6c7f86]">
            {title}
          </p>
        </div>
      </div>
    </Card>
  );
}
