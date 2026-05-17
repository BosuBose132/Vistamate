/* eslint-disable-next-line no-unused-vars, unused-imports/no-unused-imports */
import React from 'react';
import { Survey } from 'survey-react-ui';
import { Model } from 'survey-core';
// /imports/ui/components/SurveyForm.jsx
// <-- provides the <Survey /> React component
// <-- survey engine
import 'survey-core/survey-core.css';
import { useEffect } from 'react';

// Use the modern base CSS once in your app (e.g., main.jsx):
// import 'survey-core/defaultV2.min.css';

const SurveyForm = ({ surveyModel }) => {
  useEffect(() => {
    // Prevent stale-completed model when reusing the same instance
    if (surveyModel?.isCompleted) surveyModel.isCompleted = false;
  }, [surveyModel]);

  if (!surveyModel) {
    return (
      <p className="text-center text-base-content/70 text-lg py-6">
        No form to display yet. Capture an ID first!
      </p>
    );
  }

  return (
    <div className="w-full max-w-xl md:max-w-2xl">
      {/* Borderless, DaisyUI-colored form (no card/border here) */}
      <div className="p-0 md:p-2">
        <Survey model={surveyModel} />
      </div>
    </div>
  );
};

export default SurveyForm;
