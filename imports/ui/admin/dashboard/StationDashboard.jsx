import React from 'react';
import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useSubscribe, useFind } from 'meteor/react-meteor-data';

import AdminHeader from '../../components/AdminHeader';
import { Button, Card, Input } from '@mieweb/ui';

import AdminQuickCheckIn from '../../components/AdminQuickCheckIn';
import AdminShell from '../../components/AdminShell';
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
  const [search, setSearch] = useState('');

  // 5) Filter rows client-side based on scope
  const rows = useMemo(() => {
    let scopedRows = visitorsToday;

    if (selectedId === 'GLOBAL') {
      scopedRows = visitorsToday.filter((v) => !v.stationId);
    } else if (selectedId !== 'ALL') {
      scopedRows = visitorsToday.filter((v) => v.stationId === selectedId);
    }

    const q = search.trim().toLowerCase();
    if (!q) return scopedRows;

    return scopedRows.filter((v) =>
      [v.name, v.company, v.purpose, v.host, v.email, v.phone]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q)),
    );
  }, [visitorsToday, selectedId, search]);

  const total = rows.length;
  const inBuilding = rows.filter((v) => v.status !== 'checked_out').length;
  const checkedOut = rows.filter((v) => v.status === 'checked_out').length;
  const avg = averageDuration(rows);

  const selectedLabel =
    options.find((o) => o._id === selectedId)?.name || 'All Stations';

  const quickCheckInStationId =
    selectedId === 'ALL' || selectedId === 'GLOBAL' ? null : selectedId;

  if (loading) {
    return (
      <AdminShell title="Dashboard" eyebrow="Visitor operations">
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="skeleton h-24 rounded-2xl" />
            <div className="skeleton h-24 rounded-2xl" />
            <div className="skeleton h-24 rounded-2xl" />
            <div className="skeleton h-24 rounded-2xl" />
          </div>
          <div className="skeleton h-[520px] rounded-3xl" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Dashboard" eyebrow="Visitor operations">
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: 'easeOut' }}
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        >
          <StatCard title="Total Stations" value={stations.length} icon="KS" />
          <StatCard title="Total Visitors" value={total} icon="TV" />
          <StatCard
            title="Active Visitors"
            value={inBuilding}
            icon="AV"
            tone="success"
          />
          <StatCard
            title="Checked Out"
            value={checkedOut}
            icon="CO"
            tone="info"
          />
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
        >
          <Card className="overflow-hidden rounded-3xl border border-[#d9eceb] bg-white shadow-xl shadow-teal-950/5">
            <div className="flex flex-col gap-4 border-b border-[#d9eceb] px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold tracking-tight text-[#17323b]">
                    Visitor Log
                  </h2>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#b9dbda] text-xs font-bold text-[#23b6b6]">
                    ?
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium text-[#6c7f86]">
                  {selectedLabel} • Today
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6c7f86]">
                    <SearchIcon />
                  </span>
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search visitor..."
                    className="h-11 w-full rounded-2xl border-[#d9eceb] bg-[#f5fbfb] pl-10 text-sm sm:w-72"
                  />
                </div>

                <Button className="h-11 rounded-xl bg-[#23b6b6] px-5 text-sm font-semibold text-white hover:bg-[#159b9a]">
                  Add Visitor
                </Button>

                <Button
                  variant="outline"
                  className="h-11 rounded-xl border-[#b9dbda] bg-white px-5 text-sm font-semibold text-[#0f766e] hover:bg-[#e9f7f6]"
                >
                  Export
                </Button>
              </div>
            </div>

            <div className="border-b border-[#d9eceb] bg-[#f9fdfd] px-5 py-4">
              <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-center">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-[#6c7f86]">
                    Station filter
                  </label>
                  <select
                    className="mt-2 h-11 w-full rounded-xl border border-[#d9eceb] bg-white px-3 text-sm font-semibold text-[#17323b] outline-none focus:border-[#23b6b6] focus:ring-2 focus:ring-[#23b6b6]/20"
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

                <div className="grid gap-3 sm:grid-cols-3">
                  <MiniMetric label="Avg. duration" value={avg} />
                  <MiniMetric label="In building" value={inBuilding} />
                  <MiniMetric label="Visible rows" value={rows.length} />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#d9eceb] bg-white text-xs font-bold uppercase tracking-wide text-[#6c7f86]">
                    <th className="w-10 px-5 py-4">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm rounded border-[#b9dbda]"
                        aria-label="Select all visitors"
                      />
                    </th>
                    <th className="px-4 py-4">Name</th>
                    <th className="px-4 py-4">Purpose</th>
                    <th className="px-4 py-4">Company</th>
                    <th className="px-4 py-4">Host</th>
                    <th className="px-4 py-4">Station</th>
                    <th className="px-4 py-4">Check In</th>
                    <th className="px-4 py-4">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#eef4f4]">
                  {rows.map((v) => {
                    const stationName = v.stationId
                      ? stations.find((s) => s._id === v.stationId)?.name || '—'
                      : 'Global';

                    return (
                      <tr
                        key={v._id}
                        className="bg-white transition-colors hover:bg-[#f5fbfb]"
                      >
                        <td className="px-5 py-4">
                          <input
                            type="checkbox"
                            className="checkbox checkbox-sm rounded border-[#b9dbda]"
                            aria-label={`Select ${v.name || 'visitor'}`}
                          />
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e9f7f6] text-xs font-bold text-[#0f766e]">
                              {getInitials(v.name)}
                            </div>
                            <div>
                              <p className="font-bold text-[#17323b]">
                                {v.name || '—'}
                              </p>
                              <p className="text-xs text-[#6c7f86]">
                                {v.email || v.phone || 'Visitor'}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 font-medium text-[#17323b]">
                          {v.purpose || '—'}
                        </td>
                        <td className="px-4 py-4 text-[#40555c]">
                          {v.company || '—'}
                        </td>
                        <td className="px-4 py-4 text-[#40555c]">
                          {v.host || '—'}
                        </td>
                        <td className="px-4 py-4 text-[#40555c]">
                          {stationName}
                        </td>
                        <td className="px-4 py-4 font-semibold text-[#17323b]">
                          {v.createdAt
                            ? new Date(v.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '—'}
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge status={v.status} />
                        </td>
                      </tr>
                    );
                  })}

                  {rows.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-5 py-16 text-center text-[#6c7f86]"
                      >
                        <div className="mx-auto max-w-sm">
                          <p className="text-base font-bold text-[#17323b]">
                            No visitors found
                          </p>
                          <p className="mt-2 text-sm">
                            Try changing the station filter or search keyword.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-[#d9eceb] px-5 py-4 text-sm font-semibold text-[#6c7f86] sm:flex-row sm:items-center sm:justify-between">
              <p>
                Showing {rows.length} visitor{rows.length === 1 ? '' : 's'}
              </p>
              <p>Live updates enabled</p>
            </div>
          </Card>
        </motion.section>

        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <Card className="rounded-3xl border border-[#d9eceb] bg-white p-5 shadow-sm">
            <h3 className="text-lg font-bold text-[#17323b]">Quick Check-In</h3>
            <p className="mt-1 text-sm text-[#6c7f86]">
              Use the selected station context for manual visitor entry.
            </p>
            <div className="mt-4 rounded-2xl bg-[#e9f7f6] p-4 text-sm font-semibold text-[#0f766e]">
              Current station: {selectedLabel}
            </div>
          </Card>

          <AdminQuickCheckIn defaultStationId={quickCheckInStationId} />
        </div>
      </div>
    </AdminShell>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#d9eceb] bg-white px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-wide text-[#6c7f86]">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold text-[#17323b]">{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  if (status === 'checked_out') {
    return (
      <span className="inline-flex h-7 items-center rounded-full border border-[#d9eceb] bg-[#f3f7f7] px-3 text-xs font-bold text-[#6c7f86]">
        Checked Out
      </span>
    );
  }

  return (
    <span className="inline-flex h-7 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-600">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      In Building
    </span>
  );
}

function SearchIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
      <path
        d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'V';
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function averageDuration(list) {
  if (!list.length) return '0m';
  const sum = list.reduce((acc, v) => {
    const start = v.createdAt ? new Date(v.createdAt).getTime() : Date.now();
    const end = v.checkoutAt ? new Date(v.checkoutAt).getTime() : Date.now();
    return acc + Math.max(0, end - start);
  }, 0);
  const mins = Math.round(sum / list.length / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h ${m}m` : `${mins}m`;
}
