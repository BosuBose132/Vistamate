import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { Survey } from 'survey-react-ui';
import { Model } from 'survey-core';
import {
  LayeredDarkPanelless,
  LayeredLightPanelless,
} from 'survey-core/themes'; // Modern SurveyJS base CSS
//import 'survey-core/defaultV2.min.css';
import { Button, Card } from '@mieweb/ui';

const vistamateSurveyVariables = {
  '--sjs-primary-backcolor': 'var(--vm-primary)',
  '--sjs-primary-backcolor-dark': 'var(--vm-primary-hover)',
  '--sjs-primary-backcolor-light': 'var(--vm-primary-soft)',
  '--sjs-primary-forecolor': '#ffffff',

  '--sjs-primary-background-500': 'var(--vm-primary)',
  '--sjs-primary-background-400': 'var(--vm-primary-hover)',
  '--sjs-primary-background-10': 'var(--vm-primary-soft)',
  '--sjs-primary-foreground-100': '#ffffff',

  '--sjs-general-backcolor': 'var(--vm-surface)',
  '--sjs-general-backcolor-dim': 'var(--vm-surface-soft)',
  '--sjs-general-forecolor': 'var(--vm-text)',
  '--sjs-general-forecolor-light': 'var(--vm-muted)',

  '--sjs-general-background-500': 'var(--vm-surface)',
  '--sjs-general-background-400': 'var(--vm-surface-soft)',
  '--sjs-general-background-10': 'var(--vm-surface-muted)',
  '--sjs-general-foreground-100': 'var(--vm-text)',
  '--sjs-general-foreground-70': 'var(--vm-muted)',
  '--sjs-general-foreground-50': 'var(--vm-muted)',

  '--sjs-border-default': 'var(--vm-border)',
  '--sjs-border-light': 'var(--vm-border)',
};

const VistamateLightSurveyTheme = {
  ...LayeredLightPanelless,
  cssVariables: {
    ...(LayeredLightPanelless.cssVariables || {}),
    ...vistamateSurveyVariables,
  },
};

const VistamateDarkSurveyTheme = {
  ...LayeredDarkPanelless,
  cssVariables: {
    ...(LayeredDarkPanelless.cssVariables || {}),
    ...vistamateSurveyVariables,
  },
};

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
      m.applyTheme(
        isDark ? VistamateDarkSurveyTheme : VistamateLightSurveyTheme,
      );
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
    <Card className="vm-card p-5 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--vm-heading)]">
            Quick check-in
          </h2>
          <p className="mt-1 text-sm text-[var(--vm-muted)]">Admin entry</p>
        </div>

        <span className="vm-badge">Manual</span>
      </div>

      <div className="vm-panel p-3">
        <Survey model={survey} />
      </div>

      <div className="mt-5 space-y-3">
        <Button
          className={`vm-btn-primary h-12 w-full ${
            submitting ? 'opacity-60' : ''
          }`}
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Checking In…' : 'Check In'}
        </Button>

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
      </div>
    </Card>
  );
}
