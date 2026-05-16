/* eslint-disable-next-line no-unused-vars, unused-imports/no-unused-imports */
import React from 'react';
import { Meteor } from 'meteor/meteor';

export default function ExistingStations({ stations }) {
    const open = (s) => window.open(`/s/${s.token}`, '_blank');
    const copy = (s) => navigator.clipboard.writeText(`${Meteor.absoluteUrl()}s/${s.token}`);

    return (
        <div className="card bg-base-100 shadow mt-6">
            <div className="card-body">
                <h3 className="card-title">Existing Kiosks</h3>
                <div className="overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr><th>Name</th><th>Location</th><th>Status</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {stations.map(s => (
                                <tr key={s._id}>
                                    <td>{s.name}</td>
                                    <td>{s.location || '—'}</td>
                                    <td>
                                        <span className={`badge ${s.isActive ? 'badge-success' : 'badge-ghost'}`}>
                                            {s.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="flex gap-2">
                                        <button className="btn btn-xs" onClick={() => open(s)}>Open</button>
                                        <button className="btn btn-xs" onClick={() => copy(s)}>Copy URL</button>
                                        <button className="btn btn-xs"
                                            onClick={() => Meteor.call('stations.update', { _id: s._id, updates: { isActive: !s.isActive } })}>
                                            {s.isActive ? 'Disable' : 'Enable'}
                                        </button>
                                        <button className="btn btn-xs"
                                            onClick={() => Meteor.call('stations.rotate', { _id: s._id })}>
                                            Rotate URL
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
