import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useSubscribe, useFind } from 'meteor/react-meteor-data';

import { Stations } from '/imports/api/stations/stations.collection';
import AdminHeader from '/imports/ui/components/AdminHeader';
import AdminQuickCheckIn from '/imports/ui/components/AdminQuickCheckIn';

export default function AdminCheckIn() {
  const subStations = useSubscribe('stations.admin');
  const loading = subStations();

  const stations = useFind(() => Stations.find({}, { sort: { name: 1 } }), []);
  const options = useMemo(
    () => [
      { _id: 'GLOBAL', name: 'Global (no station)' },
      ...stations.map((s) => ({ _id: s._id, name: s.name })),
    ],
    [stations],
  );
  const [selectedId, setSelectedId] = useState('GLOBAL');

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 text-base-content">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <AdminHeader />
          <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            <div className="skeleton h-44 rounded-2xl" />
            <div className="skeleton h-96 rounded-2xl" />
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
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                Check-ins
              </h1>
              <p className="mt-2 text-sm text-base-content/60">
                Register visitors manually and assign them to stations.
              </p>
            </div>

            <div className="rounded-full border border-base-300/80 bg-base-100 px-4 py-2 text-sm font-medium text-base-content/70 shadow-sm">
              {stations.length} station{stations.length === 1 ? '' : 's'}{' '}
              available
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]"
          >
            <section className="rounded-2xl border border-base-300/80 bg-base-100 p-5 shadow-sm shadow-base-content/5">
              <h2 className="text-lg font-semibold">Assignment</h2>
              <p className="mt-1 text-sm text-base-content/55">
                Choose where this visitor should be checked in.
              </p>

              <label className="label mt-5 px-0 pt-0">
                <span className="label-text font-semibold">Station scope</span>
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

              <div className="mt-5 rounded-xl border border-base-300/70 bg-base-200/40 p-4 text-sm text-base-content/65">
                Selected visitors will use this station context for admin
                entry.
              </div>
            </section>

            <AdminQuickCheckIn
              defaultStationId={selectedId === 'GLOBAL' ? null : selectedId}
            />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
