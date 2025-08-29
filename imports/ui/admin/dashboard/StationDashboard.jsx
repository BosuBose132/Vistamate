import React, { useMemo, useState } from 'react';
import { useSubscribe, useFind } from 'meteor/react-meteor-data';
import { Stations } from '/imports/api/stations/stations.collection';
import { Visitors } from '/imports/api/collections';
import AdminQuickCheckIn from '/imports/ui/components/AdminQuickCheckIn';
import { NavLink, useNavigate } from 'react-router-dom';
import { Meteor } from 'meteor/meteor';


// /imports/ui/admin/dashboard/StationDashboard.jsx
//import { Link } from 'react-router-dom';
import ThemeToggle from '/imports/ui/components/ThemeToggle';

export default function StationDashboard() {
    // 1) Subscriptions:
    //    - stations.admin: for names in the scope dropdown
    //    - visitors.adminToday: ALL today's check-ins (any station + global)
    const navigate = useNavigate();
    const onLogout = () => {
        Meteor.logout(() => navigate('/login'));
    };
    const subStations = useSubscribe('stations.admin');
    const subToday = useSubscribe('visitors.adminToday', 1000);
    const loading = subStations() || subToday();

    // 2) Data from Minimongo
    const stations = useFind(() => Stations.find({}, { sort: { name: 1 } }), []);
    const visitorsToday = useFind(
        () => Visitors.find({}, { sort: { createdAt: -1 } }),
        []
    );

    // 3) Scope options: All, Global (no stationId), and each station
    const options = useMemo(() => ([
        { _id: 'ALL', name: 'All Stations' },
        { _id: 'GLOBAL', name: 'Global (no station)' },
        ...stations.map(s => ({ _id: s._id, name: s.name })),
    ]), [stations]);

    // 4) Selected scope
    const [selectedId, setSelectedId] = useState('ALL');

    // 5) Filter rows client-side based on scope
    const rows = useMemo(() => {
        if (selectedId === 'ALL') return visitorsToday;
        if (selectedId === 'GLOBAL') {
            return visitorsToday.filter(v => !v.stationId);
        }
        return visitorsToday.filter(v => v.stationId === selectedId);
    }, [visitorsToday, selectedId]);

    // 6) KPIs based on filtered rows
    const total = rows.length;
    const inBuilding = rows.filter(v => v.status !== 'checked_out').length;
    const avg = averageDuration(rows);

    if (loading) return <div className="p-8">Loading…</div>;

    return (
        <div className="min-h-screen bg-base-200 p-6">
            {/* Navbar */}
            <div className="navbar bg-base-100 shadow mb-6 rounded-xl">
                <div className="flex-1">
                    <a href="/admin" className="btn btn-ghost text-xl">Vistamate Admin</a>
                </div>
                <div className="flex-none gap-2 items-center">
                    <NavLink className="btn btn-sm" to="/admin/stations">Stations</NavLink>
                    <NavLink className="btn btn-sm" to="/admin/surveys">Surveys</NavLink>
                    <NavLink className="btn btn-sm btn-primary" to="/admin/checkins">Check-ins</NavLink>
                    <ThemeToggle />
                    <button className="btn btn-sm btn-outline" onClick={onLogout}>Logout</button>
                </div>
            </div>
            {/* Scope selector */}
            <div className="mb-4 flex flex-col md:flex-row gap-3 md:items-end">
                <div className="grow max-w-md">
                    <label className="label"><span className="label-text">Scope</span></label>
                    <select
                        className="select select-bordered w-full"
                        value={selectedId}
                        onChange={e => setSelectedId(e.target.value)}
                    >
                        {options.map(o => <option key={o._id} value={o._id}>{o.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Quick admin check-in (SurveyJS) */}
            <AdminQuickCheckIn
                // When scope is "All" or "Global", we pass null → saves as Global.
                // When a specific station is selected, we pass its _id.
                defaultStationId={
                    selectedId === 'ALL' || selectedId === 'GLOBAL' ? null : selectedId
                }
            />

            {/* KPI cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <StatCard label="Today's Visitors" value={total} icon="👥" />
                <StatCard label="Currently In Building" value={inBuilding} icon="🏢" />
                <StatCard label="Avg. Visit Duration" value={avg} icon="⏱️" />
            </div>

            {/* Today's visitors table */}
            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <h3 className="card-title">
                        Today’s Visitors {selectedId !== 'ALL' ? `• ${options.find(o => o._id === selectedId)?.name}` : ''}
                    </h3>

                    <div className="overflow-x-auto mt-3">
                        <table className="table">
                            <thead>
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
                                {rows.map(v => (
                                    <tr key={v._id}>
                                        <td className="font-medium">{v.name || '—'}</td>
                                        <td>{v.company || '—'}</td>
                                        <td>{v.purpose || '—'}</td>
                                        <td>{v.host || '—'}</td>
                                        <td>{
                                            v.stationId
                                                ? (stations.find(s => s._id === v.stationId)?.name || '—')
                                                : 'Global'
                                        }</td>
                                        <td className="whitespace-nowrap">
                                            {v.createdAt
                                                ? new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                : '—'}
                                        </td>
                                        <td>
                                            {v.status === 'checked_out'
                                                ? <span className="badge">Checked Out</span>
                                                : <span className="badge badge-success">In Building</span>}
                                        </td>
                                    </tr>
                                ))}
                                {rows.length === 0 && (
                                    <tr><td colSpan={7} className="opacity-60">No check-ins yet for this scope.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4 text-xs opacity-70">
                        Live updates • Showing {rows.length} visitor{rows.length === 1 ? '' : 's'}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon }) {
    return (
        <div className="card bg-base-100 shadow">
            <div className="card-body">
                <div className="flex items-center justify-between">
                    <div className="text-sm opacity-70">{label}</div>
                    <div className="text-xl">{icon}</div>
                </div>
                <div className="text-3xl font-bold mt-1">{value}</div>
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
    const h = Math.floor(mins / 60), m = mins % 60;
    return h ? `${h}h ${m}m` : `${mins}m`;
}
