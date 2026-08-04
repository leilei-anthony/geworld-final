// firebaseConfig.js — your Firebase project's web config.
//
// This file ships with placeholder values on purpose: until you replace
// them, statsManager.js detects the placeholder and quietly disables the
// global choice stats feature (no errors, the rest of the game is unaffected).
//
// To enable global stats: follow FIREBASE_SETUP.md, then paste the
// "firebaseConfig" object Firebase gives you here. The apiKey below is NOT
// a secret — Firebase's own docs confirm this; what actually protects your
// data is the security rules you publish in the Firestore console (also
// covered in FIREBASE_SETUP.md), so it's safe to commit this file as-is.

export const firebaseConfig = {
  apiKey: 'AIzaSyAVaPRIc5Q-dvTmAQMLbD8tn_qjaNeJPJ4',
  authDomain: 'geworld-final.firebaseapp.com',
  projectId: 'geworld-final',
  storageBucket: 'geworld-final.firebasestorage.app',
  messagingSenderId: '646757815086',
  appId: '1:646757815086:web:6696b5342a114503f760bf',
};

export const isFirebaseConfigured = firebaseConfig.apiKey !== 'REPLACE_ME';