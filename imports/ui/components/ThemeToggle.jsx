import React, { useEffect, useState } from 'react';

function ThemeToggle({ className = '' }) {
    const getIsDark = () =>
        (localStorage.getItem('daisy-theme') ||
            document.documentElement.getAttribute('data-theme') ||
            'vistamate') === 'dark';

    const [isDark, setIsDark] = useState(getIsDark);

    // stay in sync if something else flips the theme
    useEffect(() => {
        const obs = new MutationObserver(() => {
            setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
        });
        obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        return () => obs.disconnect();
    }, []);

    const onChange = (e) => {
        const next = e.target.checked ? 'dark' : 'vistamate'; // your two themes
        document.documentElement.setAttribute('data-theme', next);
        try { localStorage.setItem('daisy-theme', next); } catch { }
        setIsDark(next === 'dark');
    };

    return (
        <label className={`swap swap-rotate cursor-pointer ${className}`}>
            {/* hide the native checkbox so no tick appears */}
            <input type="checkbox" className="hidden" checked={isDark} onChange={onChange} />

            {/* Sun icon (shows when DARK so user can go to light) */}
            <svg aria-label="sun" className="swap-on h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <g strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                </g>
            </svg>

            {/* Moon icon (shows when LIGHT so user can go to dark) */}
            <svg aria-label="moon" className="swap-off h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <g strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" fill="none" stroke="currentColor">
                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                </g>
            </svg>
        </label>
    );
}

export default ThemeToggle;
