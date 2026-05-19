import React from 'react';
import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useSubscribe, useFind } from 'meteor/react-meteor-data';

import AdminHeader from '../../components/AdminHeader';
import AdminQuickCheckIn from '../../components/AdminQuickCheckIn';
import StatCard from '../../components/StatCard';
import { Stations } from '/imports/api/stations/stations.collection';
import { Visitors } from '/imports/api/collections';

// /imports/ui/admin/dashboard/StationDashboard.jsx

export default function StationDashboard() {
  // 1) Subscriptions:
  //    - stations.admin: for names in the scope dropdown
  //    - visitors.adminToday: ALL today's check-ins (any station + global)

  const subStations = useSubscribe('stations.admin');
  const subToday = useSubscribe('visitors.adminToday', 1000);
  const loading = subStations() || subToday();

  // 2) Data from Minimongo
  const stations = useFind(() => Stations.find({}, { sort: { name: 1 } }), []);
  const visitorsToday = useFind(
    () => Visitors.find({}, { sort: { createdAt: -1 } }),
    [],
  );

  // 3) Scope options: All, Global (no stationId), and each station
  const options = useMemo(
    () => [
      { _id: 'ALL', name: 'All Stations' },
      { _id: 'GLOBAL', name: 'Global (no station)' },
      ...stations.map((s) => ({ _id: s._id, name: s.name })),
    ],
    [stations],
  );

  // 4) Selected scope
  const [selectedId, setSelectedId] = useState('ALL');

  // 5) Filter rows client-side based on scope
  const rows = useMemo(() => {
    if (selectedId === 'ALL') return visitorsToday;
    if (selectedId === 'GLOBAL') {
      return visitorsToday.filter((v) => !v.stationId);
    }
    return visitorsToday.filter((v) => v.stationId === selectedId);
  }, [visitorsToday, selectedId]);

  // 6) KPIs based on filtered rows
  const total = rows.length;
  const inBuilding = rows.filter((v) => v.status !== 'checked_out').length;
  const avg = averageDuration(rows);
  const selectedLabel =
    options.find((o) => o._id === selectedId)?.name || 'All Stations';
  const quickCheckInStationId =
    selectedId === 'ALL' || selectedId === 'GLOBAL' ? null : selectedId;

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 text-base-content">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <AdminHeader />
          <div className="space-y-6">
            <div className="h-24 rounded-2xl border border-base-300/80 bg-base-100 shadow-sm">
              <div className="skeleton h-full w-full rounded-2xl" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="skeleton h-32 rounded-2xl" />
              <div className="skeleton h-32 rounded-2xl" />
              <div className="skeleton h-32 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 text-base-content">
      <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <AdminHeader />

        <main className="space-y-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-medium text-primary">
                Visitor operations
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-base-content">
                Admin Dashboard
              </h1>
              <p className="mt-2 text-sm text-base-content/60">
                Monitor today&apos;s visitor activity.
              </p>
            </div>

            <div className="rounded-full border border-base-300/80 bg-base-100 px-4 py-2 text-sm font-medium text-base-content/70 shadow-sm">
              Live updates • {rows.length} visitor
              {rows.length === 1 ? '' : 's'}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="grid gap-4 md:grid-cols-3"
          >
            <StatCard
              title="Today's Visitors"
              value={total}
              icon="24h"
              tone="primary"
            />
            <StatCard
              title="Currently In Building"
              value={inBuilding}
              icon="In"
              tone="success"
            />
            <StatCard
              title="Avg. Visit Duration"
              value={avg}
              icon="Avg"
              tone="info"
            />
          </motion.div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="overflow-hidden rounded-2xl border border-base-300/80 bg-base-100 shadow-sm shadow-base-content/5"
            >
              <div className="flex flex-col gap-3 border-b border-base-300/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Visitor Log</h2>
                  <p className="text-sm text-base-content/55">
                    {selectedLabel}
                  </p>
                </div>

                <span className="badge badge-outline rounded-md border-base-300 px-3 py-3 font-medium">
                  Today
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="table table-zebra text-base-content">
                  <thead className="bg-base-200/70 text-xs uppercase tracking-wide text-base-content/60">
                    <tr>
                      <th>Visitor</th>
                      <th>Company</th>
                      <th>Purpose</th>
                      <th>Host</th>
                      <th>Station</th>
                      <th>Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((v) => (
                      <tr key={v._id} className="hover">
                        <td className="font-medium">{v.name || '—'}</td>
                        <td>{v.company || '—'}</td>
                        <td>{v.purpose || '—'}</td>
                        <td>{v.host || '—'}</td>
                        <td>
                          {v.stationId
                            ? stations.find((s) => s._id === v.stationId)
                                ?.name || '—'
                            : 'Global'}
                        </td>
                        <td className="whitespace-nowrap">
                          {v.createdAt
                            ? new Date(v.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '—'}
                        </td>
                        <td>
                          {v.status === 'checked_out' ? (
                            <span className="badge badge-ghost rounded-md">
                              Checked Out
                            </span>
                          ) : (
                            <span className="badge badge-success rounded-md">
                              In Building
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {rows.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-12 text-center text-base-content/50"
                        >
                          No check-ins yet for this scope.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.section>

            <aside className="space-y-6">
              <div className="rounded-2xl border border-base-300/80 bg-base-100 p-5 shadow-sm shadow-base-content/5">
                <label className="label px-0 pt-0">
                  <span className="label-text font-semibold">
                    Station filter
                  </span>
                </label>
                <select
                  className="select select-bordered w-full rounded-md border-base-300"
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                >
                  {options.map((o) => (
                    <option key={o._id} value={o._id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>

              <AdminQuickCheckIn defaultStationId={quickCheckInStationId} />
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}

function averageDuration(list) {
  if (!list.length) return '0m';
  const sum = list.reduce((acc, v) => {
    const start = v.createdAt ? new Date(v.createdAt).getTime() : Date.now();
    const end = v.checkoutAt ? new Date(v.checkoutAt).getTime() : Date.now();
    return acc + Math.max(0, end - start);
  }, 0);
  const mins = Math.round(sum / list.length / 60000);
  const h = Math.floor(mins / 60),
    m = mins % 60;
  return h ? `${h}h ${m}m` : `${mins}m`;
}
