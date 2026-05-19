import React from 'react';
// imports/ui/components/StatCard.jsx

const toneClasses = {
  primary: 'bg-primary/10 text-primary ring-primary/15',
  success: 'bg-success/10 text-success ring-success/15',
  info: 'bg-info/10 text-info ring-info/15',
};

export default function StatCard({ title, value, icon, tone = 'primary' }) {
  return (
    <div className="rounded-2xl border border-base-300/80 bg-base-100 p-5 shadow-sm shadow-base-content/5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-medium text-base-content/60">{title}</h3>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-base-content">
            {value}
          </p>
        </div>

        {icon && (
          <div
            className={`flex h-11 min-w-11 items-center justify-center rounded-xl text-xs font-semibold ring-1 ${
              toneClasses[tone] || toneClasses.primary
            }`}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
