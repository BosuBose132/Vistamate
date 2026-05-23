/* eslint-disable-next-line unused-imports/no-unused-imports */
import React, { useEffect, useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useParams } from 'react-router-dom';
import { useSubscribe, useTracker } from 'meteor/react-meteor-data';

import { Stations } from '/imports/api/stations/stations.collection';
import App from '/imports/ui/pages/App';

function normalizeSurveyJson(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export default function StationKiosk() {
  const { token } = useParams();

  const stationSubscription = useSubscribe('stations.byToken', token);
  const stationLoading = stationSubscription();

  const station = useTracker(() => {
    if (!token) return null;
    return Stations.findOne({ token });
  }, [token]);

  const [assignedSurveyJson, setAssignedSurveyJson] = useState(null);
  const [surveyLoading, setSurveyLoading] = useState(false);
  const [surveyError, setSurveyError] = useState(null);

  useEffect(() => {
    if (station?.theme) {
      document.documentElement.setAttribute('data-theme', station.theme);
    }

    if (station?.name) {
      document.title = `Vistamate • ${station.name}`;
    }
  }, [station?.theme, station?.name]);

  useEffect(() => {
    let cancelled = false;

    setAssignedSurveyJson(null);
    setSurveyError(null);

    if (!token || !station?.surveyId) {
      setSurveyLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setSurveyLoading(true);

    Meteor.call('surveys.getPublicForStation', token, (err, result) => {
      if (cancelled) return;

      setSurveyLoading(false);

      if (err) {
        setSurveyError(err.reason || err.message || 'Unable to load survey.');
        return;
      }

      setAssignedSurveyJson(normalizeSurveyJson(result?.json));
    });

    return () => {
      cancelled = true;
    };
  }, [token, station?.surveyId]);

  if (stationLoading) {
    return (
      <div className="min-h-screen bg-base-200 p-8 text-base-content">
        Loading station…
      </div>
    );
  }

  if (!station) {
    return (
      <div className="min-h-screen bg-base-200 p-8 text-base-content">
        This kiosk link is invalid or inactive.
      </div>
    );
  }

  if (surveyLoading) {
    return (
      <div className="min-h-screen bg-base-200 p-8 text-base-content">
        Loading kiosk survey…
      </div>
    );
  }

  if (surveyError) {
    return (
      <div className="min-h-screen bg-base-200 p-8 text-base-content">
        <div className="alert alert-error max-w-xl">
          <span>{surveyError}</span>
        </div>
      </div>
    );
  }

  return (
    <App
      stationId={station._id}
      kioskConfig={station}
      assignedSurveyJson={assignedSurveyJson}
    />
  );
}
