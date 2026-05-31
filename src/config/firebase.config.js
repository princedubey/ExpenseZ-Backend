const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin if a valid private key is present; otherwise export a stub.
const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY || '';
const looksLikePem = typeof rawPrivateKey === 'string' && rawPrivateKey.includes('-----BEGIN');

if (looksLikePem) {
  const serviceAccount = {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: rawPrivateKey.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  module.exports = admin;
} else {
  // Minimal stub for environments (tests/local) without Firebase creds.
  // `auth().verifyIdToken` will throw when used, which callers should handle.
  module.exports = {
    auth: () => ({
      verifyIdToken: async () => {
        throw new Error('Firebase admin not configured');
      },
    }),
  };
}