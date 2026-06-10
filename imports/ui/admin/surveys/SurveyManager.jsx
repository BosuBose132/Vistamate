import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { motion } from 'framer-motion';
import { useSubscribe, useFind } from 'meteor/react-meteor-data';

import { Surveys } from '/imports/api/surveys/surveys.collection';
import AdminShell from '/imports/ui/components/AdminShell';
import { Card, Button, Skeleton, Input, Textarea, Badge } from '@mieweb/ui';

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
          <Skeleton className="h-[32rem] rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
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
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <Card className="vm-card p-5 sm:p-6">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Create survey
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Paste valid SurveyJS JSON to add a check-in form.
                </p>
              </div>
              <Badge>JSON</Badge>
            </div>

            <form onSubmit={create} className="grid gap-5">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-foreground">
                  Survey name
                </span>
                <Input
                  placeholder="Visitor Registration"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-foreground">
                  Survey JSON
                </span>
                <Textarea
                  className="min-h-96 font-mono text-sm leading-relaxed"
                  placeholder='{"title":"Visitor Registration","elements":[...]}'
                  value={json}
                  onChange={(e) => setJson(e.target.value)}
                  required
                />
              </label>

              <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center">
                <Button type="submit" variant="primary">
                  Save Survey
                </Button>
                <span className="text-sm text-muted-foreground">
                  SurveyJS validation runs when saved.
                </span>
              </div>
            </form>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
        >
          <Card className="vm-card overflow-hidden">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-lg font-semibold text-foreground">
                Existing surveys
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Available forms for station assignment.
              </p>
            </div>

            <div className="divide-y divide-border">
              {surveys.map((s) => (
                <div key={s._id} className="px-5 py-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{s.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {surveyElementCount(s.json)} element
                        {surveyElementCount(s.json) === 1 ? '' : 's'}
                      </p>
                    </div>
                    <Badge>SurveyJS</Badge>
                  </div>
                </div>
              ))}

              {surveys.length === 0 && (
                <div className="px-5 py-12 text-center text-muted-foreground">
                  No surveys created yet.
                </div>
              )}
            </div>
          </Card>
        </motion.div>
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
