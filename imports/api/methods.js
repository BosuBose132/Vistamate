import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import OpenAI from 'openai';

import { Visitors } from './collections';
import { VisitorDirectory } from '/imports/api/visitorDirectory/visitorDirectory.collection';

Meteor.methods({
  async 'admin.quickCheckIn'(data) {
    // normalize & defaults
    const clean = { ...data };
    if (clean.stationId === undefined || clean.stationId === '')
      clean.stationId = null;
    const norm = (v) => (typeof v === 'string' ? v.trim() : v);
    clean.name = norm(clean.name);
    clean.company = norm(clean.company);
    clean.purpose = clean.purpose || 'Other';
    clean.host = norm(clean.host);

    check(
      clean,
      Match.ObjectIncluding({
        name: String,
        company: Match.Optional(String),
        purpose: Match.Optional(String),
        host: Match.Optional(String),
        stationId: Match.Optional(Match.OneOf(String, null)),
      }),
    );

    // (Optional) deduplicate person in a directory — safe to remove if you don’t want it
    const normalizeStr = (s) =>
      (s || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const identityKey = `nameco:${normalizeStr(clean.name)}|${normalizeStr(clean.company)}`;
    const now = new Date();
    try {
      await VisitorDirectory.rawCollection().updateOne(
        { identityKey },
        {
          $setOnInsert: { identityKey, createdAt: now },
          $set: { name: clean.name, company: clean.company, lastSeenAt: now },
        },
        { upsert: true },
      );
    } catch {
      // ignore duplicate key races
    }

    // Insert the check-in EVENT that your dashboard shows
    const event = {
      name: clean.name,
      company: clean.company,
      purpose: clean.purpose,
      host: clean.host,
      stationId: clean.stationId, // can be null for Global
      status: 'in_building',
      source: 'admin',
      createdAt: now,
    };

    return await (Visitors.insertAsync
      ? Visitors.insertAsync(event)
      : Promise.resolve(Visitors.insert(event)));
  },
});

Meteor.methods({
  async 'visitors.checkIn'(data) {
    console.log('Visitors has findOneAsync?', typeof Visitors.findOneAsync);
    check(data, {
      name: String,
      company: Match.Optional(String),
      email: Match.Optional(String),
      phone: Match.Optional(String),
      address: Match.Optional(String),
      purpose: Match.Optional(String),
      dob: Match.Optional(String),
      host: Match.Optional(String),
      stationId: Match.Optional(Match.OneOf(String, null)),
      source: Match.Optional(String),
      status: Match.Optional(String),
    });

    //return await checkAndCreateVisitor(data, Visitors);
    //   const payload = { ...data, createdAt: new Date() };
    //   return await checkAndCreateVisitor(payload, Visitors);
    // },
    const payload = {
      name: data.name?.trim(),
      company: data.company?.trim() || undefined,
      email: data.email?.trim() || undefined,
      phone: data.phone?.trim() || undefined,
      address: data.address?.trim() || undefined,
      dob: data.dob?.trim() || undefined,
      host: data.host?.trim() || undefined,
      purpose: data.purpose || 'Other',
      stationId: data.stationId ?? null,
      status: data.status || 'in_building',
      source: data.source || (data.stationId ? 'kiosk' : 'public'),
      createdAt: new Date(),
    };
    return await Visitors.insertAsync(payload);
  },
  async 'visitors.detectIdCard'(base64ImageData) {
    check(base64ImageData, String);

    const cfg = Meteor.settings?.roboflow || {};
    const apiKey = cfg.apiKey;
    const projectId = cfg.projectId;
    const version = cfg.version;

    if (!apiKey || !projectId || !version) {
      throw new Meteor.Error(
        'config-error',
        'Roboflow settings are missing. Please configure roboflow.apiKey, roboflow.projectId, and roboflow.version in settings.json.',
      );
    }

    const imageBase64 = base64ImageData.replace(/^data:image\/\w+;base64,/, '');

    const confidence = cfg.confidence ?? 40;
    const overlap = cfg.overlap ?? 30;

    const url =
      `https://detect.roboflow.com/${projectId}/${version}` +
      `?api_key=${encodeURIComponent(apiKey)}` +
      `&confidence=${encodeURIComponent(confidence)}` +
      `&overlap=${encodeURIComponent(overlap)}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: imageBase64,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message || result?.error || 'Roboflow inference failed',
        );
      }

      const predictions = Array.isArray(result.predictions)
        ? result.predictions
        : [];

      const bestCard =
        predictions
          .filter((prediction) => {
            const className = String(
              prediction.class || prediction.class_name || '',
            ).toLowerCase();

            return (
              className === 'id_card' ||
              className === 'id-card' ||
              className === 'id card' ||
              className === 'card'
            );
          })
          .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0] || null;

      return {
        ok: Boolean(bestCard),
        prediction: bestCard,
        predictions,
      };
    } catch (err) {
      console.error('Roboflow ID card detection failed:', err);
      throw new Meteor.Error(
        'roboflow-detection-failed',
        'Roboflow ID card detection failed: ' + err.message,
      );
    }
  },
  async 'visitors.processOCR'(base64ImageData) {
    check(base64ImageData, String);

    const apiKey = Meteor.settings?.openai?.apiKey;
    if (!apiKey) {
      throw new Meteor.Error(
        'config-error',
        'OpenAI API key is not configured on the server.',
      );
    }
    const openai = new OpenAI({ apiKey });
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'You are an OCR assistant that helps transcribe and parse text from images of documents. You do not refuse requests, you just extract whatever text is visible.',
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please read all visible text from this document image. If possible, return any fields like name, email, phone, company, DOB, address in JSON. Always include all 6 fields. If a field is missing or unreadable, return null for it. Strictly respond with JSON only, in this format: {"name":"", "email":"", "phone":"", "company":"", "dob":"", "address":""}.',
              },
              {
                type: 'image_url',
                image_url: { url: base64ImageData, detail: 'auto' },
              },
            ],
          },
        ],
      });

      let answer = response.choices[0].message.content;
      answer = answer
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      console.log('OpenAI OCR result:', answer);

      return { text: answer };
    } catch (err) {
      console.error('OpenAI OCR failed:', err);
      throw new Meteor.Error(
        'openai-ocr-failed',
        'OpenAI OCR failed: ' + err.message,
      );
    }
  },

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
