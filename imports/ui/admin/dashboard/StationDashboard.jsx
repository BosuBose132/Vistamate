import React, { useMemo, useState } from 'react';
import { useSubscribe, useFind } from 'meteor/react-meteor-data';
import { Stations } from '/imports/api/stations/stations.collection';
import { Visitors } from '/imports/api/collections';

export default function StationDashboard() {
    const subStations = useSubscribe('stations.admin')();
    const stations = useFind(() => Stations.find({}, { sort: { name: 1 } }), []);
    const [stationId, setStationId] = useState('');
    const subVisitors = useSubscribe('visitors.byStation', stationId || null, 100)();
    const visitors = useFind(
        () => stationId ? Visitors.find({ stationId }, { sort: { createdAt: -1 }, limit: 100 }) : [],
        [stationId]
    );

    const todayCount = useMemo(() => visitors.filter(v => {
        const d = v.createdAt && new Date(v.createdAt);
        const now = new Date();
        return d && d.toDateString() === now.toDateString();
    }).length, [visitors]);

    const inBuilding = useMemo(() => visitors.filter(v => v.status !== 'checked_out').length, [visitors]);
    const avgDuration = '2.5h'; // placeholder

    if (subStations) return <div className="p-8">Loading…</div>;

    return (
        <div className="min-h-screen bg-base-200 p-6">
            <div className="navbar bg-base-100 shadow mb-6">
                <div className="flex-1"><a href="/admin" className="btn btn-ghost text-xl">Vistamate Admin</a></div>
                <div className="flex-none gap-2">
                    <a className="btn btn-sm" href="/admin/stations">Stations</a>
                    <a className="btn btn-sm" href="/admin/surveys">Surveys</a>
                </div>
            </div>

            <div className="card bg-base-100 shadow mb-6">
                <div className="card-body">
                    <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
                        <h2 className="card-title">Visitor Check-in</h2>
                        <div className="flex gap-3 items-center">
                            <select className="select select-bordered" value={stationId} onChange={e => setStationId(e.target.value)}>
                                <option value="">Select station…</option>
                                {stations.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                            </select>
                            {stationId && (
                                <a className="btn" href={`/s/${Stations.findOne(stationId)?.token}`} target="_blank" rel="noreferrer">Open Kiosk</a>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <StatCard label="Today's Visitors" value={todayCount} />
                <StatCard label="Currently In Building" value={inBuilding} />
                <StatCard label="Avg. Visit Duration" value={avgDuration} />
            </div>

            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Today's Visitors</h3>
                        <input className="input input-bordered input-sm w-60" placeholder="Search visitors…" onChange={() => { }} />
                    </div>
                    <div className="overflow-x-auto mt-4">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Visitor</th><th>Company</th><th>Purpose</th><th>Host</th><th>Check-in Time</th><th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stationId ? visitors.map(v => (
                                    <tr key={v._id}>
                                        <td>{v.name}</td>
                                        <td>{v.company}</td>
                                        <td>{v.purpose || '—'}</td>
                                        <td>{v.host || '—'}</td>
                                        <td>{v.createdAt ? new Date(v.createdAt).toLocaleTimeString() : '—'}</td>
                                        <td><span className={`badge ${v.status === 'checked_out' ? 'badge-ghost' : 'badge-success'}`}>
                                            {v.status === 'checked_out' ? 'Checked Out' : 'In Building'}
                                        </span></td>
                                    </tr>
                                )) : <tr><td colSpan={6} className="opacity-70">Select a station to view check-ins.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <footer className="text-center text-sm opacity-70 mt-6">
                Secure Visitor Management System • {new Date().toLocaleTimeString()}
            </footer>
        </div>
    );
}

function StatCard({ label, value }) {
    return (
        <div className="card bg-base-100 shadow">
            <div className="card-body">
                <div className="text-sm opacity-70">{label}</div>
                <div className="text-3xl font-bold">{value}</div>
            </div>
        </div>
    );
}
