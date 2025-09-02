import React, { useState } from 'react';
import { useSubscribe, useFind } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Surveys } from '/imports/api/surveys/surveys.collection';
import { Stations } from '/imports/api/stations/stations.collection';
import AdminHeader from '/imports/ui/components/AdminHeader';

export default function StationBuilder() {
    const loadingSurveys = useSubscribe('surveys.admin');
    const loadingStations = useSubscribe('stations.admin');

    const surveys = useFind(() => Surveys.find({}, { sort: { createdAt: -1 } }), []);
    const stations = useFind(() => Stations.find({}, { sort: { createdAt: -1 } }), []);

    const [form, setForm] = useState({
        name: '', location: '', surveyId: '',
        cameraEnabled: true, requirePhoto: false,
        mobileBehavior: 'toggle', welcomeMessage: '',
        theme: 'vistamate',
    });

    const onChange = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const create = (e) => {
        e.preventDefault();
        Meteor.call('stations.create', form, (err, _id) => {
            if (err) return alert(err.reason || err.message);
            const s = Stations.findOne(_id);
            navigator.clipboard.writeText(`${Meteor.absoluteUrl()}s/${s.token}`);
            alert('Kiosk created. URL copied to clipboard.');
            setForm({ ...form, name: '', location: '' });
        });
    };

    const isLoading = loadingSurveys() || loadingStations();
    if (isLoading) return <div className="p-8">Loading…</div>;
    return (
        <div className="min-h-screen bg-base-200 text-base-content p-6">
            <AdminHeader />

            <div className="card bg-base-100 shadow">
                <div className="card-body space-y-6">
                    <h2 className="card-title">Create New Kiosk</h2>

                    <div className="grid md:grid-cols-2 gap-4">
                        <input className="input input-bordered" placeholder="Kiosk Name"
                            value={form.name} onChange={e => onChange('name', e.target.value)} />
                        <input className="input input-bordered" placeholder="Location"
                            value={form.location} onChange={e => onChange('location', e.target.value)} />
                    </div>

                    <div>
                        <label className="label">Select Questionnaire</label>
                        <select className="select select-bordered w-full"
                            value={form.surveyId} onChange={e => onChange('surveyId', e.target.value)}>
                            <option value="">— choose survey —</option>
                            {surveys.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                        </select>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <label className="cursor-pointer flex items-center gap-2">
                            <input type="checkbox" className="checkbox"
                                checked={form.cameraEnabled} onChange={e => onChange('cameraEnabled', e.target.checked)} />
                            <span>Enable Camera</span>
                        </label>
                        <label className="cursor-pointer flex items-center gap-2">
                            <input type="checkbox" className="checkbox"
                                checked={form.requirePhoto} onChange={e => onChange('requirePhoto', e.target.checked)} />
                            <span>Require Photo</span>
                        </label>
                    </div>

                    <div>
                        <label className="label">Mobile Behavior</label>
                        <div className="join">
                            <button type="button" className={`btn join-item ${form.mobileBehavior === 'form_always' ? 'btn-active' : ''}`}
                                onClick={() => onChange('mobileBehavior', 'form_always')}>Form always visible</button>
                            <button type="button" className={`btn join-item ${form.mobileBehavior === 'toggle' ? 'btn-active' : ''}`}
                                onClick={() => onChange('mobileBehavior', 'toggle')}>Toggle camera/form</button>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <textarea className="textarea textarea-bordered" placeholder="Welcome message"
                            value={form.welcomeMessage} onChange={e => onChange('welcomeMessage', e.target.value)} />
                        <input className="input input-bordered" placeholder="Theme (vistamate or dark)"
                            value={form.theme} onChange={e => onChange('theme', e.target.value)} />
                    </div>

                    <div className="flex gap-3">
                        <button className="btn btn-primary" onClick={create}>Create Kiosk</button>
                        <a className="btn btn-ghost" href="/admin">Cancel</a>
                    </div>
                </div>
            </div>

            <ExistingStations stations={stations} />
        </div>
    );
}

function ExistingStations({ stations }) {
    const open = (s) => window.open(`/s/${s.token}`, '_blank');
    const copy = (s) => navigator.clipboard.writeText(`${Meteor.absoluteUrl()}s/${s.token}`);

    return (
        <div className="card bg-base-100 shadow mt-6">
            <div className="card-body">
                <h3 className="card-title">Existing Kiosks</h3>
                <div className="overflow-x-auto">
                    <table className="table">
                        <thead><tr><th>Name</th><th>Location</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                            {stations.map(s => (
                                <tr key={s._id}>
                                    <td>{s.name}</td>
                                    <td>{s.location || '—'}</td>
                                    <td><span className={`badge ${s.isActive ? 'badge-success' : 'badge-ghost'}`}>{s.isActive ? 'Active' : 'Inactive'}</span></td>
                                    <td className="flex gap-2">
                                        <button className="btn btn-xs" onClick={() => open(s)}>Open</button>
                                        <button className="btn btn-xs" onClick={() => copy(s)}>Copy URL</button>
                                        <button className="btn btn-xs" onClick={() => Meteor.call('stations.update', { _id: s._id, updates: { isActive: !s.isActive } })}>
                                            {s.isActive ? 'Disable' : 'Enable'}
                                        </button>
                                        <button className="btn btn-xs" onClick={() => Meteor.call('stations.rotate', { _id: s._id })}>Rotate URL</button>
                                    </td>
                                </tr>))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
