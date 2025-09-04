import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
//import { Roles } from 'meteor/alanning:roles';
import { v4 as uuidv4 } from 'uuid';
import { Stations } from './stations.collection';
import { assertAdminAsync } from '/imports/api/_roles.helpers.js';

// function assertAdmin(userId) {
//     if (!userId || !Roles.userIsInRole(userId, 'admin')) {
//         throw new Meteor.Error('not-authorized', 'Admin role required.');
//     }
// }

Meteor.methods({
    // used by Welcome button to route to Lobby
    async 'stations.getDefaultToken'() {
        const lobby = await Stations.findOneAsync({ name: 'Lobby', isActive: true });
        if (lobby) return lobby.token;
        const firstActive = await Stations.findOneAsync({ isActive: true }, { sort: { createdAt: 1 } });
        return firstActive?.token || null;
    },

    // Create a kiosk (station) with configuration
    async 'stations.create'(payload) {
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
        await assertAdminAsync(this.userId);

        const token = uuidv4();
        const _id = await Stations.insertAsync({
            ...payload,
            token: uuidv4(),
            isActive: true,
            createdAt: new Date(),
            createdBy: this.userId,
        });
        return { _id, token };
    },

    async 'stations.update'({ _id, updates }) {
        check(_id, String);
        check(updates, Object);
        await assertAdminAsync(this.userId);
        const allowed = ['name', 'location', 'surveyId', 'cameraEnabled', 'requirePhoto', 'mobileBehavior', 'welcomeMessage', 'theme', 'isActive'];
        const $set = Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k)));
        await Stations.updateAsync(_id, { $set });
    },

    async 'stations.rename'({ _id, name }) {
        check(_id, String); check(name, String);
        await assertAdminAsync(this.userId);
        await Stations.updateAsync(_id, { $set: { name: name.trim() } });
    },

    async 'stations.toggle'({ _id, isActive }) {
        check(_id, String); check(isActive, Boolean);
        assertAdmin(this.userId);
        Stations.updateAsync(_id, { $set: { isActive } });
    },

    async 'stations.rotate'({ _id }) {
        check(_id, String);
        await assertAdminAsync(this.userId);
        const token = uuidv4();
        await Stations.updateAsync(_id, { $set: { token } });
        return token;
    },

    async 'stations.remove'({ _id }) {
        check(_id, String);
        await assertAdminAsync(this.userId);
        await Stations.removeAsync(_id);
    },
});
