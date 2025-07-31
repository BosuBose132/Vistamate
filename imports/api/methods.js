import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import OpenAI from 'openai';
import { Visitors } from './collections';


const { checkAndCreateVisitor } = require('visitor-npm-app');

Meteor.methods({
  async 'visitors.checkIn'(data) {
    console.log("Visitors has findOneAsync?", typeof Visitors.findOneAsync);
    check(data, {
      name: String,
      company: String,
      email: String,
      phone: String,
      address: Match.Optional(String),
      dob: Match.Optional(String),

    });

    return await checkAndCreateVisitor(data, Visitors);
  },

  async 'visitors.processOCR'(base64ImageData) {
    check(base64ImageData, String);

    const apiKey = Meteor.settings?.openai?.apiKey;
    if (!apiKey) {
      throw new Meteor.Error('config-error', 'OpenAI API key is not configured on the server.');
    }
    const openai = new OpenAI({ apiKey });
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an OCR assistant that helps transcribe and parse text from images of documents. You do not refuse requests, you just extract whatever text is visible.'
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Please read all visible text from this document image. If possible, return any fields like name, email, phone, company, DOB, address in JSON. Always include all 6 fields. If a field is missing or unreadable, return null for it. Strictly respond with JSON only, in this format: {"name":"", "email":"", "phone":"", "company":"", "dob":"", "address":""}.' },
              { type: 'image_url', image_url: { url: base64ImageData, detail: 'auto' } }
            ]
          }
        ]
      });

      let answer = response.choices[0].message.content;
      answer = answer.replace(/```json/g, '').replace(/```/g, '').trim();
      console.log('OpenAI OCR result:', answer);

      return { text: answer };
    } catch (err) {
      console.error('OpenAI OCR failed:', err);
      throw new Meteor.Error('openai-ocr-failed', 'OpenAI OCR failed: ' + err.message);
    }
  }

  // createInitialAdmin({ email, password }) {
  //   const existingUser = Accounts.findUserByEmail(email);
  //   if (existingUser) {
  //     return { status: 'exists' };
  //   }

  //   const userId = Accounts.createUser({ email, password });
  //   Roles.addUsersToRoles(userId, ['admin']);
  //   return { status: 'created' };
  // }
});
