# survey-checkIn-app ( https://vistamate.opensource.mieweb.org/)  

A smart, modern visitor management system with **automatic camera capture**, **OCR extraction**, and **dynamic forms**.

---

## Features

- Camera-based ID card capture
- Auto-capture with steady hold detection (red/orange/green border feedback)
- OpenAI Vision integration for OCR
- Dynamic SurveyJS forms generated from OCR results
- MongoDB Atlas storage for visitor records
- Custom NPM package for validation, duplicate checking, and schema support
- Clean, responsive UI with Bootstrap

---

## ✅ How It Works

- **Visitor arrives** and shows their ID card to the camera.  
- **Camera live preview** detects steadiness:
   - Red border → movement
   - Orange border → 3-second hold countdown
   - Green border → auto-captures
- **OpenAI Vision OCR** extracts structured data (name, company, email, phone, address, dob).  
- **SurveyJS form** is auto-generated with the extracted fields pre-filled.  
- **Visitor reviews** and submits the form.  
- **Data stored** in MongoDB with duplicate prevention and validation using a custom NPM package.

---

## ✅ Tech Stack

- Meteor.js (Node.js + MongoDB framework)  
- React  
- SurveyJS (dynamic forms)  
- OpenAI Vision OCR API  
- MongoDB Atlas  
- Bootstrap for responsive UI  
- Custom NPM package ('visitor-npm-app') for validation

---

## Setup

## Clone this repo

# bash
git clone https://github.com/BosuBose132/survey-checkIn-app
cd survey-checkIn-app

---

# Install Dependencies

meteor npm install

### SurveyJS Integration

This project uses [SurveyJS](https://surveyjs.io/) for dynamic visitor registration forms.

Install:

# bash

meteor npm install survey-core survey-react-ui

# link npm package

npm install visitor-npm-app

# Add your Meteor Settings

create settings.json

{
  "openai": {
    "apiKey": "YOUR_OPENAI_API_KEY"
  },
  "ozwell": {
    "apiKey": "",
    "secretKey": ""
  }
}

# Start the app

meteor --settings settings.json

# Configuration

OpenAI API: Make sure you have your service account JSON or API key properly set in your settings.




