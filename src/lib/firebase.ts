import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

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

const requiredVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

const missingVars = requiredVars.filter(key => !(import.meta.env[key] || firebaseLocal[key.replace('VITE_FIREBASE_', '').toLowerCase().replace(/_([a-z])/g, (g) => g[1].toUpperCase())] || firebaseLocal.apiKey));

if (missingVars.length > 0 && !firebaseLocal.apiKey) {
  console.error(`Firebase configuration is missing for: ${missingVars.join(', ')}. 
Please set these environment variables in your deployment settings (e.g., Vercel). 
Also, ensure your domain is added to 'Authorized Domains' in the Firebase Console under Authentication > Settings.`);
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, databaseId);
export const auth = getAuth(app);

// Connectivity Test (Mandatory for diagnosis)
async function testConnection() {
  try {
    // Attempt to reach the server to verify config
    await getDocFromServer(doc(db, '_connection_test_', 'check'));
    console.log('Firebase connection verified');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('CRITICAL: Firebase is reporting "offline". This usually means your VITE_FIREBASE_PROJECT_ID or VITE_FIREBASE_API_KEY is incorrect or missing in Vercel.');
    }
  }
}

testConnection();
