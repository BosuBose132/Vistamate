import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { motion } from 'framer-motion';
import { useSubscribe, useFind } from 'meteor/react-meteor-data';

import { Surveys } from '/imports/api/surveys/surveys.collection';
import AdminShell from '/imports/ui/components/AdminShell';
import { Card, Button } from '@mieweb/ui';
export default function SurveyManager() {
  const sub = useSubscribe('surveys.admin')();
  const surveys = useFind(
    () => Surveys.find({}, { sort: { createdAt: -1 } }),
    [],
  );
  const [name, setName] = useState('');
  const [json, setJson] = useState('');

  if (sub) {
    return (
      <AdminShell title="Surveys" eyebrow="Form management">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="skeleton h-[32rem] rounded-2xl" />
          <div className="skeleton h-96 rounded-2xl" />
        </div>
      </AdminShell>
    );
  }

  const create = (e) => {
    e.preventDefault();
    Meteor.call('surveys.create', { name, json }, (err) => {
      if (err) alert(err.reason || err.message);
      else {
        setName('');
        setJson('');
      }
    });
  };

  return (
    <AdminShell title="Surveys" eyebrow="Form management">
      <main className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Form management</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Surveys
            </h1>
            <p className="mt-2 text-sm text-base-content/60">
              Create and manage SurveyJS check-in forms.
            </p>
          </div>

          <div className="rounded-full border border-base-300/80 bg-base-100 px-4 py-2 text-sm font-medium text-base-content/70 shadow-sm">
            {surveys.length} survey{surveys.length === 1 ? '' : 's'}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="rounded-2xl border border-base-300/80 bg-base-100 p-5 shadow-sm shadow-base-content/5 sm:p-6"
          >
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Create survey</h2>
                <p className="mt-1 text-sm text-base-content/55">
                  Paste valid SurveyJS JSON to add a check-in form.
                </p>
              </div>
              <span className="badge badge-outline rounded-md border-base-300">
                JSON
              </span>
            </div>

            <form onSubmit={create} className="grid gap-5">
              <label className="form-control">
                <span className="label-text mb-2 font-semibold">
                  Survey name
                </span>
                <input
                  className="input input-bordered rounded-md border-base-300"
                  placeholder="Visitor Registration"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </label>

              <label className="form-control">
                <span className="label-text mb-2 font-semibold">
                  Survey JSON
                </span>
                <textarea
                  className="textarea textarea-bordered min-h-96 rounded-md border-base-300 bg-base-200/30 font-mono text-sm leading-relaxed"
                  placeholder='{"title":"Visitor Registration","elements":[...]}'
                  value={json}
                  onChange={(e) => setJson(e.target.value)}
                  required
                />
              </label>

              <div className="flex flex-col gap-3 border-t border-base-300/80 pt-5 sm:flex-row sm:items-center">
                <button className="btn btn-primary rounded-md">
                  Save Survey
                </button>
                <span className="text-sm text-base-content/55">
                  SurveyJS validation runs when saved.
                </span>
              </div>
            </form>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="overflow-hidden rounded-2xl border border-base-300/80 bg-base-100 shadow-sm shadow-base-content/5"
          >
            <div className="border-b border-base-300/80 px-5 py-4">
              <h2 className="text-lg font-semibold">Existing surveys</h2>
              <p className="mt-1 text-sm text-base-content/55">
                Available forms for station assignment.
              </p>
            </div>

            <div className="divide-y divide-base-300/80">
              {surveys.map((s) => (
                <div key={s._id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{s.name}</h3>
                      <p className="mt-1 text-sm text-base-content/55">
                        {surveyElementCount(s.json)} element
                        {surveyElementCount(s.json) === 1 ? '' : 's'}
                      </p>
                    </div>
                    <span className="badge badge-outline rounded-md border-base-300">
                      SurveyJS
                    </span>
                  </div>
                </div>
              ))}

              {surveys.length === 0 && (
                <div className="px-5 py-12 text-center text-base-content/50">
                  No surveys created yet.
                </div>
              )}
            </div>
          </motion.section>
        </div>
      </main>
    </AdminShell>
  );
}

function surveyElementCount(json) {
  if (!json || typeof json !== 'object') return 0;
  if (Array.isArray(json.elements)) return json.elements.length;
  if (!Array.isArray(json.pages)) return 0;
  return json.pages.reduce(
    (count, page) =>
      count + (Array.isArray(page.elements) ? page.elements.length : 0),
    0,
  );
}
