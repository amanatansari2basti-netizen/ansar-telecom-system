import { initializeApp } from "firebase/app";

import { getAuth } from "firebase/auth";

import { getFirestore } from "firebase/firestore";

import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    "AIzaSyArb7JKJSfg-M_pJgWyWzS9gv9OchYCsVI",

  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    "ansar-telecom-system.firebaseapp.com",

  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID ||
    "ansar-telecom-system",

  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    "ansar-telecom-system.firebasestorage.app",

  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    "96232041944",

  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    "1:96232041944:web:ab1b669bbd3687d916d6ad",

  measurementId:
    import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ||
    "G-NXXV60MM5L",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getFirestore(app);

export const functions = getFunctions(
  app,
  "asia-south1"
);

export default app;