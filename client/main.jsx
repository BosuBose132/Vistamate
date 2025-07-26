import React from 'react';
import { createRoot } from 'react-dom/client';
import { Meteor } from 'meteor/meteor';
//import { App } from '/imports/ui/pages/App';
import MainRouter from '/imports/ui/MainRouter';
import 'bootstrap/dist/css/bootstrap.min.css';
import '/imports/ui/styles/tailwind.css';
import MainRouter from '../imports/ui/MainRouter';

Meteor.startup(() => {
  const container = document.getElementById('react-target');
  const root = createRoot(container);
  root.render(<MainRouter />);
});
