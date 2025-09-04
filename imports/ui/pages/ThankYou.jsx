// /imports/ui/pages/ThankYou.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useNavigate, useLocation } from 'react-router-dom';
import { buildVCard } from '/imports/ui/utils/vcard';

export default function ThankYou() {
    const navigate = useNavigate();
    const { state } = useLocation(); // data passed via navigate('/thankyou', { state })
    const [info, setInfo] = useState(null);
    const [seconds, setSeconds] = useState(8); // auto-return countdown (seconds)

    // Load visitor summary (prefer router state, then sessionStorage)
    useEffect(() => {
        if (state && typeof state === 'object') {
            setInfo(state);
            try { sessionStorage.setItem('vistamate:lastCheckin', JSON.stringify(state)); } catch { }
            return;
        }
        try {
            const raw = sessionStorage.getItem('vistamate:lastCheckin');
            setInfo(raw ? JSON.parse(raw) : null);
        } catch {
            setInfo(null);
        }
    }, [state]);

    // Precise countdown → navigate to Home when it hits 0
    // useEffect(() => {
    //     const timer = setInterval(() => {
    //         setSeconds((s) => {
    //             if (s <= 1) {
    //                 clearInterval(timer);
    //                 navigate('/');
    //                 return 0;
    //             }
    //             return s - 1;
    //         });
    //     }, 1000);
    //     return () => clearInterval(timer);
    // }, [navigate]);

    // QR payload (JSON now; swap to a verify URL if you have one)
    const qrPayload = useMemo(() => {
        if (!info) return 'vistamate://checkin';
        return JSON.stringify({
            t: 'vistamate.checkin',
            id: info.visitorId || null,
            n: info.name || '',
            c: info.company || '',
            ts: info.checkedAt || Date.now(),
            v: 1
        });
    }, [info]);

    // vCard (download as .vcf)
    const vcardBlobUrl = useMemo(() => {
        if (!info) return '';
        const vc = buildVCard({
            name: info.name || '',
            company: info.company || '',
            email: info.email || '',
            phone: info.phone || '',
        });
        const blob = new Blob([vc], { type: 'text/vcard;charset=utf-8' });
        return URL.createObjectURL(blob);
    }, [info]);

    // Fallback UI if no data was found
    if (!info) {
        return (
            <div className="min-h-screen bg-base-200 text-base-content flex items-center justify-center px-4">
                <div className="text-center space-y-3">
                    <h1 className="text-2xl font-semibold">You’re all set!</h1>
                    <p className="opacity-70">Unable to locate your check-in details.</p>
                    <button className="btn btn-primary" onClick={() => navigate('/')}>Back to Start</button>
                </div>
            </div>
        );
    }

    // Main Thank You UI
    return (
        <div className="min-h-screen bg-base-200 text-base-content flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-2xl">
                <div className="bg-base-100 rounded-2xl shadow-xl p-6 md:p-8">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold">
                                Thank you, {info.name || 'Visitor'}!
                            </h1>
                            <p className="opacity-70 mt-1">
                                You’re checked in{info.company ? <> for <span className="font-medium">{info.company}</span></> : ''}.
                            </p>
                        </div>
                        <span className="badge badge-ghost">Checked in</span>
                    </div>

                    {/* QR + Details */}
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-[200px,1fr] gap-6 items-center">
                        <div className="mx-auto">
                            <div className="bg-base-200 p-3 rounded-xl shadow-inner">
                                <QRCodeCanvas
                                    value={qrPayload}
                                    size={typeof window !== 'undefined' && window.innerWidth >= 768 ? 200 : 170}
                                    includeMargin
                                />
                            </div>
                            <p className="text-center text-sm opacity-70 mt-2">Your check-in QR</p>
                        </div>

                        <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-2 text-sm">
                                <div className="opacity-70">Name</div>
                                <div className="col-span-2">{info.name || '—'}</div>
                                <div className="opacity-70">Company</div>
                                <div className="col-span-2">{info.company || '—'}</div>
                                {info.email ? (
                                    <>
                                        <div className="opacity-70">Email</div>
                                        <div className="col-span-2">{info.email}</div>
                                    </>
                                ) : null}
                                {info.phone ? (
                                    <>
                                        <div className="opacity-70">Phone</div>
                                        <div className="col-span-2">{info.phone}</div>
                                    </>
                                ) : null}
                            </div>

                            <div className="flex flex-wrap gap-2 pt-2">
                                {vcardBlobUrl && (
                                    <a
                                        href={vcardBlobUrl}
                                        download={`vistamate-${(info.name || 'visitor').replace(/\s+/g, '-')}.vcf`}
                                        className="btn btn-outline btn-sm"
                                    >
                                        Download vCard
                                    </a>
                                )}
                                <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
                                    Print Badge
                                </button>
                                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>
                                    Done (Home)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Hint */}
                <p className="text-center text-sm opacity-60 mt-4">
                    Keep this page open to show your QR at security.
                </p>
            </div>
        </div>
    );
}
