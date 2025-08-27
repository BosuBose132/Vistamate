import React, { useMemo, useRef, useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { Model } from 'survey-core';
import { Survey } from 'survey-react-ui';
//import 'survey-core/defaultV2.min.css'; // minimal SurveyJS base styles
import 'survey-core/survey-core.css';

/**
 * Small admin-facing check-in form.
 * Uses SurveyJS for schema/validation, wraps in a DaisyUI card.
 * On submit -> calls visitors.checkIn and clears the form.
 */
export default function AdminQuickCheckIn({ defaultStationId = null }) {
    const [submitting, setSubmitting] = useState(false);
    const [msg, setMsg] = useState(null); // {type:'success'|'error', text:string}
    const modelRef = useRef(null);

    const survey = useMemo(() => {
        const json = {
            showQuestionNumbers: 'off',
            widthMode: 'responsive',
            completedHtml: '', // we manage success UI ourselves
            elements: [
                // Row 1
                {
                    type: 'text',
                    name: 'name',
                    title: 'Full Name',
                    isRequired: true,
                    placeholder: 'Enter visitor name',
                    // put next field on same row
                    startWithNewLine: true
                },
                {
                    type: 'text',
                    name: 'company',
                    title: 'Company',
                    placeholder: 'Company name',
                    startWithNewLine: false
                },
                // Row 2
                {
                    type: 'dropdown',
                    name: 'purpose',
                    title: 'Purpose of Visit',
                    choices: ['Meeting', 'Interview', 'Delivery', 'Other'],
                    defaultValue: 'Meeting',
                    startWithNewLine: true
                },
                {
                    type: 'text',
                    name: 'host',
                    title: 'Host/Contact',
                    placeholder: 'Who are you visiting?',
                    startWithNewLine: false
                }
            ]
        };

        const m = new Model(json);
        m.locale = 'en';
        m.completeText = 'Check In';
        m.onAfterRenderSurvey.add((_, opt) => {
            // apply DaisyUI spacing inside the card
            try {
                opt.htmlElement.classList.add('grid', 'gap-3', 'md:grid-cols-2');
            } catch { }
        });
        // Keep a ref so we can reset later
        modelRef.current = m;
        return m;
    }, []);

    // Handle submit
    survey.onComplete.add(async (_, options) => {
        const data = survey.data || {};
        setSubmitting(true);
        setMsg(null);
        try {
            // include stationId if you want these to count toward a station; null => "Global"
            const payload = {
                name: (data.name || '').trim(),
                company: (data.company || '').trim(),
                purpose: data.purpose || 'Other',
                host: (data.host || '').trim(),
                stationId: defaultStationId || null
            };

            await new Promise((res, rej) =>
                Meteor.call('visitors.checkIn', payload, (err, _id) => (err ? rej(err) : res(_id)))
            );

            setMsg({ type: 'success', text: 'Visitor checked in.' });
            // reset Survey form
            modelRef.current?.clear(true, true);
        } catch (e) {
            setMsg({ type: 'error', text: e?.reason || e?.message || 'Failed to check in.' });
        } finally {
            setSubmitting(false);
            // prevent Survey’s default "completed" screen
            options.allow = false;
        }
    });

    return (
        <div className="card bg-base-100 shadow mb-6">
            <div className="card-body">
                <div className="flex items-center justify-between mb-1">
                    <h2 className="card-title">New Visitor Check-in</h2>
                    <span className="text-xs opacity-60">Admin entered</span>
                </div>

                {/* SurveyJS renders the fields; we wrap it so it looks at home in DaisyUI */}
                <div className="sv-root-modern">
                    <Survey model={survey} />
                </div>

                <div className="mt-2 flex items-center gap-3">
                    <button
                        className={`btn btn-primary ${submitting ? 'btn-disabled' : ''}`}
                        onClick={() => modelRef.current?.completeLastPage()}
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
