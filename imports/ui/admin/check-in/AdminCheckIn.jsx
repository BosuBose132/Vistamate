import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useSubscribe, useFind } from 'meteor/react-meteor-data';

import { Stations } from '/imports/api/stations/stations.collection';
import AdminShell from '/imports/ui/components/AdminShell';
import AdminQuickCheckIn from '/imports/ui/components/AdminQuickCheckIn';
import { Card } from '@mieweb/ui';
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
      <AdminShell title="Check-ins" eyebrow="Visitor operations">
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="skeleton h-44 rounded-2xl" />
          <div className="skeleton h-96 rounded-2xl" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Check-ins" eyebrow="Visitor operations">
      <main className="space-y-6">
        <div className="flex justify-end">
          <span className="vm-pill">
            {stations.length} station{stations.length === 1 ? '' : 's'}{' '}
            available
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]"
        >
          <Card className="vm-card p-5 sm:p-6">
            <h2 className="text-xl font-bold tracking-tight">Assignment</h2>
            <p className="mt-1 text-sm vm-muted">
              Choose where this visitor should be checked in.
            </p>

            <label className="mt-6 block">
              <span className="mb-2 block text-sm font-bold vm-muted">
                Station scope
              </span>

              <select
                className="vm-select"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                {options.map((o) => (
                  <option key={o._id} value={o._id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="vm-panel mt-5 p-4 text-sm">
              Selected visitors will use this station context for admin entry.
            </div>
          </Card>

          <AdminQuickCheckIn
            defaultStationId={selectedId === 'GLOBAL' ? null : selectedId}
          />
        </motion.div>
      </main>
    </AdminShell>
  );
}
