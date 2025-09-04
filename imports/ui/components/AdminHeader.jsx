import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Meteor } from 'meteor/meteor';
import ThemeToggle from '/imports/ui/components/ThemeToggle';

export default function AdminHeader() {
    const navigate = useNavigate();
    const onLogout = () => Meteor.logout(() => navigate('/login'));

    return (
        <div className="bg-base-100 shadow rounded-xl mb-6">
            {/* One straight line: relative + flex (no wrap), title absolutely centered */}
            <div className="relative flex items-center flex-nowrap h-14 px-3 sm:px-4">
                {/* LEFT: logo + links (scroll horizontally if crowded) */}
                <div className="flex items-center gap-2 whitespace-nowrap overflow-x-auto">
                    <a href="/" className="btn btn-ghost px-1" title="Go to Welcome">
                        <img src="/VistamateLogo.png" alt="Vistamate" className="h-36 w-auto" />
                    </a>
                    <NavLink
                        to="/admin/checkins"
                        className={({ isActive }) =>
                            `btn btn-sm ${isActive ? 'btn-primary' : 'btn-ghost'}`
                        }
                    >
                        Check-ins
                    </NavLink>
                    <NavLink
                        to="/admin/stations"
                        className={({ isActive }) =>
                            `btn btn-sm ${isActive ? 'btn-primary' : 'btn-ghost'}`
                        }
                    >
                        Stations
                    </NavLink>
                    <NavLink
                        to="/admin/surveys"
                        className={({ isActive }) =>
                            `btn btn-sm ${isActive ? 'btn-primary' : 'btn-ghost'}`
                        }
                    >
                        Surveys
                    </NavLink>

                </div>

                {/* CENTER: absolutely centered title (stays on the same line) */}
                <div className="absolute left-1/2 -translate-x-1/2 text-base sm:text-lg md:text-xl font-semibold pointer-events-none">
                    Vistamate Admin
                </div>

                {/* RIGHT: theme toggle + logout, pushed to far right */}
                <div className="flex items-center gap-2 ml-auto whitespace-nowrap">

                    <button className="btn btn-xs sm:btn-sm btn-outline" onClick={onLogout}>
                        Logout
                    </button>
                    <ThemeToggle />
                </div>
            </div>
        </div>
    );
}
