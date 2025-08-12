import React, { useState, useEffect } from 'react';
import { Survey } from 'survey-react-ui';
import { useNavigate } from 'react-router-dom';
// components/Survey.tsx
import 'survey-core/survey-core.css';


const SurveyForm = ({ surveyModel }) => {
  const navigate = useNavigate();


  useEffect(() => {
    if (surveyModel?.isCompleted) {
      surveyModel.isCompleted = false;
    }
  }, [surveyModel]);

  if (!surveyModel) {
    return <p className="text-center text-slate-600 text-lg py-6">No form to display yet. Capture an ID first!</p>;
  }

  return (
    <div className="w-full md:w-[48%] h-[85vh] overflow-y-auto px-6 py-6 rounded-2xl shadow-xl backdrop-blur-sm bg-white/10p-6 w-full h-auto bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-lgp-4 w-full max-h-[85vh] overflow-auto rounded-2xl backdrop-blur-md bg-white/10w-full max-w-xl h-[85vh] overflow-y-auto backdrop-blur-sm bg-transparent border border-white/20 rounded-xl shadow-xl p-4">

      <h2></h2>
      <Survey model={surveyModel}
        onComplete={(sender) => {
          const data = sender.data;
          navigate('/thankyou');
        }} />
    </div>
  );
};

export default SurveyForm;
