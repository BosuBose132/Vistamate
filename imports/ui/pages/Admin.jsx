// /imports/ui/pages/AdminPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const Admin = () => {
    return (
        <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-white transition-colors duration-300 px-4 py-6">
            {/* Header */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
                <nav className="flex gap-2">
                    <Link className="btn btn-sm" to="/admin/stations">Stations</Link>
                    <Link className="btn btn-sm" to="/admin/surveys">Surveys</Link>
                    <Link className="btn btn-sm" to="/admin/checkins">Check-ins</Link>
                </nav>
                <button
                    className="bg-slate-700 text-white px-4 py-2 rounded hover:bg-slate-600 transition"
                    onClick={() => document.documentElement.classList.toggle('dark')}
                >
                    Toggle Dark Mode
                </button>
            </header>

            {/* Overview Cards Section */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                <div className="bg-slate-100 dark:bg-slate-800 p-5 rounded-xl shadow hover:shadow-lg transition duration-200">
                    <h2 className="text-lg font-semibold">Today's Check-ins</h2>
                    <p className="text-3xl mt-2 font-bold">18</p>
                </div>

                <div className="bg-slate-100 dark:bg-slate-800 p-5 rounded-xl shadow hover:shadow-lg transition duration-200">
                    <h2 className="text-lg font-semibold">Currently In-Building</h2>
                    <p className="text-3xl mt-2 font-bold">6</p>
                </div>

                <div className="bg-slate-100 dark:bg-slate-800 p-5 rounded-xl shadow hover:shadow-lg transition duration-200">
                    <h2 className="text-lg font-semibold">Avg. Visit Duration</h2>
                    <p className="text-3xl mt-2 font-bold">32 min</p>
                </div>
            </section>

            {/* Placeholder for Station/Survey Management */}
            <section className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg shadow-inner">
                <h2 className="text-xl font-bold mb-4">Manage Stations & Surveys</h2>
                <p className="text-slate-600 dark:text-slate-300">
                    This section will allow admins to add stations, paste Survey JSON, and view check-ins.
                </p>
            </section>
        </div >
    );
};

export default Admin;
