const admin = require('firebase-admin');
const config = require('./index');

let firebaseApp = null;

const initializeFirebase = () => {
  if (firebaseApp) return firebaseApp;
  
  try {
    if (config.firebase.projectId && config.firebase.privateKey && config.firebase.clientEmail) {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: config.firebase.projectId,
          privateKey: config.firebase.privateKey,
          clientEmail: config.firebase.clientEmail
        })
      });
      console.log('Firebase initialized successfully');
    } else {
      console.warn('Firebase configuration missing - notifications will be disabled');
    }
  } catch (error) {
    console.error('Firebase initialization error:', error.message);
  }
  
  return firebaseApp;
};

const getMessaging = () => {
  if (!firebaseApp) {
    initializeFirebase();
  }
  return firebaseApp ? admin.messaging() : null;
};

module.exports = {
  initializeFirebase,
  getMessaging
};
