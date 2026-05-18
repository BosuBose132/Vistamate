/* eslint-disable-next-line unused-imports/no-unused-imports */
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
      <div className="rounded-lg border border-dashed border-base-300 bg-base-200 p-6 text-center">
        <p className="text-lg font-medium text-base-content">
          No form to display yet
        </p>
        <p className="mt-2 text-base-content/70">
          Capture an ID or business card to prepare the review form.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Borderless, DaisyUI-colored form (no card/border here) */}
      <div className="rounded-md bg-base-100">
        <Survey model={surveyModel} />
      </div>
    </div>
  );
};

export default SurveyForm;
