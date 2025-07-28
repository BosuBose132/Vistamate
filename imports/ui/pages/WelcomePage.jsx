// WelcomePage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';


const WelcomePage = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-gradient-to-br from-slate-100 to-slate-300">
      {/* Logo
      <img src={logo} alt="Vistamate Logo" className="w-28 mb-6" /> */}

      {/* Headline */}
      <h1 className="text-4xl font-bold text-slate-800 mb-2 text-center">
        Welcome to <span className="text-green-600">Vistamate</span>
      </h1>

      {/* Subheading */}
      <p className="text-lg text-slate-600 mb-6 text-center">
        Please check in to proceed
      </p>

      {/* Start Button */}
      <button
        onClick={() => navigate('/checkin')}
        className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3 rounded-xl shadow-md transition duration-200"
      >
        Start Check-In
      </button>
    </div>
  );
};


export default WelcomePage;