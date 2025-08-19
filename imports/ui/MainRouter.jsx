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
import StationKiosk from './station/StationKiosk';
import StationBuilder from './admin/stations/StationBuilder';
import SurveyManager from './admin/surveys/SurveyManager';
import StationDashboard from './admin/dashboard/StationDashboard';

const ProtectedRoute = ({ children }) => {
    const user = useTracker(() => Meteor.user());
    return user ? children : <Navigate to="/login" />;
};

const MainRouter = () => (
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<WelcomePage />} />
            <Route path="/checkin" element={<App />} />
            <Route path="/s/:token" element={<StationKiosk />} />
            <Route path="/admin" element={
                <ProtectedRoute>
                    <Admin />
                </ProtectedRoute>
            } />
            <Route path="/admin/stations" element={
                <ProtectedRoute>
                    <StationBuilder />
                </ProtectedRoute>
            } />
            <Route path="/admin/surveys" element={
                <ProtectedRoute>
                    <SurveyManager />
                </ProtectedRoute>
            } />
            <Route path="/admin/checkins" element={
                <ProtectedRoute>
                    <StationDashboard />
                </ProtectedRoute>
            } />
            <Route path="/login" element={<Login />} />
            <Route path="/thankyou" element={<ThankYou />} />
        </Routes>
    </BrowserRouter>
);

export default MainRouter;
