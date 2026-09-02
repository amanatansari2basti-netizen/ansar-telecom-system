import { initializeApp } from "firebase/app";

import { getAuth } from "firebase/auth";

import { getFirestore } from "firebase/firestore";

import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyArb7JKJSfg-M_pJgWyWzS9gv9OchYCsVI",

  authDomain:
    "ansar-telecom-system.firebaseapp.com",

  projectId:
    "ansar-telecom-system",

  storageBucket:
    "ansar-telecom-system.firebasestorage.app",

  messagingSenderId:
    "96232041944",

  appId:
    "1:96232041944:web:ab1b669bbd3687d916d6ad",

  measurementId:
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