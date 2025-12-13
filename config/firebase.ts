/**
 * Firebase Configuration - Lazy Initialization
 * 
 * Firebase is only initialized when first accessed, not on app startup.
 * This reduces initial bundle size and improves app load time.
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getDatabase, type Database } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyBv3B7xnuS_Aw5yXU0N0sOXMScFvyCi0LE",
  authDomain: "urbanwatch-d3ddf.firebaseapp.com",
  databaseURL: "https://urbanwatch-d3ddf-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "urbanwatch-d3ddf",
  storageBucket: "urbanwatch-d3ddf.firebasestorage.app",
  messagingSenderId: "1023395247615",
  appId: "1:1023395247615:web:71577fd580ad9f9e7a63ca",
  measurementId: "G-55N6R7NQER"
};

// Lazy initialization - only create app when first accessed
let app: FirebaseApp | null = null;
let databaseInstance: Database | null = null;

function getApp(): FirebaseApp {
  if (!app) {
    const existingApps = getApps();
    if (existingApps.length > 0) {
      app = existingApps[0];
    } else {
      app = initializeApp(firebaseConfig);
    }
  }
  return app;
}

// Lazy get database - only initialize when first accessed
export function getDatabaseInstance(): Database {
  if (!databaseInstance) {
    databaseInstance = getDatabase(getApp());
  }
  return databaseInstance;
}

// Export database getter for backward compatibility
export const database = new Proxy({} as Database, {
  get(_target, prop) {
    return (getDatabaseInstance() as any)[prop];
  }
});

// Export app getter
export default new Proxy({} as FirebaseApp, {
  get(_target, prop) {
    return (getApp() as any)[prop];
  }
});

