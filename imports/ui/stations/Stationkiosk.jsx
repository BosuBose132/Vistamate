/* eslint-disable-next-line no-unused-vars, unused-imports/no-unused-imports */
import React from 'react';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSubscribe, useFind } from 'meteor/react-meteor-data';

import { Stations } from '/imports/api/stations/stations.collection';
import { Surveys } from '/imports/api/surveys/surveys.collection';

export default function StationKiosk() {
    const { token } = useParams();
    const subStation = useSubscribe('stations.byToken', token)();
    const station = useFind(() => Stations.findOne({ token }), [token]);
    const surveyId = station?.surveyId
    const subSurvey = useSubscribe('surveys.byId', surveyId);
    const survey = useFind(
        () => (surveyId ? Surveys.findOne(surveyId) : undefined),
        [surveyId]
    );
    useEffect(() => {
        if (station?.theme) document.documentElement.setAttribute('data-theme', station.theme);
        if (station?.name) document.title = `Vistamate • ${station.name}`;
    }, [station?.theme, station?.name]);

    const stationReady = subStation();
    const surveyReady = !surveyId || subSurvey();

    if (!stationReady || !station) {
        return <div className="p-8">Loading station…</div>;
    }

    if (surveyId && (!surveyReady || !survey)) {
        return <div className="p-8">Loading survey…</div>;
    }
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