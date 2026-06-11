import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { motion } from 'framer-motion';
import { useSubscribe, useFind } from 'meteor/react-meteor-data';
import { ChevronDown } from 'lucide-react';

import { Stations } from '/imports/api/stations/stations.collection';
import { Surveys } from '/imports/api/surveys/surveys.collection';
import AdminShell from '/imports/ui/components/AdminShell';
import ExistingStations from '/imports/ui/admin/stations/ExistingStations';
import { Card, Button, Skeleton, Input, Select, Switch, Textarea } from '@mieweb/ui';

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

  const surveyOptions = [
    { value: '', label: '— choose survey —' },
    ...surveys.map((s) => ({ value: s._id, label: s.name })),
  ];

  const isLoading = loadingSurveys() || loadingStations();
  if (isLoading) {
    return (
      <AdminShell title="Stations" eyebrow="Kiosk management">
        <div className="space-y-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Stations" eyebrow="Kiosk management">
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <Card className="vm-card p-5 sm:p-6">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Create station
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Configure the kiosk experience and assigned survey.
                </p>
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                New kiosk
              </span>
            </div>

            <div className="grid gap-5">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-foreground">
                    Kiosk name
                  </span>
                  <Input
                    placeholder="Lobby kiosk"
                    value={form.name}
                    onChange={(e) => onChange('name', e.target.value)}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-foreground">
                    Location
                  </span>
                  <Input
                    placeholder="Main reception"
                    value={form.location}
                    onChange={(e) => onChange('location', e.target.value)}
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-foreground">
                  Select questionnaire
                </span>
                <Select
                  value={form.surveyId}
                  onValueChange={(value) => onChange('surveyId', value)}
                  options={surveyOptions}
                  className="w-full"
                />
              </label>

              <div className="border-t border-border pt-5">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex items-center gap-2 p-0 h-auto text-sm font-semibold text-primary hover:text-primary/80 hover:bg-transparent"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                    strokeWidth={2}
                  />
                  Advanced Settings
                </Button>

                {showAdvanced && (
                  <div className="mt-4 space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/50 p-4">
                        <span>
                          <span className="block font-semibold text-foreground">
                            Enable camera
                          </span>
                          <span className="mt-1 block text-sm text-muted-foreground">
                            Allow kiosk camera capture.
                          </span>
                        </span>
                        <Switch
                          checked={form.cameraEnabled}
                          onCheckedChange={(checked) =>
                            onChange('cameraEnabled', checked)
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/50 p-4">
                        <span>
                          <span className="block font-semibold text-foreground">
                            Require photo
                          </span>
                          <span className="mt-1 block text-sm text-muted-foreground">
                            Capture visitor image when needed.
                          </span>
                        </span>
                        <Switch
                          checked={form.requirePhoto}
                          onCheckedChange={(checked) =>
                            onChange('requirePhoto', checked)
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <span className="mb-2 block text-sm font-semibold text-foreground">
                        Mobile behavior
                      </span>
                      <div className="flex w-full gap-2 md:w-auto">
                        <Button
                          type="button"
                          variant={
                            form.mobileBehavior === 'form_always'
                              ? 'primary'
                              : 'outline'
                          }
                          className="flex-1"
                          onClick={() => onChange('mobileBehavior', 'form_always')}
                        >
                          Form always visible
                        </Button>
                        <Button
                          type="button"
                          variant={
                            form.mobileBehavior === 'toggle'
                              ? 'primary'
                              : 'outline'
                          }
                          className="flex-1"
                          onClick={() => onChange('mobileBehavior', 'toggle')}
                        >
                          Toggle camera/form
                        </Button>
                      </div>
                    </div>

                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold text-foreground">
                        Welcome message
                      </span>
                      <Textarea
                        className="min-h-28 w-full"
                        placeholder="Welcome message"
                        value={form.welcomeMessage}
                        onChange={(e) =>
                          onChange('welcomeMessage', e.target.value)
                        }
                      />
                    </label>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row">
                <Button type="button" variant="primary" onClick={create}>
                  Create Kiosk
                </Button>
                <a
                  className="inline-flex items-center justify-center rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground text-center hover:bg-muted transition-colors"
                  href="/admin"
                >
                  Cancel
                </a>
              </div>
            </div>
          </Card>
        </motion.div>

        <ExistingStations stations={stations} surveys={surveys} />
      </div>
    </AdminShell>
  );
}
