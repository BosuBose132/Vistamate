// /imports/ui/pages/WelcomePage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

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
        <div className="navbar-end">
          <button
            type="button"
            aria-label="Toggle theme"
            onClick={() => {
              if (window.__toggleTheme) {
                window.__toggleTheme();
              } else {
                const DEFAULT = 'vistamate';
                const cur = document.documentElement.getAttribute('data-theme') || DEFAULT;
                const next = cur === DEFAULT ? 'dark' : DEFAULT;
                document.documentElement.setAttribute('data-theme', next);
                try { localStorage.setItem('daisy-theme', next); } catch { }
                console.log('Theme (fallback) ->', next);
              }
            }}
            className="btn absolute top-3 right-4"
          >
            <label class="toggle text-base-content">
              <input type="checkbox" value="synthwave" class="theme-controller" />

              <svg aria-label="sun" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g stroke-linejoin="round" stroke-linecap="round" stroke-width="2" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></g></svg>

              <svg aria-label="moon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g stroke-linejoin="round" stroke-linecap="round" stroke-width="2" fill="none" stroke="currentColor"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></g></svg>

            </label>
          </button>
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
