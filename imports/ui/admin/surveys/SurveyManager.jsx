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
      <div className="space-y-6 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-6">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="vm-card p-5 sm:p-6"
        >
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold vm-heading">
                Create survey
              </h2>
              <p className="mt-1 text-sm vm-muted">
                Paste valid SurveyJS JSON to add a check-in form.
              </p>
            </div>
            <span className="vm-kicker inline-block text-sm font-semibold px-3 py-1 rounded-md bg-[var(--vm-primary-soft)] border border-[var(--vm-border)]">
              JSON
            </span>
          </div>

          <form onSubmit={create} className="grid gap-5">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold vm-heading">
                Survey name
              </span>
              <input
                className="vm-input w-full rounded-md"
                placeholder="Visitor Registration"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold vm-heading">
                Survey JSON
              </span>
              <textarea
                className="vm-textarea w-full min-h-96 rounded-md font-mono text-sm leading-relaxed"
                placeholder='{"title":"Visitor Registration","elements":[...]}'
                value={json}
                onChange={(e) => setJson(e.target.value)}
                required
              />
            </label>

            <div className="flex flex-col gap-3 border-t border-[var(--vm-border)] pt-5 sm:flex-row sm:items-center">
              <button className="vm-btn-primary rounded-md px-4 py-2 text-sm font-semibold">
                Save Survey
              </button>
              <span className="text-sm vm-muted">
                SurveyJS validation runs when saved.
              </span>
            </div>
          </form>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="vm-card overflow-hidden"
        >
          <div className="border-b border-[var(--vm-border)] px-5 py-4">
            <h2 className="text-lg font-semibold vm-heading">
              Existing surveys
            </h2>
            <p className="mt-1 text-sm vm-muted">
              Available forms for station assignment.
            </p>
          </div>

          <div className="divide-y divide-[var(--vm-border)]">
            {surveys.map((s) => (
              <div key={s._id} className="vm-panel px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold vm-heading">{s.name}</h3>
                    <p className="mt-1 text-sm vm-muted">
                      {surveyElementCount(s.json)} element
                      {surveyElementCount(s.json) === 1 ? '' : 's'}
                    </p>
                  </div>
                  <span className="vm-badge text-xs font-semibold">
                    SurveyJS
                  </span>
                </div>
              </div>
            ))}

            {surveys.length === 0 && (
              <div className="px-5 py-12 text-center vm-muted">
                No surveys created yet.
              </div>
            )}
          </div>
        </motion.section>
      </div>
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
