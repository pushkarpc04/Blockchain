import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // Added for consistency with off-chain-storage.ts

// Your web app's Firebase configuration
// IMPORTANT: Replace with your actual Firebase project configuration
// You should store these in environment variables for security

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

if (!apiKey) {
  console.warn("Firebase API Key (NEXT_PUBLIC_FIREBASE_API_KEY) is missing. Please check your .env.local file.");
}
if (!authDomain) {
  console.warn("Firebase Auth Domain (NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) is missing. Please check your .env.local file.");
}
if (!projectId) {
  console.warn("Firebase Project ID (NEXT_PUBLIC_FIREBASE_PROJECT_ID) is missing. Please check your .env.local file.");
}
// storageBucket, messagingSenderId, appId can also be checked if strict validation is needed for all fields.

const firebaseConfig = {
  apiKey: apiKey,
  authDomain: authDomain,
  projectId: projectId,
  storageBucket: storageBucket,
  messagingSenderId: messagingSenderId,
  appId: appId,
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage = getStorage(app); // Initialize storage here as well for consistency

export { app, auth, db, storage };
