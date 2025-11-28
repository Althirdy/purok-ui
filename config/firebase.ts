/**
 * Firebase Configuration
 */

import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database
export const database = getDatabase(app);

export default app;

