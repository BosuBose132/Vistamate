// WelcomePage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';



const WelcomePage = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-100 to-slate-300">
      {/* Header */}
      <header className="flex items-center justify-between px-4 md:px-12 py-4 bg-white/80 shadow-sm">
        <div className="flex items-center">
          <img src="../../logo.png" alt="Vistamate Logo" className="h-10 w-10 mr-3" />
          <span className="text-xl font-bold text-green-700">Vistamate</span>
        </div>
        <nav className="flex space-x-4">
          <button onClick={() => navigate('/')} className="text-slate-700 hover:text-green-600 font-medium transition">Home</button>
          <button onClick={() => navigate('/login')} className="text-slate-700 hover:text-green-600 font-medium transition">Admin Login</button>
          <button onClick={() => navigate('/about')} className="text-slate-700 hover:text-green-600 font-medium transition">About Us</button>
        </nav>
      </header>

      {/* Body */}
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <h1 className="text-4xl font-bold text-slate-800 mb-2 text-center">
          Welcome to <span className="text-green-600">Vistamate</span>
        </h1>
        <p className="text-lg text-slate-600 mb-6 text-center">
          Please check in to proceed
        </p>
        <button
          onClick={() => navigate('/checkin')}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3 rounded-xl shadow-md transition duration-200"
        >
          <button className="btn btn-accent" onClick={() => {
            Meteor.call('stations.getDefaultToken', (err, token) => {
              if (token) navigate(`/s/${token}`); else navigate('/checkin');
            });
          }}></button>
          Start Check-In
        </button>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-slate-500 text-sm bg-white/70">
        &copy; {new Date().getFullYear()} Vistamate. All rights reserved.
      </footer>
    </div>
  );
};


export default WelcomePage;