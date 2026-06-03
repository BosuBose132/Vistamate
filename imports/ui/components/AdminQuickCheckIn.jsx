import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';

const initialForm = {
  name: '',
  company: '',
  purpose: 'Meeting',
  host: '',
};

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
    <div className="vm-card p-5 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--vm-heading)]">
            Quick check-in
          </h2>
          <p className="mt-1 text-sm text-[var(--vm-muted)]">Admin entry</p>
        </div>

        <span className="vm-badge">Manual</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="vm-panel p-5 sm:p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <label>
              <span className="mb-2 block text-sm font-bold text-[var(--vm-heading)]">
                Full Name <span className="text-red-500">*</span>
              </span>
              <input
                className="vm-input"
                placeholder="Enter visitor name"
                value={form.name}
                onChange={(e) => onChange('name', e.target.value)}
                required
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-bold text-[var(--vm-heading)]">
                Company
              </span>
              <input
                className="vm-input"
                placeholder="Company name"
                value={form.company}
                onChange={(e) => onChange('company', e.target.value)}
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-bold text-[var(--vm-heading)]">
                Purpose of Visit
              </span>
              <select
                className="vm-select"
                value={form.purpose}
                onChange={(e) => onChange('purpose', e.target.value)}
              >
                <option value="Meeting">Meeting</option>
                <option value="Interview">Interview</option>
                <option value="Delivery">Delivery</option>
                <option value="Other">Other</option>
              </select>
            </label>

            <label>
              <span className="mb-2 block text-sm font-bold text-[var(--vm-heading)]">
                Host/Contact
              </span>
              <input
                className="vm-input"
                placeholder="Who are they visiting?"
                value={form.host}
                onChange={(e) => onChange('host', e.target.value)}
              />
            </label>
          </div>
        </div>

        <button
          type="submit"
          className={`vm-btn-primary h-12 w-full ${
            submitting ? 'cursor-not-allowed opacity-60' : ''
          }`}
          disabled={submitting}
        >
          {submitting ? 'Checking In…' : 'Check In'}
        </button>

        {msg?.type === 'success' && (
          <div className="rounded-xl border border-emerald-300/40 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-500">
            {msg.text}
          </div>
        )}

        {msg?.type === 'error' && (
          <div className="rounded-xl border border-red-300/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-500">
            {msg.text}
          </div>
        )}
      </form>
    </div>
  );
}
