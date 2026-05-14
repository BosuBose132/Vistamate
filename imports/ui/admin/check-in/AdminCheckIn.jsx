// /imports/ui/admin/checkins/AdminCheckIn.jsx
import { useMemo, useState } from 'react';
import { useSubscribe, useFind } from 'meteor/react-meteor-data';
import { Stations } from '/imports/api/stations/stations.collection';

export default function AdminCheckIn() {
    const subStations = useSubscribe('stations.admin');
    const loading = subStations();

    const stations = useFind(() => Stations.find({}, { sort: { name: 1 } }), []);
    const options = useMemo(() => ([
        { _id: 'GLOBAL', name: 'Global (no station)' },
        ...stations.map(s => ({ _id: s._id, name: s.name })),
    ]), [stations]);
    const [selectedId, setSelectedId] = useState('GLOBAL');

    if (loading) return <div className="p-8">Loading…</div>;

    return (
        <div className="min-h-screen bg-base-200 text-base-content p-6">
            <AdminHeader />

            {/* Scope selector */}
            <div className="mb-4 max-w-md">
                <label className="label"><span className="label-text">Scope</span></label>
                <select
                    className="select select-bordered w-full"
                    value={selectedId}
                    onChange={e => setSelectedId(e.target.value)}
                >
                    {options.map(o => <option key={o._id} value={o._id}>{o.name}</option>)}
                </select>
            </div>

            {/* Manual check-in form */}
            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <h2 className="card-title">New Visitor Check-in</h2>
                    <AdminQuickCheckIn
                        defaultStationId={selectedId === 'GLOBAL' ? null : selectedId}
                    />
                </div>
            </div>
        </div>
    );
}
