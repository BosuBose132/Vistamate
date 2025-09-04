# Vistamate — Smart Visitor Check-in & Admin Suite

Vistamate is a **Meteor + React visitor management system** that makes visitor check-ins fast, smart, and secure.  
It uses **AI OCR (OpenAI)**, **SurveyJS forms**, and **DaisyUI theming** to deliver a smooth visitor experience while giving admins real-time dashboards, kiosk management, and survey customization.

---

## ✨ Features

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

## 🛠 Tech Stack

- **Meteor 3** (backend + pub/sub reactivity)
- **React 18** (UI)
- **MongoDB** (data storage)
- **SurveyJS** (dynamic forms)
- **TailwindCSS + DaisyUI** (styling & theming)
- **Framer Motion** (animations)
- **OpenAI GPT-4o** (OCR + structured autofill)
- **alanning:roles** (role-based access control)

---

## 🚀 Getting Started

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

Built with Meteor, React, Tailwind, SurveyJS, DaisyUI, Framer Motion

AI OCR powered by OpenAI GPT-4o


---

⚡ Would you like me to also make a **shorter “visitor-facing README”** (only showing the check-in experience, no dev setup) that you can display on your **Welcome page** for first-time users?

