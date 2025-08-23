import { Mongo } from 'meteor/mongo';
export const Surveys = new Mongo.Collection('surveys');
// {_id, name, json, accountId, createdAt, createdBy}
