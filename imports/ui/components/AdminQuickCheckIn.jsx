import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { Card, Input, Select, Button, Alert, Badge } from '@mieweb/ui';

const initialForm = {
  name: '',
  company: '',
  purpose: 'Meeting',
  host: '',
};

const purposeOptions = [
  { value: 'Meeting', label: 'Meeting' },
  { value: 'Interview', label: 'Interview' },
  { value: 'Delivery', label: 'Delivery' },
  { value: 'Other', label: 'Other' },
];

export default function AdminQuickCheckIn({ defaultStationId = null }) {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null);

  const onChange = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting) return;

    const name = form.name.trim();
    if (!name) {
      setMsg({ type: 'error', text: 'Visitor name is required.' });
      return;
    }

    setSubmitting(true);
    setMsg(null);

    const payload = {
      name,
      company: form.company.trim(),
      purpose: form.purpose || 'Other',
      host: form.host.trim(),
      stationId: defaultStationId || null,
    };

    try {
      await new Promise((resolve, reject) =>
        Meteor.call('admin.quickCheckIn', payload, (err, _id) =>
          err ? reject(err) : resolve(_id),
        ),
      );

      setMsg({ type: 'success', text: 'Visitor checked in.' });
      setForm(initialForm);
    } catch (e) {
      setMsg({
        type: 'error',
        text: e?.reason || e?.message || 'Failed to check in.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="vm-card p-5 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Quick check-in
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Admin entry</p>
        </div>

        <Badge>Manual</Badge>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-xl border border-border bg-muted/50 p-5 sm:p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <label>
              <span className="mb-2 block text-sm font-bold text-foreground">
                Full Name <span className="text-destructive">*</span>
              </span>
              <Input
                placeholder="Enter visitor name"
                value={form.name}
                onChange={(e) => onChange('name', e.target.value)}
                required
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-bold text-foreground">
                Company
              </span>
              <Input
                placeholder="Company name"
                value={form.company}
                onChange={(e) => onChange('company', e.target.value)}
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-bold text-foreground">
                Purpose of Visit
              </span>
              <Select
                value={form.purpose}
                onValueChange={(value) => onChange('purpose', value)}
                options={purposeOptions}
                className="w-full"
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-bold text-foreground">
                Host/Contact
              </span>
              <Input
                placeholder="Who are they visiting?"
                value={form.host}
                onChange={(e) => onChange('host', e.target.value)}
              />
            </label>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="h-12 w-full"
          disabled={submitting}
        >
          {submitting ? 'Checking In…' : 'Check In'}
        </Button>

        {msg?.type === 'success' && (
          <Alert variant="success">{msg.text}</Alert>
        )}

        {msg?.type === 'error' && (
          <Alert variant="destructive">{msg.text}</Alert>
        )}
      </form>
    </Card>
  );
}
