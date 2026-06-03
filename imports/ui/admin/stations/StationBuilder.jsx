import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { motion } from 'framer-motion';
import { useSubscribe, useFind } from 'meteor/react-meteor-data';
import { ChevronDown } from 'lucide-react';

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

  const [showAdvanced, setShowAdvanced] = useState(false);

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
      <div className="space-y-6">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="vm-card p-5 sm:p-6"
        >
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold vm-heading">
                Create station
              </h2>
              <p className="mt-1 text-sm vm-muted">
                Configure the kiosk experience and assigned survey.
              </p>
            </div>
            <span className="text-sm font-semibold vm-kicker">New kiosk</span>
          </div>

          <div className="grid gap-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold vm-heading">
                  Kiosk name
                </span>
                <input
                  className="vm-input w-full rounded-md"
                  placeholder="Lobby kiosk"
                  value={form.name}
                  onChange={(e) => onChange('name', e.target.value)}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold vm-heading">
                  Location
                </span>
                <input
                  className="vm-input w-full rounded-md"
                  placeholder="Main reception"
                  value={form.location}
                  onChange={(e) => onChange('location', e.target.value)}
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold vm-heading">
                Select questionnaire
              </span>
              <select
                className="vm-select w-full rounded-md"
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

            <div className="border-t border-[var(--vm-border)] pt-5">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm font-semibold text-[var(--vm-primary)] hover:text-[var(--vm-primary-hover)] transition-colors"
              >
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                  strokeWidth={2}
                />
                Advanced Settings
              </button>

              {showAdvanced && (
                <div className="mt-4 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl vm-panel p-4">
                      <span>
                        <span className="block font-semibold vm-heading">
                          Enable camera
                        </span>
                        <span className="mt-1 text-sm vm-muted">
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

                    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl vm-panel p-4">
                      <span>
                        <span className="block font-semibold vm-heading">
                          Require photo
                        </span>
                        <span className="mt-1 text-sm vm-muted">
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
                    <span className="mb-2 block text-sm font-semibold vm-heading">
                      Mobile behavior
                    </span>
                    <div className="flex gap-2 w-full md:w-auto">
                      <button
                        type="button"
                        className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                          form.mobileBehavior === 'form_always'
                            ? 'bg-[var(--vm-primary)] text-white'
                            : 'bg-[var(--vm-surface)] text-[var(--vm-muted)] border border-[var(--vm-border)]'
                        }`}
                        onClick={() => onChange('mobileBehavior', 'form_always')}
                      >
                        Form always visible
                      </button>
                      <button
                        type="button"
                        className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                          form.mobileBehavior === 'toggle'
                            ? 'bg-[var(--vm-primary)] text-white'
                            : 'bg-[var(--vm-surface)] text-[var(--vm-muted)] border border-[var(--vm-border)]'
                        }`}
                        onClick={() => onChange('mobileBehavior', 'toggle')}
                      >
                        Toggle camera/form
                      </button>
                    </div>
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold vm-heading">
                      Welcome message
                    </span>
                    <textarea
                      className="vm-textarea w-full min-h-28 rounded-md"
                      placeholder="Welcome message"
                      value={form.welcomeMessage}
                      onChange={(e) => onChange('welcomeMessage', e.target.value)}
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-[var(--vm-border)] pt-5 sm:flex-row">
              <button
                type="button"
                className="vm-btn-primary rounded-md px-4 py-2 text-sm font-semibold"
                onClick={create}
              >
                Create Kiosk
              </button>
              <a
                className="vm-btn-secondary rounded-md px-4 py-2 text-sm font-semibold text-center"
                href="/admin"
              >
                Cancel
              </a>
            </div>
          </div>
        </motion.section>

        <ExistingStations stations={stations} surveys={surveys} />
      </div>
    </AdminShell>
  );
}
