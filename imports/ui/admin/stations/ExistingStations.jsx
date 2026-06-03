import React from 'react';
import { Meteor } from 'meteor/meteor';

export default function ExistingStations({ stations, surveys = [] }) {
  const open = (s) => window.open(`/s/${s.token}`, '_blank');
  const copy = (s) =>
    navigator.clipboard.writeText(`${Meteor.absoluteUrl()}s/${s.token}`);
  const surveyName = (surveyId) =>
    surveys.find((survey) => survey._id === surveyId)?.name || 'Unassigned';

  return (
    <section className="vm-card overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-[var(--vm-border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold vm-heading">
            Existing stations
          </h3>
          <p className="mt-1 text-sm vm-muted">
            Manage kiosk links, availability, and survey assignment.
          </p>
        </div>
        <span className="vm-badge">{stations.length} total</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="border-b border-[var(--vm-border)] bg-[var(--vm-surface-soft)] text-xs font-bold uppercase tracking-wide vm-muted">
            <tr>
              <th className="px-5 py-4">Name</th>
              <th className="px-4 py-4">Location</th>
              <th className="px-4 py-4">Status</th>
              <th className="px-4 py-4">Assigned Survey</th>
              <th className="px-4 py-4">Kiosk URL</th>
              <th className="px-4 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--vm-border)]">
            {stations.map((s) => (
              <tr key={s._id} className="vm-table-row">
                <td className="px-5 py-4 font-medium vm-heading">{s.name}</td>
                <td className="px-4 py-4 vm-muted">{s.location || '—'}</td>
                <td className="px-4 py-4">
                  {s.isActive ? (
                    <span className="vm-status-active inline-flex h-7 items-center gap-2 px-3 rounded-full text-xs font-semibold">
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-current"
                        aria-hidden="true"
                      />
                      Active
                    </span>
                  ) : (
                    <span className="vm-status-neutral inline-flex h-7 items-center px-3 rounded-full text-xs font-semibold">
                      Inactive
                    </span>
                  )}
                </td>
                <td className="px-4 py-4 vm-muted">{surveyName(s.surveyId)}</td>
                <td className="px-4 py-4">
                  <code className="rounded-md bg-[var(--vm-surface-soft)] px-2 py-1 text-xs vm-muted">
                    /s/{s.token}
                  </code>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="vm-btn-secondary rounded-md px-3 py-1.5 text-xs font-semibold"
                      onClick={() => open(s)}
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      className="vm-btn-secondary rounded-md px-3 py-1.5 text-xs font-semibold"
                      onClick={() => copy(s)}
                    >
                      Copy URL
                    </button>
                    <button
                      type="button"
                      className="text-xs font-semibold px-3 py-1.5 rounded-md bg-[var(--vm-surface-soft)] text-[var(--vm-text)] border border-[var(--vm-border)]"
                      onClick={() =>
                        Meteor.call('stations.update', {
                          _id: s._id,
                          updates: { isActive: !s.isActive },
                        })
                      }
                    >
                      {s.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      type="button"
                      className="text-xs font-semibold px-3 py-1.5 rounded-md bg-[var(--vm-surface-soft)] text-[var(--vm-text)] border border-[var(--vm-border)]"
                      onClick={() =>
                        Meteor.call('stations.rotate', { _id: s._id })
                      }
                    >
                      Rotate URL
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {stations.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center vm-muted">
                  No stations created yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
