import { Meteor } from 'meteor/meteor';
import { Stations } from '/imports/api/stations/stations.collection';
import { v4 as uuidv4 } from 'uuid';

Meteor.startup(async () => {
    const defaults = ['Lobby', 'Reception', 'Office'];

    for (const name of defaults) {
        const exists = await Stations.findOneAsync({ name });
        if (!exists) {
            await Stations.insertAsync({
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
    };
});
