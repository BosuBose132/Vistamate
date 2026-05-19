import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { Survey } from 'survey-react-ui';
import { Model } from 'survey-core';
import {
  LayeredDarkPanelless,
  LayeredLightPanelless,
} from 'survey-core/themes'; // Modern SurveyJS base CSS
//import 'survey-core/defaultV2.min.css';

export default function AdminQuickCheckIn({ defaultStationId = null }) {
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null);
  const modelRef = useRef(null);

  const survey = useMemo(() => {
    const json = {
      showQuestionNumbers: 'off',
      widthMode: 'responsive',
      elements: [
        {
          type: 'text',
          name: 'name',
          title: 'Full Name',
          isRequired: true,
          startWithNewLine: true,
          placeholder: 'Enter visitor name',
        },
        {
          type: 'text',
          name: 'company',
          title: 'Company',
          startWithNewLine: false,
          placeholder: 'Company name',
        },
        {
          type: 'dropdown',
          name: 'purpose',
          title: 'Purpose of Visit',
          choices: ['Meeting', 'Interview', 'Delivery', 'Other'],
          defaultValue: 'Meeting',
          startWithNewLine: true,
        },
        {
          type: 'text',
          name: 'host',
          title: 'Host/Contact',
          startWithNewLine: false,
          placeholder: 'Who are they visiting?',
        },
      ],
    };
    const m = new Model(json);
    // we supply our own button; hide SurveyJS nav/complete
    m.showNavigationButtons = false;
    modelRef.current = m;
    return m;
  }, []);

  // Apply SurveyJS theme based on DaisyUI theme (light/dark)
  useEffect(() => {
    const m = modelRef.current;
    if (!m) return;

    const apply = () => {
      // DaisyUI: either data-theme="dark"/"vistamate" or a "dark" class
      const dt = document.documentElement.getAttribute('data-theme');
      const isDark =
        (dt && dt.toLowerCase().includes('dark')) ||
        document.documentElement.classList.contains('dark');
      m.applyTheme(isDark ? LayeredDarkPanelless : LayeredLightPanelless);
    };

    apply(); // initial
    // Watch for theme changes (toggle component updates data-theme/class)
    const obs = new MutationObserver(apply);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class'],
    });
    return () => obs.disconnect();
  }, []);

  const handleSubmit = async () => {
    if (submitting) return;
    const m = modelRef.current;
    if (!m) return;

    // validate SurveyJS fields
    if (!m.validate(true)) return;

    setSubmitting(true);
    setMsg(null);
    const data = m.data || {};
    try {
      const payload = {
        name: (data.name || '').trim(),
        company: (data.company || '').trim(),
        purpose: data.purpose || 'Other',
        host: (data.host || '').trim(),
        stationId: defaultStationId || null,
      };

      await new Promise((res, rej) =>
        Meteor.call('admin.quickCheckIn', payload, (err, _id) =>
          err ? rej(err) : res(_id),
        ),
      );

      setMsg({ type: 'success', text: 'Visitor checked in.' });
      m.clear(true, true); // reset fields, keep form visible
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
    <div className="rounded-2xl border border-base-300/80 bg-base-100 p-5 shadow-sm shadow-base-content/5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Quick check-in</h2>
          <p className="mt-1 text-sm text-base-content/55">Admin entry</p>
        </div>
        <span className="badge badge-outline rounded-md border-base-300">
          Manual
        </span>
      </div>

      <div className="sv-root-modern rounded-xl border border-base-300/70 bg-base-200/30 p-3 text-base-content">
        <Survey model={survey} />
      </div>

      <div className="mt-4 space-y-3">
        <button
          className={`btn btn-primary w-full rounded-md ${
            submitting ? 'btn-disabled' : ''
          }`}
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Checking In…' : 'Check In'}
        </button>

        {msg?.type === 'success' && (
          <div className="alert alert-success rounded-xl py-2 text-sm">
            <span>{msg.text}</span>
          </div>
        )}
        {msg?.type === 'error' && (
          <div className="alert alert-error rounded-xl py-2 text-sm">
            <span>{msg.text}</span>
          </div>
        )}
      </div>
    </div>
  );
}
