import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSubscribe, useFind } from 'meteor/react-meteor-data';
import { Stations } from '/imports/api/stations/stations.collection';
import { Surveys } from '/imports/api/surveys/surveys.collection';
import App from '../pages/App';

export default function StationKiosk() {
    const { token } = useParams();
    const sub = useSubscribe('stations.byToken', token)();
    const station = useFind(() => Stations.findOne({ token }), [token]);
    const survey = station?.surveyId
        ? useFind(() => Surveys.findOne(station.surveyId), [station?.surveyId])
        : null;

    useEffect(() => {
        if (station?.theme) document.documentElement.setAttribute('data-theme', station.theme);
        if (station?.name) document.title = `Vistamate • ${station.name}`;
    }, [station?.theme, station?.name]);

    if (sub) return <div className="p-8">Loading station…</div>;
    if (!station) return <div className="p-8">Station not found or disabled.</div>;

    return (
        <App
            stationId={station._id}
            kioskConfig={station}
            assignedSurveyJson={survey?.json}
        />
    );
}
