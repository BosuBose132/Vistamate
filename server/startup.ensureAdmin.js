import '/imports/api/adminSetup';

import { Meteor } from 'meteor/meteor';

Meteor.startup(async () => {
    try {
        await Meteor.callAsync('createAdminIfNotExists');
        console.log('✅ Admin ensured');
    } catch (e) {
        console.error('Admin ensure failed:', e);
    }
});
