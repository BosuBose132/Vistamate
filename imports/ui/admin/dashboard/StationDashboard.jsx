import React from 'react';
import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useSubscribe, useFind } from 'meteor/react-meteor-data';

import {
  Button,
  Card,
  Input,
  Skeleton,
  Badge,
  Select,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  Checkbox,
  Avatar,
} from '@mieweb/ui';

import AdminQuickCheckIn from '../../components/AdminQuickCheckIn';
import AdminShell from '../../components/AdminShell';
import StatCard from '../../components/StatCard';
import { Stations } from '/imports/api/stations/stations.collection';
import { Visitors } from '/imports/api/collections';
import { Monitor, Users, UserCheck, LogOut, Search } from 'lucide-react';

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
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
          <Skeleton className="h-[520px] rounded-3xl" />
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
          <StatCard
            title="Total Stations"
            value={stations.length}
            icon={<Monitor className="h-5 w-5" strokeWidth={2} />}
          />

          <StatCard
            title="Total Visitors"
            value={total}
            icon={<Users className="h-5 w-5" strokeWidth={2} />}
          />

          <StatCard
            title="Active Visitors"
            value={inBuilding}
            icon={<UserCheck className="h-5 w-5" strokeWidth={2} />}
            tone="success"
          />

          <StatCard
            title="Checked Out"
            value={checkedOut}
            icon={<LogOut className="h-5 w-5" strokeWidth={2} />}
            tone="info"
          />
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
        >
          <Card className="vm-card overflow-hidden">
            <div className="flex flex-col gap-4 border-b border-border px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    Visitor Log
                  </h2>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-xs font-bold text-primary">
                    ?
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium text-muted-foreground">
                  {selectedLabel} • Today
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Search className="h-4 w-4" />
                  </span>
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search visitor..."
                    className="h-11 w-full pl-10 text-sm sm:w-72"
                  />
                </div>

                <Button variant="primary" className="h-11 px-5 text-sm">
                  Add Visitor
                </Button>

                <Button variant="outline" className="h-11 px-5 text-sm">
                  Export
                </Button>
              </div>
            </div>

            <div className="border-b border-border bg-muted px-5 py-4">
              <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-center">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Station filter
                  </label>
                  <Select
                    value={selectedId}
                    onValueChange={(value) => setSelectedId(value)}
                    options={options.map((o) => ({ value: o._id, label: o.name }))}
                    className="mt-2 w-full"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <MiniMetric label="Avg. duration" value={avg} />
                  <MiniMetric label="In building" value={inBuilding} />
                  <MiniMetric label="Visible rows" value={rows.length} />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table className="w-full min-w-[980px] text-left text-sm">
                <TableHeader>
                  <TableRow className="border-b border-border bg-card text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    <TableCell className="w-10 px-5 py-4">
                      <Checkbox aria-label="Select all visitors" />
                    </TableCell>
                    <TableCell className="px-4 py-4">Name</TableCell>
                    <TableCell className="px-4 py-4">Purpose</TableCell>
                    <TableCell className="px-4 py-4">Company</TableCell>
                    <TableCell className="px-4 py-4">Host</TableCell>
                    <TableCell className="px-4 py-4">Station</TableCell>
                    <TableCell className="px-4 py-4">Check In</TableCell>
                    <TableCell className="px-4 py-4">Status</TableCell>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-border">
                  {rows.map((v) => {
                    const stationName = v.stationId
                      ? stations.find((s) => s._id === v.stationId)?.name || '—'
                      : 'Global';

                    return (
                      <TableRow
                        key={v._id}
                        className="vm-table-row transition-colors"
                      >
                        <TableCell className="px-5 py-4">
                          <Checkbox
                            aria-label={`Select ${v.name || 'visitor'}`}
                          />
                        </TableCell>

                        <TableCell className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar
                              name={v.name || 'Visitor'}
                              className="h-9 w-9 shrink-0"
                            />
                            <div>
                              <p className="font-bold text-foreground">
                                {v.name || '—'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {v.email || v.phone || 'Visitor'}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="px-4 py-4 font-medium text-muted-foreground">
                          {v.purpose || '—'}
                        </TableCell>
                        <TableCell className="px-4 py-4 text-muted-foreground">
                          {v.company || '—'}
                        </TableCell>
                        <TableCell className="px-4 py-4 text-muted-foreground">
                          {v.host || '—'}
                        </TableCell>
                        <TableCell className="px-4 py-4 text-muted-foreground">
                          {stationName}
                        </TableCell>
                        <TableCell className="px-4 py-4 font-semibold text-foreground">
                          {v.createdAt
                            ? new Date(v.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '—'}
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <StatusBadge status={v.status} />
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="px-5 py-16 text-center text-muted-foreground"
                      >
                        <div className="mx-auto max-w-sm">
                          <p className="text-base font-bold text-foreground">
                            No visitors found
                          </p>
                          <p className="mt-2 text-sm">
                            Try changing the station filter or search keyword.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col gap-3 border-t border-border px-5 py-4 text-sm font-semibold text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <p>
                Showing {rows.length} visitor{rows.length === 1 ? '' : 's'}
              </p>
              <p>Live updates enabled</p>
            </div>
          </Card>
        </motion.section>

        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <Card className="vm-card p-5">
            <h3 className="text-lg font-bold text-foreground">
              Quick Check-In
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Use the selected station context for manual visitor entry.
            </p>

            <div className="vm-panel mt-4 p-4 text-sm font-semibold text-primary">
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
    <div className="vm-panel px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold text-foreground">{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  if (status === 'checked_out') {
    return <Badge variant="secondary">Checked Out</Badge>;
  }

  return (
    <Badge variant="success">
      <span className="me-1 inline-block h-1.5 w-1.5 rounded-full bg-current" />
      In Building
    </Badge>
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
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h ${m}m` : `${mins}m`;
}
