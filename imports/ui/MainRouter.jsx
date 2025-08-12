// imports/ui/MainRouter.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';

// Pages
import WelcomePage from './pages/WelcomePage';
import App from './pages/App';
import Admin from './pages/Admin';
import Login from './pages/Login';
import ThankYou from './pages/ThankYou';

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
                    <Admin />
                </ProtectedRoute>
            } />
            <Route path="/login" element={<Login />} />
            <Route path="/thankyou" element={<ThankYou />} />
        </Routes>
    </BrowserRouter>
);

export default MainRouter;
