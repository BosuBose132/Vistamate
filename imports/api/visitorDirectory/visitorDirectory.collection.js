// A master list of unique people (deduped by identityKey)
import { Mongo } from 'meteor/mongo';

export const VisitorDirectory = new Mongo.Collection('visitor_directory');
