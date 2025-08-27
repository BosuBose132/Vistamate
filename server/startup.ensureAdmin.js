import '/imports/api/adminSetup';

import { Meteor } from 'meteor/meteor';

Meteor.startup(async () => {
    if (!Meteor.settings?.admin?.email) {
        console.warn('⚠️  Skipping admin seed: no Meteor.settings.admin provided.');
        return;
    }
    try {
        const res = await Meteor.callAsync('createAdminIfNotExists');
        console.log('✅ Admin ensured', res);
    } catch (e) {
        console.error('🚨 Admin ensure failed:', e);
    }
});
