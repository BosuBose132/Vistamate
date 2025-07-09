import React from 'react';
import { Survey } from 'survey-react-ui';
import 'survey-core/survey-core.css';


const SurveyForm = ({ surveyModel }) => {
  if (!surveyModel) {
    return <p>No form to display yet. Capture an ID first!</p>;
  }

  return (
    <div>
      <h2>Visitor Registration Form</h2>
      <Survey model={surveyModel} />
    </div>
  );
};

export default SurveyForm;
