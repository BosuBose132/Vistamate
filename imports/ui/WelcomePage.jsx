// WelcomePage.js
import React from 'react';
import ThemeToggle from './ThemeToggle';
import logo from './logo.png'; // Place your logo in src/

const WelcomePage = ({ onStart }) => (
  <div className="d-flex flex-column justify-content-center align-items-center vh-100 position-relative" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)' }}>
    <ThemeToggle />
    <img src={logo} alt="Company Logo" style={{ width: 120, marginBottom: 24 }} />
    <h1 className="mb-2 fw-bold">Welcome to [Company Name]</h1>
    <p className="mb-4 fs-5">Please check in to proceed</p>
    <button className="btn btn-primary btn-lg px-5" onClick={onStart}>Start Check-In</button>
  </div>
);

export default WelcomePage;