import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';

import { Surveys } from './surveys.collection';
import { assertAdminAsync } from '../_roles.helpers';
import { Stations } from '/imports/api/stations/stations.collection';

Meteor.methods({
  async 'surveys.create'({ name, json }) {
    check(name, String);
    check(json, Match.OneOf(String, Object));
    await assertAdminAsync(this.userId);

    let parsed = json;
    if (typeof json === 'string') {
      try {
        parsed = JSON.parse(json);
      } catch {
        throw new Meteor.Error('bad-json', 'Survey JSON is invalid.');
      }
    }

    const _id = await Surveys.insertAsync({
      name: name.trim(),
      json: parsed,
      accountId: this.userId, // connects survey to the admin account
      createdAt: new Date(),
      createdBy: this.userId,
    });
    return _id;
  },
  async 'surveys.getPublicForStation'(stationToken) {
    check(stationToken, String);

    const station = await Stations.findOneAsync({
      token: stationToken,
      isActive: true,
    });

    if (!station?.surveyId) {
      return null;
    }

    const survey = await Surveys.findOneAsync(
      { _id: station.surveyId },
      { fields: { name: 1, json: 1 } },
    );

    if (!survey) {
      return null;
    }

    return {
      _id: survey._id,
      name: survey.name,
      json: survey.json,
    };
  },
});
