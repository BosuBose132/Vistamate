import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { Model } from 'survey-core';
import { Survey } from 'survey-react-ui';
import { ContrastLight, ContrastDark } from 'survey-core/themes';
// Modern SurveyJS base CSS
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
                { type: 'text', name: 'name', title: 'Full Name', isRequired: true, startWithNewLine: true, placeholder: 'Enter visitor name' },
                { type: 'text', name: 'company', title: 'Company', startWithNewLine: false, placeholder: 'Company name' },
                { type: 'dropdown', name: 'purpose', title: 'Purpose of Visit', choices: ['Meeting', 'Interview', 'Delivery', 'Other'], defaultValue: 'Meeting', startWithNewLine: true },
                { type: 'text', name: 'host', title: 'Host/Contact', startWithNewLine: false, placeholder: 'Who are they visiting?' },
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
            m.applyTheme(isDark ? ContrastDark : ContrastLight);
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
                Meteor.call('admin.quickCheckIn', payload, (err, _id) => (err ? rej(err) : res(_id)))
            );

            setMsg({ type: 'success', text: 'Visitor checked in.' });
            m.clear(true, true); // reset fields, keep form visible
        } catch (e) {
            setMsg({ type: 'error', text: e?.reason || e?.message || 'Failed to check in.' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="card bg-base-100 shadow mb-6">
            <div className="card-body">
                <div className="flex items-center justify-between mb-1">
                    <h2 className="card-title">New Visitor Check-in</h2>
                    <span className="text-xs opacity-60">Admin entered</span>
                </div>

                <div className="sv-root-modern">
                    <Survey model={survey} />
                </div>

                <div className="mt-2 flex items-center gap-3">
                    <button
                        className={`btn btn-primary ${submitting ? 'btn-disabled' : ''}`}
                        onClick={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? 'Checking In…' : 'Check In'}
                    </button>

                    {msg?.type === 'success' && (
                        <div className="badge badge-success badge-outline">{msg.text}</div>
                    )}
                    {msg?.type === 'error' && (
                        <div className="badge badge-error badge-outline">{msg.text}</div>
                    )}
                </div>
            </div>
        </div>
    );
}
