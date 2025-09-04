import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSubscribe, useFind } from 'meteor/react-meteor-data';
import { Stations } from '/imports/api/stations/stations.collection';
import { Surveys } from '/imports/api/surveys/surveys.collection';
import App from '../pages/App';

export default function StationKiosk() {
    const { token } = useParams();
    const subStation = useSubscribe('stations.byToken', token)();
    const station = useFind(() => Stations.findOne({ token }), [token]);
    const subSurvey = station?.surveyId ? useSubscribe('surveys.byId', station.surveyId)() : false;
    const survey = station?.surveyId
        ? useFind(() => Surveys.findOne(station.surveyId), [station?.surveyId])
        : null;

    useEffect(() => {
        if (station?.theme) document.documentElement.setAttribute('data-theme', station.theme);
        if (station?.name) document.title = `Vistamate • ${station.name}`;
    }, [station?.theme, station?.name]);

    if (subStation || (station?.surveyId && subSurvey)) return <div className="p-8">Loading station…</div>;
    if (!station) return <div className="p-8">Station not found or disabled.</div>;

    // Survey JSON can be stored as object or string; normalize to object
    let assignedSurveyJson = null;
    if (survey?.json) {
        assignedSurveyJson = typeof survey.json === 'string' ? safeParseJSON(survey.json) : survey.json;
    }

    return (
        <App
            stationId={station._id}
            kioskConfig={station}
            assignedSurveyJson={assignedSurveyJson}
        />
    );
}
function safeParseJSON(s) {
    try { return JSON.parse(s); } catch { return null; }
}