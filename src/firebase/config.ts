// src/firebase/config.ts
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// 🔥 CAMBIAR AL PROYECTO CORRECTO (egresados-76d37)
const firebaseConfig = {
  apiKey: "AIzaSyCpUIqNDOAqq_Zrg4mN2Yt7zE_6p2DppkQ",
  authDomain: "egresados-76d37.firebaseapp.com",
  databaseURL: "https://egresados-76d37-default-rtdb.firebaseio.com",
  projectId: "egresados-76d37",
  storageBucket: "egresados-76d37.firebasestorage.app",
  messagingSenderId: "145930256277",
  appId: "1:145930256277:web:3df5d0d859c205ca2e809c",
  measurementId: "G-SDNHCTYLZE"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

console.log('✅ Firebase conectado (Webinar)');