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
      <div className="rounded-2xl border border-dashed border-border bg-muted p-6 text-center">
        <p className="text-base font-medium text-foreground">Ready to scan</p>
      </div>
    );
  }

  return (
    <div className="vistamate-review-survey w-full max-w-[440px]">
      {/* Borderless survey form — SurveyJS handles its own theming */}
      <div className="rounded-xl bg-card">
        <Survey model={surveyModel} />
      </div>
    </div>
  );
};

export default SurveyForm;
