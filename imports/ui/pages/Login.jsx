import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        Meteor.loginWithPassword(email, password, (err) => {
            if (err) {
                setError(err.reason || 'Login failed');
            } else {
                navigate('/admin');
            }
        });
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900">
            <form onSubmit={handleLogin} className="bg-white dark:bg-slate-800 p-8 rounded shadow-md w-full max-w-sm space-y-4">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Admin Login</h2>
                {error && <p className="text-red-500 text-sm">{error}</p>}

                <input
                    type="email"
                    className="w-full p-2 rounded border dark:bg-slate-700 dark:text-white"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    className="w-full p-2 rounded border dark:bg-slate-700 dark:text-white"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white w-full py-2 rounded"
                >
                    Login
                </button>
            </form>
        </div>
    );
};

export default Login;
