import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { motion } from 'framer-motion';
import { useSubscribe, useFind } from 'meteor/react-meteor-data';

import { Stations } from '/imports/api/stations/stations.collection';
import { Surveys } from '/imports/api/surveys/surveys.collection';
import AdminShell from '/imports/ui/components/AdminShell';
import ExistingStations from '/imports/ui/admin/stations/ExistingStations';
import { Card, Button } from '@mieweb/ui';
export default function StationBuilder() {
  const loadingSurveys = useSubscribe('surveys.admin');
  const loadingStations = useSubscribe('stations.admin');

  const surveys = useFind(
    () => Surveys.find({}, { sort: { createdAt: -1 } }),
    [],
  );
  const stations = useFind(
    () => Stations.find({}, { sort: { createdAt: -1 } }),
    [],
  );

  const [form, setForm] = useState({
    name: '',
    location: '',
    surveyId: '',
    cameraEnabled: true,
    requirePhoto: false,
    mobileBehavior: 'toggle',
    welcomeMessage: '',
    theme: 'vistamate',
  });

  const onChange = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const create = (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      alert('Kiosk name is required.');
      return;
    }

    Meteor.call('stations.create', form, async (err, result) => {
      if (err) {
        alert(err.reason || err.message);
        return;
      }

      const kioskUrl = `${Meteor.absoluteUrl()}s/${result.token}`;

      try {
        await navigator.clipboard.writeText(kioskUrl);
        alert('Kiosk created. URL copied to clipboard.');
      } catch {
        alert(`Kiosk created. URL: ${kioskUrl}`);
      }

      setForm((current) => ({
        ...current,
        name: '',
        location: '',
        welcomeMessage: '',
      }));
    });
  };

  const isLoading = loadingSurveys() || loadingStations();
  if (isLoading) {
    return (
      <AdminShell title="Stations" eyebrow="Kiosk management">
        <div className="space-y-6">
          <div className="skeleton h-64 rounded-2xl" />
          <div className="skeleton h-80 rounded-2xl" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Stations" eyebrow="Kiosk management">
      <main className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Kiosk management</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Stations
            </h1>
            <p className="mt-2 text-sm text-base-content/60">
              Create and manage kiosk stations.
            </p>
          </div>

          <div className="rounded-full border border-base-300/80 bg-base-100 px-4 py-2 text-sm font-medium text-base-content/70 shadow-sm">
            {stations.length} station{stations.length === 1 ? '' : 's'}
          </div>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="rounded-3xl border border-[#d9eceb] bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Create station</h2>
              <p className="mt-1 text-sm text-base-content/55">
                Configure the kiosk experience and assigned survey.
              </p>
            </div>
            <span className="text-sm font-semibold text-[#23b6b6]">
              New kiosk
            </span>
          </div>

          <div className="grid gap-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="form-control">
                <span className="label-text mb-2 font-semibold">
                  Kiosk name
                </span>
                <input
                  className="input input-bordered rounded-md border-base-300"
                  placeholder="Lobby kiosk"
                  value={form.name}
                  onChange={(e) => onChange('name', e.target.value)}
                />
              </label>

              <label className="form-control">
                <span className="label-text mb-2 font-semibold">Location</span>
                <input
                  className="input input-bordered rounded-md border-base-300"
                  placeholder="Main reception"
                  value={form.location}
                  onChange={(e) => onChange('location', e.target.value)}
                />
              </label>
            </div>

            <label className="form-control">
              <span className="label-text mb-2 font-semibold">
                Select questionnaire
              </span>
              <select
                className="select select-bordered w-full rounded-md border-base-300"
                value={form.surveyId}
                onChange={(e) => onChange('surveyId', e.target.value)}
              >
                <option value="">— choose survey —</option>
                {surveys.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-base-300/80 bg-base-200/30 p-4">
                <span>
                  <span className="block font-semibold">Enable camera</span>
                  <span className="text-sm text-base-content/55">
                    Allow kiosk camera capture.
                  </span>
                </span>
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={form.cameraEnabled}
                  onChange={(e) => onChange('cameraEnabled', e.target.checked)}
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-base-300/80 bg-base-200/30 p-4">
                <span>
                  <span className="block font-semibold">Require photo</span>
                  <span className="text-sm text-base-content/55">
                    Capture visitor image when needed.
                  </span>
                </span>
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={form.requirePhoto}
                  onChange={(e) => onChange('requirePhoto', e.target.checked)}
                />
              </label>
            </div>

            <div>
              <span className="label-text mb-2 block font-semibold">
                Mobile behavior
              </span>
              <div className="join w-full md:w-auto">
                <button
                  type="button"
                  className={`btn join-item flex-1 rounded-l-md md:flex-none ${
                    form.mobileBehavior === 'form_always'
                      ? 'btn-primary'
                      : 'btn-outline border-base-300'
                  }`}
                  onClick={() => onChange('mobileBehavior', 'form_always')}
                >
                  Form always visible
                </button>
                <button
                  type="button"
                  className={`btn join-item flex-1 rounded-r-md md:flex-none ${
                    form.mobileBehavior === 'toggle'
                      ? 'btn-primary'
                      : 'btn-outline border-base-300'
                  }`}
                  onClick={() => onChange('mobileBehavior', 'toggle')}
                >
                  Toggle camera/form
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="form-control">
                <span className="label-text mb-2 font-semibold">
                  Welcome message
                </span>
                <textarea
                  className="textarea textarea-bordered min-h-28 rounded-md border-base-300"
                  placeholder="Welcome message"
                  value={form.welcomeMessage}
                  onChange={(e) => onChange('welcomeMessage', e.target.value)}
                />
              </label>

              <label className="form-control">
                <span className="label-text mb-2 font-semibold">Theme</span>
                <input
                  className="input input-bordered rounded-md border-base-300"
                  placeholder="vistamate or dark"
                  value={form.theme}
                  onChange={(e) => onChange('theme', e.target.value)}
                />
              </label>
            </div>

            <div className="flex flex-col gap-3 border-t border-base-300/80 pt-5 sm:flex-row">
              <button
                type="button"
                className="btn btn-primary rounded-md"
                onClick={create}
              >
                Create Kiosk
              </button>
              <a className="btn btn-ghost rounded-md" href="/admin">
                Cancel
              </a>
            </div>
          </div>
        </motion.section>

        <ExistingStations stations={stations} surveys={surveys} />
      </main>
    </AdminShell>
  );
}
