import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Roles } from 'meteor/alanning:roles';
import { Surveys } from './surveys.collection';

function assertAdmin(userId) {
    if (!userId || !Roles.userIsInRole(userId, 'admin')) {
        throw new Meteor.Error('not-authorized', 'Admin role required.');
    }
}

Meteor.methods({
    async 'surveys.create'({ name, json }) {
        check(name, String);
        check(json, Match.OneOf(String, Object));
        assertAdmin(this.userId);

        let parsed = json;
        if (typeof json === 'string') {
            try { parsed = JSON.parse(json); }
            catch { throw new Meteor.Error('bad-json', 'Survey JSON is invalid.'); }
        }

        const _id = await Surveys.insertAsync({
            name: name.trim(),
            json: parsed,
            accountId: this.userId,  // connects survey to the admin account
            createdAt: new Date(),
            createdBy: this.userId,
        });
        return _id;
    },
});
