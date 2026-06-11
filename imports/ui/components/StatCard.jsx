import React from 'react';
import { Card } from '@mieweb/ui';

const toneClasses = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  info: 'bg-info/10 text-info',
  warning: 'bg-warning/10 text-warning',
};

export default function StatCard({ title, value, icon, tone = 'primary' }) {
  return (
    <Card className="vm-card p-5 transition-all duration-200 hover:-translate-y-0.5">
      <div className="flex items-center gap-4">
        {icon && (
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
              toneClasses[tone] || toneClasses.primary
            }`}
          >
            <span className="text-sm font-bold">{icon}</span>
          </div>
        )}
        <div className="min-w-0">
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {value}
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-muted-foreground">
            {title}
          </p>
        </div>
      </div>
    </Card>
  );
}
