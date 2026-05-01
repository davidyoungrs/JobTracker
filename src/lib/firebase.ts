import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Use build-time injected config from vite.config.ts or environment variables
const firebaseLocal = (typeof process !== 'undefined' && process.env.FIREBASE_CONFIG_LOCAL) 
  ? (process.env.FIREBASE_CONFIG_LOCAL as any) 
  : {};

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseLocal.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseLocal.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseLocal.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseLocal.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseLocal.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseLocal.appId,
};

const databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseLocal.firestoreDatabaseId;

if (!firebaseConfig.apiKey) {
  console.error('Firebase configuration is missing! Please set VITE_FIREBASE_API_KEY and other related environment variables in your deployment settings.');
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, databaseId);
export const auth = getAuth(app);
