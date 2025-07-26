import React from 'react';
import { createRoot } from 'react-dom/client';
import { Meteor } from 'meteor/meteor';
import MainRouter from '/imports/ui/MainRouter';
import 'bootstrap/dist/css/bootstrap.min.css';
import '/imports/ui/styles/tailwind.css';


Meteor.startup(() => {
  const container = document.getElementById('react-target');
  const root = createRoot(container);
  root.render(<MainRouter />);
});
