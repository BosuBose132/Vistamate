/* eslint-disable-next-line unused-imports/no-unused-imports */
import React from 'react';
import { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useNavigate } from 'react-router-dom';
import { Card, Input, Button } from '@mieweb/ui';

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
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Card className="w-full max-w-sm p-8 shadow-md">
                <form onSubmit={handleLogin} className="space-y-4">
                    <h2 className="text-xl font-bold text-foreground">Admin Login</h2>
                    {error && <p className="text-destructive text-sm">{error}</p>}
                    <Input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <Input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <Button type="submit" variant="primary" className="w-full">
                        Login
                    </Button>
                </form>
            </Card>
        </div>
    );
};

export default Login;
