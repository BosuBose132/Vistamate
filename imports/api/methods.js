import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import OpenAI from 'openai';


Meteor.methods({
  async 'visitors.processOCR'(base64ImageData) {
    check(base64ImageData, String);

    if (!openaiApiKey) {
    throw new Meteor.Error('config-error', 'OpenAI API key is not configured on the server.');
    }

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
            { type: 'text', text: 'Please read all visible text from this document image. If possible, return any fields like name, email, phone, company, DOB, gender in JSON. If the ID says "Sex" instead of "Gender", include it in the JSON as "gender". Always include all 6 fields. If a field is missing or unreadable, return null for it. Strictly respond with JSON only, in this format: {"name":"", "email":"", "phone":"", "company":"", "dob":"", "gender":""}.' },
            { type: 'image_url', image_url: { url: base64ImageData, detail: 'auto' } }
          ]
        }
      ]
    });

    const answer = response.choices[0].message.content;
    console.log('OpenAI OCR result:', answer);

    return { text: answer };
  } catch (err) {
    console.error('OpenAI OCR failed:', err);
    throw new Meteor.Error('openai-ocr-failed', 'OpenAI OCR failed: ' + err.message);
  }
  }
});
