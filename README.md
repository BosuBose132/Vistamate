# Vistamate — Smart Visitor Check-in & Admin Suite

<p align="center">
  <img src="public/VistaMate.png" alt="Vistamate Logo" width="200" />
</p>

<p align="center">
  <b>Fast, smart, and secure visitor management with AI OCR, kiosk check-ins, and real-time dashboards.</b>
</p>

---

![Meteor](https://img.shields.io/badge/Meteor-3.0-orange?logo=meteor&logoColor=white)
![React](https://img.shields.io/badge/React-18-blue?logo=react)
![MongoDB](https://img.shields.io/badge/MongoDB-green?logo=mongodb)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-38B2AC?logo=tailwind-css&logoColor=white)
![DaisyUI](https://img.shields.io/badge/DaisyUI-themed-5A0EF8)
![SurveyJS](https://img.shields.io/badge/SurveyJS-dynamic-blueviolet)
![Framer Motion](https://img.shields.io/badge/Framer%20Motion-animations-ff69b4)
![OpenAI OCR](https://img.shields.io/badge/OpenAI-GPT--4o-412991?logo=openai)

---
---

## Features

### Visitor Flow (Kiosk)
- **Camera-based auto-capture**: Detects ID or business cards and captures automatically.
- **AI OCR (OpenAI GPT-4o)**: Extracts visitor details (name, email, phone, company, etc.).
- **Auto-filled SurveyJS form**: Visitors review/edit details before submitting.
- **Thank You page**:
  - Shows personalized message
  - Generates **QR code** (verify URL)
  - Download **vCard** or **Print Badge**
  - Clean DaisyUI design with animations

### Admin Dashboard
- **KPIs**: Today’s Visitors, Currently in Building, Avg Visit Duration
- **Live table**: Reactive updates via Meteor pub/sub
- **Scope filter**:
  - **All**
  - **Global** (admin manual check-ins)
  - **Per-station** (e.g., Lobby, Front Desk)
- **Admin Quick Check-in**: Staff can add visitors manually (Global scope)
- **Real-time updates** with no page refresh needed

### Stations (Kiosks)
- Create/manage kiosks in the **Stations tab**
- Each kiosk has a unique **UUID token** → `/s/:token` URL
- Configurable theme, welcome message, camera/mobile behavior
- Assign a survey to each station
- Enable/disable or rotate token (instant revocation)

### Surveys
- Manage **SurveyJS JSON forms** in the **Surveys tab**
- Assign surveys to stations
- Fully themed with DaisyUI for consistent dark/light mode
- Borderless, responsive design across devices

### Theming & UX
- **Dark/Light mode toggle** across all pages
- Consistent DaisyUI theme (`vistamate`)
- **Professional navbar** with logo left, nav links right, ThemeToggle aligned
- **Animations (Framer Motion)**:
  - Page transitions (fade/slide)
  - Camera capture flash + processing overlay
  - Survey form slide-in
  - KPI scale-in + number count-up
  - Table rows stagger into view
  - Thank You card + QR reveal

---

## Tech Stack

- **Meteor 3** (backend + pub/sub reactivity)
- **React 18** (UI)
- **MongoDB** (data storage)
- **SurveyJS** (dynamic forms)
- **TailwindCSS + DaisyUI** (styling & theming)
- **Framer Motion** (animations)
- **OpenAI GPT-4o** (OCR + structured autofill)
- **alanning:roles** (role-based access control)

---

## Getting Started

### Prerequisites
- Node.js + npm
- Meteor 3
- MongoDB (bundled with Meteor for dev)

### Install dependencies
```bash
meteor npm install

----

Configure API keys

Create a settings.json in the project root:

{
  "openai": { "apiKey": "sk-xxxx" },
  "admin": { "email": "admin@example.com", "password": "StrongPass123!" }
}

Code Quality
npm run lint

Run the app
meteor --settings settings.json

---

Authentication & Roles

Admin accounts are seeded from settings.json

Role system via alanning:roles

Admin-only routes & pubs:

/admin, /admin/stations, /admin/surveys, /admin/checkins

stations.admin, visitors.adminToday, surveys.admin

----

Project Structure

vistamate/
├── imports/
│   ├── api/          # Meteor collections, methods, publications
│   ├── ui/           # React components & pages
│   └── startup/      # Server/client startup scripts
├── public/           # Static assets
├── client/           # Meteor client entry
├── server/           # Meteor server entry
├── package.json
├── tailwind.config.js
└── README.md

----

Usage Flow

Admin creates a station “Lobby” in the Stations tab.
→ Gets a kiosk URL like /s/uuid-token.

Visitor opens the kiosk:

Camera captures ID/business card

OpenAI OCR extracts details

Form is prefilled and submitted

Thank You page shows QR + vCard

Admin Dashboard instantly updates:

Visitor appears under Lobby

KPIs auto-update

Security can scan QR to verify entry

Admins can also add manual visitors under Global

---

## ✅ CI / GitHub Actions

This repo uses GitHub Actions to keep code quality high:

- **ESLint** – Lints JS/JSX on every PR and push to `develop`/`main`.
- **CodeQL** – GitHub’s static analysis for JavaScript security.
- **Test Build (Meteor)** – Installs Meteor and runs a lightweight build to catch breaking changes early.

### Status
- Lint: ![lint](https://github.com/BosuBose132/Vistamate/blob/develop/eslint.config.cjs/badge.svg)
- CodeQL: ![codeql](https://github.com/BosuBose132/Vistamate/blob/develop/.github/workflows/codeql.yml/badge.svg)
- Build: ![build](https://github.com/BosuBose132/Vistamate/blob/develop/.github/workflows/test-build.yml/badge.svg)

---

Built with Meteor, React, Tailwind, SurveyJS, DaisyUI, Framer Motion

AI OCR powered by OpenAI GPT-4o


---



