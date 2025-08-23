import React, { useState } from 'react';
import { useSubscribe, useFind } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Surveys } from '/imports/api/surveys/surveys.collection';

export default function SurveyManager() {
    const sub = useSubscribe('surveys.admin')();
    const surveys = useFind(() => Surveys.find({}, { sort: { createdAt: -1 } }), []);
    const [name, setName] = useState('');
    const [json, setJson] = useState('');

    if (sub) return <div className="p-8">Loading…</div>;

    const create = (e) => {
        e.preventDefault();
        Meteor.call('surveys.create', { name, json }, (err) => {
            if (err) alert(err.reason || err.message);
            else { setName(''); setJson(''); }
        });
    };

    return (
        <div className="min-h-screen bg-base-200 p-6">
            <div className="navbar bg-base-100 shadow mb-6">
                <div className="flex-1"><a href="/admin" className="btn btn-ghost text-xl">Vistamate Admin</a></div>
                <div className="flex-none gap-2">
                    <a className="btn btn-sm" href="/admin/stations">Stations</a>
                    <a className="btn btn-sm" href="/admin/checkins">Check-ins</a>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                <div className="card bg-base-100 shadow">
                    <div className="card-body">
                        <h2 className="card-title">Add Survey (Paste JSON)</h2>
                        <form onSubmit={create} className="grid gap-3">
                            <input className="input input-bordered" placeholder="Survey name"
                                value={name} onChange={e => setName(e.target.value)} required />
                            <textarea className="textarea textarea-bordered h-64 font-mono"
                                placeholder='{"title":"Visitor Registration","elements":[...]}' value={json}
                                onChange={e => setJson(e.target.value)} required />
                            <button className="btn btn-primary self-start">Save Survey</button>
                        </form>
                    </div>
                </div>

                <div className="card bg-base-100 shadow">
                    <div className="card-body">
                        <h2 className="card-title">Existing Surveys</h2>
                        <ul className="menu">
                            {surveys.map(s => <li key={s._id}><span>{s.name}</span></li>)}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
