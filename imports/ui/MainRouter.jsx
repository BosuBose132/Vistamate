// imports/ui/MainRouter.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';

// Pages
import WelcomePage from './pages/WelcomePage';
import App from './pages/App';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';

const ProtectedRoute = ({ children }) => {
    const user = useTracker(() => Meteor.user());
    return user ? children : <Navigate to="/login" />;
};

const MainRouter = () => (
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<WelcomePage />} />
            <Route path="/checkin" element={<App />} />
            <Route path="/admin" element={
                <ProtectedRoute>
                    <AdminPage />
                </ProtectedRoute>
            } />
            <Route path="/login" element={<LoginPage />} />
        </Routes>
    </BrowserRouter>
);

export default MainRouter;
