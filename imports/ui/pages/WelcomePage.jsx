import React from 'react';
// /imports/ui/pages/WelcomePage.jsx
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2,
  ClipboardCheck,
  FileText,
  IdCard,
  LayoutDashboard,
  ScanLine,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { Card, Badge } from '@mieweb/ui';

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
    icon: ScanLine,
    title: 'AI document detection',
    body: 'Recognize ID and business card frames from the check-in camera so the right capture flow starts quickly.',
    metric: 'ID + cards',
  },
  {
    icon: FileText,
    title: 'OCR autofill',
    body: 'Extract visitor details and prefill forms to reduce typing at the front desk or kiosk.',
    metric: 'Less manual entry',
  },
  {
    icon: UserCheck,
    title: 'Visitor check-in',
    body: 'Guide guests through a simple registration flow with the data needed for arrival tracking.',
    metric: 'Fast arrivals',
  },
  {
    icon: LayoutDashboard,
    title: 'Admin dashboard',
    body: 'Give staff a centralized view of stations, check-ins, surveys, and visitor operations.',
    metric: 'Operational view',
  },
  {
    icon: ShieldCheck,
    title: 'Secure visitor records',
    body: 'Keep visitor details organized for reception teams while maintaining a controlled admin experience.',
    metric: 'Managed access',
  },
  {
    icon: Building2,
    title: 'Station kiosk support',
    body: 'Create dedicated kiosk stations for lobbies, offices, events, and high-traffic entry points.',
    metric: 'Multi-station',
  },
];

const workflowSteps = [
  { icon: IdCard, label: 'Scan ID or business card' },
  { icon: ClipboardCheck, label: 'Review OCR-filled details' },
  { icon: UserCheck, label: 'Submit visitor check-in' },
  { icon: LayoutDashboard, label: 'Monitor activity by station' },
];

const WelcomePage = () => {
  return (
    <PublicLayout>
      <section className="relative overflow-hidden bg-background">
        <div className="relative mx-auto grid min-h-[calc(100vh-6rem)] w-full max-w-7xl items-center gap-12 px-4 pt-6 pb-16 sm:px-6 sm:pt-8 lg:grid-cols-[1.04fr_0.96fr] lg:px-8 lg:pb-20">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="max-w-3xl"
          >
            <motion.h1
              variants={fadeUp}
              className="max-w-4xl text-4xl font-semibold leading-tight tracking-normal text-foreground sm:text-5xl lg:text-6xl"
            >
              Visitor Management System
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground"
            >
              A smarter way to welcome visitors, verify details, and manage
              every check-in from one secure dashboard. From kiosk-based
              registration and ID/business card scanning to OCR-powered form
              autofill, station-based check-ins, visitor tracking, and admin
              monitoring, the system keeps every entry organized from arrival to
              checkout.
            </motion.p>
            <motion.div
              variants={fadeUp}
              className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <Link
                to="/checkin"
                className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Start Check-In
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-md border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
              >
                Admin Login
              </Link>
            </motion.div>
            <motion.div
              variants={fadeUp}
              className="mt-10 grid max-w-2xl grid-cols-3 gap-4 text-sm"
            >
              <div className="border-l-2 border-primary pl-4">
                <p className="font-semibold text-foreground">OCR autofill</p>
                <p className="mt-1 text-muted-foreground">Reduce entry time</p>
              </div>
              <div className="border-l-2 border-primary pl-4">
                <p className="font-semibold text-foreground">Kiosk-ready</p>
                <p className="mt-1 text-muted-foreground">Station check-ins</p>
              </div>
              <div className="border-l-2 border-primary pl-4">
                <p className="font-semibold text-foreground">Admin control</p>
                <p className="mt-1 text-muted-foreground">Live operations</p>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.38, ease: 'easeOut', delay: 0.12 }}
            className="relative"
          >
            <Card className="vm-card overflow-hidden rounded-2xl p-2">
              <div className="relative overflow-hidden rounded-xl">
                <img
                  src="/homePage.png"
                  alt="Visitor presenting an ID card to a check-in kiosk in a modern lobby"
                  className="aspect-[16/9] w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent" />
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      <section
        id="platform"
        className="bg-muted/30 px-4 py-10 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-7 max-w-3xl">
            <p className="text-sm font-semibold uppercase text-primary">
              Platform
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-foreground sm:text-4xl">
              Built for controlled, high-volume reception workflows.
            </h2>
          </div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
          >
            {platformCards.map((card) => {
              const Icon = card.icon;
              return (
                <motion.div variants={fadeUp} key={card.title}>
                  <Card className="vm-card rounded-lg p-5">
                    <div className="mb-5 flex items-center justify-between gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" strokeWidth={1.8} />
                      </div>
                      <Badge className="rounded-md px-3 py-1 text-xs font-semibold">
                        {card.metric}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {card.title}
                    </h3>
                    <p className="mt-3 leading-7 text-muted-foreground">
                      {card.body}
                    </p>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      <section
        id="workflow"
        className="border-y border-border bg-background px-4 py-10 sm:px-6 lg:px-8"
      >
        <div className="mx-auto grid max-w-7xl gap-7 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase text-primary">
              Workflow
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-foreground sm:text-4xl">
              From document capture to dashboard visibility.
            </h2>
            <p className="mt-4 max-w-2xl leading-8 text-muted-foreground">
              Vistamate supports self-service station kiosks and front-desk
              assisted check-ins while preserving a consistent experience for
              administrators.
            </p>
          </div>

          <div className="grid gap-3">
            {workflowSteps.map((step, index) => {
              const StepIcon = step.icon;
              return (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{
                    duration: 0.24,
                    ease: 'easeOut',
                    delay: index * 0.05,
                  }}
                  className="rounded-lg border border-border bg-card p-4"
                >
                  <div className="flex items-center gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                      <StepIcon className="h-5 w-5" strokeWidth={1.8} />
                    </span>
                    <span className="font-medium text-foreground">
                      {step.label}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-muted/30 px-4 py-10 sm:px-6 lg:px-8">
        <Card className="vm-card mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 rounded-lg p-6 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase text-primary">
              Ready for the next arrival
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              Start a check-in or open the admin dashboard.
            </h2>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              to="/checkin"
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Start Check-In
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-md border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Admin Login
            </Link>
          </div>
        </Card>
      </section>
    </PublicLayout>
  );
};

export default WelcomePage;
