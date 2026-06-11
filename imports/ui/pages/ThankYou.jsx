/* eslint-disable-next-line unused-imports/no-unused-imports */
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Meteor } from 'meteor/meteor';
import { motion } from 'framer-motion';
// /imports/ui/pages/ThankYou.jsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { buildVCard } from '/imports/ui/utils/vcard';
import { Check } from 'lucide-react';
import { Badge, Button, Card } from '@mieweb/ui';

import PublicLayout from '../components/PublicLayout';

export default function ThankYou() {
  const navigate = useNavigate();
  const { state } = useLocation(); // data passed via navigate('/thankyou', { state })
  const [info, setInfo] = useState(null);
  //const [seconds, setSeconds] = useState(8); // auto-return countdown (seconds)

  // Load visitor summary (prefer router state, then sessionStorage)
  useEffect(() => {
    if (state && typeof state === 'object') {
      setInfo(state);
      try {
        sessionStorage.setItem('vistamate:lastCheckin', JSON.stringify(state));
      } catch {
        // ignore storage errors (private mode, quota exceeded, etc.)
      }
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

  // Build vCard text for QR + a Blob URL for direct download
  const vcardText = useMemo(() => {
    if (!info) return '';
    return buildVCard({
      name: info.name || '',
      company: info.company || '',
      email: info.email || '',
      phone: info.phone || '',
    });
  }, [info]);

  const vcardDownloadUrl = useMemo(() => {
    if (!vcardText) return '';
    const blob = new Blob([vcardText], { type: 'text/vcard;charset=utf-8' });
    return URL.createObjectURL(blob);
  }, [vcardText]);

  // Fallback UI if no data was found
  if (!info) {
    return (
      <PublicLayout>
        <section className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-muted px-4 py-10 text-foreground sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="w-full max-w-md"
          >
            <Card className="rounded-2xl p-6 text-center shadow-xl">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10 text-success">
                <Check
                  aria-hidden="true"
                  className="h-7 w-7"
                  strokeWidth={2.4}
                />
              </div>
              <h1 className="text-2xl font-semibold">Check-in complete</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Details are no longer available on this device.
              </p>
              <Button
                variant="primary"
                className="mt-6 rounded-md"
                onClick={() => navigate('/')}
              >
                Back to Home
              </Button>
            </Card>
          </motion.div>
        </section>
      </PublicLayout>
    );
  }

  // Main Thank You UI
  return (
    <PublicLayout>
      <section className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-muted px-4 py-10 text-foreground sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.32, ease: 'easeOut' }}
          className="w-full max-w-4xl"
        >
          <Card className="vm-card overflow-hidden rounded-2xl shadow-xl">
            <div className="border-b border-border px-5 py-5 sm:px-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-success/10 text-success">
                    <Check
                      aria-hidden="true"
                      className="h-7 w-7"
                      strokeWidth={2.4}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase text-success">
                      Checked in
                    </p>
                    <h1 className="text-3xl font-semibold">
                      Check-in complete
                    </h1>
                  </div>
                </div>
                <Badge variant="success">Complete</Badge>
              </div>
            </div>

            <div className="grid gap-0 lg:grid-cols-[minmax(0,0.95fr)_minmax(240px,0.65fr)]">
              <div className="p-5 sm:p-7">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-muted p-4">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      Visitor
                    </p>
                    <p className="mt-2 text-xl font-semibold">
                      {info.name || 'Visitor'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-muted p-4">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      Company
                    </p>
                    <p className="mt-2 text-xl font-semibold">
                      {info.company || '—'}
                    </p>
                  </div>
                </div>

                {(info.email || info.phone) && (
                  <div className="mt-4 grid gap-3 rounded-2xl border border-border bg-card p-4 text-sm sm:grid-cols-2">
                    {info.email ? (
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">
                          Email
                        </p>
                        <p className="mt-1 break-words font-medium">
                          {info.email}
                        </p>
                      </div>
                    ) : null}
                    {info.phone ? (
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">
                          Phone
                        </p>
                        <p className="mt-1 font-medium">{info.phone}</p>
                      </div>
                    ) : null}
                  </div>
                )}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  {vcardDownloadUrl && (
                    <a
                      href={vcardDownloadUrl}
                      download={`${(info.name || 'visitor').replace(/\s+/g, '_')}.vcf`}
                      className="inline-flex items-center justify-center rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      Download vCard
                    </a>
                  )}
                  <Button
                    variant="primary"
                    className="rounded-md"
                    onClick={() => window.print()}
                  >
                    Print
                  </Button>
                  <Button
                    variant="ghost"
                    className="rounded-md"
                    onClick={() => navigate('/')}
                  >
                    Done
                  </Button>
                </div>
              </div>

              <div className="border-t border-border bg-muted p-5 sm:p-7 lg:border-l lg:border-t-0">
                <div className="mx-auto max-w-xs rounded-2xl border border-border bg-card p-4 shadow-inner">
                  <QRCodeSVG
                    value={vcardText || ' '}
                    size={
                      typeof window !== 'undefined' && window.innerWidth >= 768
                        ? 220
                        : 180
                    }
                    includeMargin
                    className="h-auto w-full"
                  />
                </div>
                <p className="mt-3 text-center text-sm font-medium text-muted-foreground">
                  Check-in QR
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </section>
    </PublicLayout>
  );
}
