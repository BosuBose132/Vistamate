import React from 'react';
import { Meteor } from 'meteor/meteor';

export default function ExistingStations({ stations, surveys = [] }) {
  const open = (s) => window.open(`/s/${s.token}`, '_blank');
  const copy = (s) =>
    navigator.clipboard.writeText(`${Meteor.absoluteUrl()}s/${s.token}`);
  const surveyName = (surveyId) =>
    surveys.find((survey) => survey._id === surveyId)?.name || 'Unassigned';

  return (
    <section className="overflow-hidden rounded-2xl border border-base-300/80 bg-base-100 shadow-sm shadow-base-content/5">
      <div className="flex flex-col gap-3 border-b border-base-300/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Existing stations</h3>
          <p className="mt-1 text-sm text-base-content/55">
            Manage kiosk links, availability, and survey assignment.
          </p>
        </div>
        <span className="badge badge-outline rounded-md border-base-300 px-3 py-3 font-medium">
          {stations.length} total
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="table table-zebra text-base-content">
          <thead className="bg-base-200/70 text-xs uppercase tracking-wide text-base-content/60">
            <tr>
              <th>Name</th>
              <th>Location</th>
              <th>Status</th>
              <th>Assigned Survey</th>
              <th>Kiosk URL</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {stations.map((s) => (
              <tr key={s._id} className="hover">
                <td className="font-medium">{s.name}</td>
                <td>{s.location || '—'}</td>
                <td className="align-middle">
                  {s.isActive ? (
                    <span className="inline-flex h-7 items-center gap-2 rounded-full border border-success/20 bg-success/10 px-3 text-xs font-semibold leading-none text-success">
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-success"
                        aria-hidden="true"
                      />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex h-7 items-center rounded-full border border-base-300 bg-base-200/70 px-3 text-xs font-medium leading-none text-base-content/65">
                      Inactive
                    </span>
                  )}
                </td>
                <td>{surveyName(s.surveyId)}</td>
                <td>
                  <code className="rounded-md bg-base-200 px-2 py-1 text-xs text-base-content/70">
                    /s/{s.token}
                  </code>
                </td>
                <td>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn btn-outline btn-xs rounded-md border-base-300"
                      onClick={() => open(s)}
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-xs rounded-md border-base-300"
                      onClick={() => copy(s)}
                    >
                      Copy URL
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs rounded-md"
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
                      className="btn btn-ghost btn-xs rounded-md"
                      onClick={() => Meteor.call('stations.rotate', { _id: s._id })}
                    >
                      Rotate URL
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {stations.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-base-content/50">
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
