import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Roles } from 'meteor/alanning:roles';
import { v4 as uuidv4 } from 'uuid';
import { Stations } from './stations.collection';

function assertAdmin(userId) {
    if (!userId || !Roles.userIsInRole(userId, 'admin')) {
        throw new Meteor.Error('not-authorized', 'Admin role required.');
    }
}

Meteor.methods({
    // used by Welcome button to route to Lobby
    'stations.getDefaultToken'() {
        const s = Stations.findOne({ name: 'Lobby', isActive: true }) ||
            Stations.findOne({ isActive: true }, { sort: { createdAt: 1 } });
        return s?.token || null;
    },

    // Create a kiosk (station) with configuration
    'stations.create'(payload) {
        check(payload, {
            name: String,
            location: String,
            surveyId: Match.Optional(String),
            cameraEnabled: Match.Optional(Boolean),
            requirePhoto: Match.Optional(Boolean),
            mobileBehavior: Match.Optional(String), // 'form_always' | 'toggle'
            welcomeMessage: Match.Optional(String),
            theme: Match.Optional(String),
        });
        assertAdmin(this.userId);

        return Stations.insert({
            ...payload,
            token: uuidv4(),
            isActive: true,
            createdAt: new Date(),
            createdBy: this.userId,
        });
    },

    'stations.update'({ _id, updates }) {
        check(_id, String);
        check(updates, Object);
        assertAdmin(this.userId);
        const allowed = ['name', 'location', 'surveyId', 'cameraEnabled', 'requirePhoto', 'mobileBehavior', 'welcomeMessage', 'theme', 'isActive'];
        const $set = Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k)));
        Stations.update(_id, { $set });
    },

    'stations.rename'({ _id, name }) {
        check(_id, String); check(name, String);
        assertAdmin(this.userId);
        Stations.update(_id, { $set: { name: name.trim() } });
    },

    'stations.toggle'({ _id, isActive }) {
        check(_id, String); check(isActive, Boolean);
        assertAdmin(this.userId);
        Stations.update(_id, { $set: { isActive } });
    },

    'stations.rotate'({ _id }) {
        check(_id, String);
        assertAdmin(this.userId);
        const token = uuidv4();
        Stations.update(_id, { $set: { token } });
        return token;
    },

    'stations.remove'({ _id }) {
        check(_id, String);
        assertAdmin(this.userId);
        Stations.remove(_id);
    },
});
