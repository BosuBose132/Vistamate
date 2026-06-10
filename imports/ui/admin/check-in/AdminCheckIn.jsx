import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useSubscribe, useFind } from 'meteor/react-meteor-data';

import { Stations } from '/imports/api/stations/stations.collection';
import AdminShell from '/imports/ui/components/AdminShell';
import AdminQuickCheckIn from '/imports/ui/components/AdminQuickCheckIn';
import { Card, Skeleton, Badge, Select } from '@mieweb/ui';

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
          <Skeleton className="h-44 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Check-ins" eyebrow="Visitor operations">
      <main className="space-y-6">
        <div className="flex justify-end">
          <Badge>
            {stations.length} station{stations.length === 1 ? '' : 's'}{' '}
            available
          </Badge>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]"
        >
          <Card className="vm-card p-5 sm:p-6">
            <h2 className="text-xl font-bold tracking-tight">Assignment</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose where this visitor should be checked in.
            </p>

            <label className="mt-6 block">
              <span className="mb-2 block text-sm font-bold text-muted-foreground">
                Station scope
              </span>
              <Select
                value={selectedId}
                onValueChange={(value) => setSelectedId(value)}
                options={options.map((o) => ({ value: o._id, label: o.name }))}
                className="w-full"
              />
            </label>

            <div className="mt-5 rounded-xl border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
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
