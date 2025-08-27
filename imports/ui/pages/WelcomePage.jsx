// /imports/ui/pages/WelcomePage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

const WelcomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-base-200 text-base-content">
      {/* NAVBAR */}
      <div className="navbar bg-base-100 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="navbar-start">
            <Link to="/" className="inline-flex items-center">
              <img
                src="/VistamateLogo.png"
                alt="Vistamate"
                className="h-44 w-auto mr-2"
              />
            </Link>
          </div>
          <div className="navbar-center hidden md:flex">
            <ul className="menu menu-horizontal px-1">
              <li><button className="btn btn-ghost" onClick={() => navigate('/')}>Home</button></li>
              <li><button className="btn btn-ghost" onClick={() => navigate('/login')}>Admin Login</button></li>
              <li><button className="btn btn-ghost" onClick={() => navigate('/about')}>About</button></li>
            </ul>

          </div>

        </div>
        <div className="absolute top-3 right-4">
          <ThemeToggle className="ml-2" />
        </div>
      </div>


      {/* HERO */}
      <main className="container mx-auto px-4 flex-1 flex items-center">
        <div className="w-full grid lg:grid-cols-2 gap-8 py-12">
          <div className="space-y-5">
            <h1 className="text-4xl md:text-5xl font-extrabold">
              Welcome to <span className="text-primary">Vistamate</span>
            </h1>
            <p className="opacity-80 text-lg">
              Smart, camera‑powered visitor check‑in with OCR and dynamic forms.
            </p>
            <div className="flex gap-3">
              <button className="btn btn-accent" onClick={() => navigate('/checkin')}>
                Start Check‑In
              </button>
              <button className="btn btn-outline" onClick={() => navigate('/login')}>
                Admin Login
              </button>
            </div>
          </div>

          {/* Demo card shows theme surfaces changing */}

        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-base-100">
        <div className="container mx-auto px-4 py-6 text-sm opacity-80">
          © {new Date().getFullYear()} Vistamate. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default WelcomePage;
