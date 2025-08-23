import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Roles } from 'meteor/alanning:roles';
import { Stations } from './stations.collection';

Meteor.publish('stations.admin', function () {
    if (!this.userId || !Roles.userIsInRole(this.userId, 'admin')) return this.ready();
    return Stations.find({}, {
        fields: {
            name: 1, location: 1, token: 1, isActive: 1, createdAt: 1, surveyId: 1,
            cameraEnabled: 1, requirePhoto: 1, mobileBehavior: 1, welcomeMessage: 1, theme: 1
        }
    });
});

Meteor.publish('stations.byToken', function (token) {
    check(token, String);
    return Stations.find({ token, isActive: true }, {
        fields: {
            name: 1, location: 1, token: 1, surveyId: 1, cameraEnabled: 1, requirePhoto: 1,
            mobileBehavior: 1, welcomeMessage: 1, theme: 1
        }
    });
});
