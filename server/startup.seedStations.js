import { Meteor } from 'meteor/meteor';
import { Stations } from '/imports/api/stations/stations.collection';
import { v4 as uuidv4 } from 'uuid';

Meteor.startup(() => {
    ['Lobby', 'Reception', 'Office'].forEach(name => {
        if (!Stations.findOne({ name })) {
            Stations.insert({
                name,
                location: '',
                token: uuidv4(),
                isActive: true,
                createdAt: new Date(),
                createdBy: 'system',
                cameraEnabled: true,
                requirePhoto: false,
                mobileBehavior: 'toggle',
                welcomeMessage: '',
                theme: 'vistamate',
            });
        }
    });
});
