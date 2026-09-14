const { initializeApp, cert } = require('firebase-admin/app');
const serviceAccount = require('./my-chat-app-firebase-adminsdk.json');
const admin = initializeApp({
  
  credential: cert(serviceAccount),
});

module.exports = admin;