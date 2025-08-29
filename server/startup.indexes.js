import { Meteor } from 'meteor/meteor';
import { VisitorDirectory } from '/imports/api/visitorDirectory/visitorDirectory.collection';

Meteor.startup(async () => {
    // Unique identity to prevent duplicates (email > phone > name|company)
    try {
        await VisitorDirectory.rawCollection().createIndex(
            { identityKey: 1 },
            { unique: true, sparse: true }
        );
    } catch (e) {
        // ignore “already exists”
    }
});
