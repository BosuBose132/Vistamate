import React from 'react';
// /imports/ui/pages/WelcomePage.jsx
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import PublicLayout from '../components/PublicLayout';

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const platformCards = [
  {
    title: 'AI document detection',
    body: 'Recognize ID and business card frames from the check-in camera so the right capture flow starts quickly.',
    metric: 'ID + cards',
  },
  {
    title: 'OCR autofill',
    body: 'Extract visitor details and prefill forms to reduce typing at the front desk or kiosk.',
    metric: 'Less manual entry',
  },
  {
    title: 'Visitor check-in',
    body: 'Guide guests through a simple registration flow with the data needed for arrival tracking.',
    metric: 'Fast arrivals',
  },
  {
    title: 'Admin dashboard',
    body: 'Give staff a centralized view of stations, check-ins, surveys, and visitor operations.',
    metric: 'Operational view',
  },
];

const workflowSteps = [
  'Scan ID or business card',
  'Review OCR-filled details',
  'Submit visitor check-in',
  'Monitor activity by station',
];

const WelcomePage = () => {
  return (
    <PublicLayout>
      <section className="relative overflow-hidden border-b border-base-300/80 bg-base-100">
        <div className="absolute inset-x-0 top-0 h-32 bg-primary/5" />
        <div className="relative mx-auto grid min-h-[calc(100vh-8rem)] w-full max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.04fr_0.96fr] lg:px-8 lg:py-20">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="max-w-3xl"
          >
            <motion.div
              variants={fadeUp}
              className="badge badge-outline badge-lg mb-5 rounded-md border-primary/35 bg-primary/5 px-3 text-primary"
            >
              AI-powered visitor operations
            </motion.div>
            <motion.h1
              variants={fadeUp}
              className="max-w-4xl text-4xl font-semibold leading-tight tracking-normal text-base-content sm:text-5xl lg:text-6xl"
            >
              A faster, smarter way to manage every visitor arrival.
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="mt-6 max-w-2xl text-lg leading-8 text-base-content/70"
            >
              Vistamate combines AI ID and business card detection, OCR autofill,
              station kiosks, visitor check-in, and an admin dashboard into one
              polished front-desk workflow.
            </motion.p>
            <motion.div
              variants={fadeUp}
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <Link to="/checkin" className="btn btn-primary rounded-md">
                Check In
              </Link>
              <Link to="/login" className="btn btn-outline rounded-md">
                Admin Login
              </Link>
            </motion.div>
            <motion.div
              variants={fadeUp}
              className="mt-10 grid max-w-2xl grid-cols-3 gap-3 text-sm"
            >
              <div className="border-l-2 border-primary pl-3">
                <p className="font-semibold">OCR autofill</p>
                <p className="text-base-content/60">Reduce entry time</p>
              </div>
              <div className="border-l-2 border-info pl-3">
                <p className="font-semibold">Kiosk-ready</p>
                <p className="text-base-content/60">Station check-ins</p>
              </div>
              <div className="border-l-2 border-warning pl-3">
                <p className="font-semibold">Admin control</p>
                <p className="text-base-content/60">Live operations</p>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.38, ease: 'easeOut', delay: 0.12 }}
            className="relative"
          >
            <div className="rounded-lg border border-base-300 bg-base-200 p-3 shadow-2xl">
              <div className="rounded-md border border-base-300 bg-base-100">
                <div className="flex items-center justify-between border-b border-base-300 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-error" />
                    <span className="h-2.5 w-2.5 rounded-full bg-warning" />
                    <span className="h-2.5 w-2.5 rounded-full bg-success" />
                  </div>
                  <span className="text-xs font-medium text-base-content/50">
                    Station kiosk
                  </span>
                </div>

                <div className="grid gap-0 md:grid-cols-[0.9fr_1.1fr]">
                  <div className="border-b border-base-300 p-5 md:border-b-0 md:border-r">
                    <div className="flex aspect-[4/3] items-center justify-center rounded-md border border-dashed border-primary/35 bg-primary/5">
                      <div className="w-4/5 rounded-md border border-primary/30 bg-base-100 p-4 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                          <span className="h-8 w-12 rounded bg-primary/20" />
                          <span className="badge badge-primary rounded-md">
                            AI detected
                          </span>
                        </div>
                        <div className="space-y-2">
                          <span className="block h-2.5 w-3/4 rounded bg-base-content/20" />
                          <span className="block h-2.5 w-1/2 rounded bg-base-content/10" />
                          <span className="block h-2.5 w-2/3 rounded bg-base-content/10" />
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-md border border-base-300 bg-base-100 p-3">
                        <p className="text-xs text-base-content/60">Capture</p>
                        <p className="font-semibold">Business card</p>
                      </div>
                      <div className="rounded-md border border-base-300 bg-base-100 p-3">
                        <p className="text-xs text-base-content/60">Status</p>
                        <p className="font-semibold text-success">Ready</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="mb-5 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-base-content">
                          Visitor profile
                        </p>
                        <p className="text-xs text-base-content/60">
                          OCR fields queued for review
                        </p>
                      </div>
                      <div className="badge badge-outline rounded-md">
                        Autofill
                      </div>
                    </div>
                    <div className="space-y-3">
                      {['Full name', 'Company', 'Email', 'Host'].map(
                        (label, index) => (
                          <div key={label}>
                            <div className="mb-1 flex items-center justify-between text-xs">
                              <span className="font-medium text-base-content/60">
                                {label}
                              </span>
                              <span className="text-success">
                                {index < 3 ? 'Detected' : 'Required'}
                              </span>
                            </div>
                            <div className="h-10 rounded-md border border-base-300 bg-base-200" />
                          </div>
                        ),
                      )}
                    </div>
                    <div className="mt-5 rounded-md bg-neutral p-4 text-neutral-content">
                      <div className="flex items-center justify-between text-sm">
                        <span>Today&apos;s station check-ins</span>
                        <span className="font-semibold">128</span>
                      </div>
                      <progress
                        className="progress progress-primary mt-3"
                        value="72"
                        max="100"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="platform" className="bg-base-200 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-3xl">
            <p className="text-sm font-semibold uppercase text-primary">
              Platform
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-base-content sm:text-4xl">
              Built for controlled, high-volume reception workflows.
            </h2>
          </div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
          >
            {platformCards.map((card) => (
              <motion.article
                variants={fadeUp}
                key={card.title}
                className="rounded-lg border border-base-300 bg-base-100 p-5 shadow-sm"
              >
                <div className="mb-5 inline-flex rounded-md bg-base-200 px-3 py-2 text-xs font-semibold text-primary">
                  {card.metric}
                </div>
                <h3 className="text-lg font-semibold">{card.title}</h3>
                <p className="mt-3 leading-7 text-base-content/70">
                  {card.body}
                </p>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      <section
        id="workflow"
        className="border-y border-base-300/80 bg-base-100 px-4 py-16 sm:px-6 lg:px-8"
      >
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase text-primary">
              Workflow
            </p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
              From document capture to dashboard visibility.
            </h2>
            <p className="mt-5 max-w-2xl leading-8 text-base-content/70">
              Vistamate supports self-service station kiosks and front-desk
              assisted check-ins while preserving a consistent experience for
              administrators.
            </p>
          </div>

          <div className="grid gap-3">
            {workflowSteps.map((step, index) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{
                  duration: 0.24,
                  ease: 'easeOut',
                  delay: index * 0.05,
                }}
                className="flex items-center gap-4 rounded-lg border border-base-300 bg-base-200 p-4"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-content">
                  {index + 1}
                </span>
                <span className="font-medium">{step}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-base-200 px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 rounded-lg border border-base-300 bg-base-100 p-6 shadow-sm md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase text-primary">
              Ready for the next arrival
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              Start a check-in or open the admin dashboard.
            </h2>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link to="/checkin" className="btn btn-primary rounded-md">
              Check In
            </Link>
            <Link to="/login" className="btn btn-outline rounded-md">
              Admin Login
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default WelcomePage;
