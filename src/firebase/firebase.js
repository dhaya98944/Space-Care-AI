import { initializeApp, getApps } from "firebase/app";

import {
  getAuth,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";

import {
  getFirestore
} from "firebase/firestore";

/*const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};*/

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBQp0oupo668ysn5micsNvsqtZjgrDmfns",
  authDomain: "spaceapp-52e58.firebaseapp.com",
  projectId: "spaceapp-52e58",
  storageBucket: "spaceapp-52e58.firebasestorage.app",
  messagingSenderId: "407820477421",
  appId: "1:407820477421:web:e1e5bc362cda03511a3de4",
  measurementId: "G-1SXBC0HBMG"
};

export const firebaseReady = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);



const app = firebaseReady
  ? (getApps().length
      ? getApps()[0]
      : initializeApp(firebaseConfig))
  : null;
console.log("Firebase configuration status:", {
  apiKey: Boolean(firebaseConfig.apiKey),
  authDomain: Boolean(firebaseConfig.authDomain),
  projectId: Boolean(firebaseConfig.projectId),
  appId: Boolean(firebaseConfig.appId),
  firebaseReady
});
export const auth = app ? getAuth(app) : null;

export const db = app ? getFirestore(app) : null;

export const authPersistence = auth
  ? setPersistence(auth, browserLocalPersistence)
  : Promise.resolve();