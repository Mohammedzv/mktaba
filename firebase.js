
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

import {
  getDatabase,
  ref,
  onValue,
  push,
  set,
  update,
  remove
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

// بيانات مشروع مكتبة قبضايا
const firebaseConfig = {
  apiKey: "AIzaSyCvuOHnmX-jKvEVci5Fuz5rGs8jmrKrMNg",
  authDomain: "kapadaya.firebaseapp.com",
  databaseURL: "https://kapadaya-default-rtdb.firebaseio.com",
  projectId: "kapadaya",
  storageBucket: "kapadaya.firebasestorage.app",
  messagingSenderId: "702779183223",
  appId: "1:702779183223:web:31337bcb8fb7af55ca7672",
  measurementId: "G-RZHECMTR28"
};

// تشغيل Firebase
const app = initializeApp(firebaseConfig);

// قاعدة البيانات
const db = getDatabase(app);

// تسجيل الدخول
const auth = getAuth(app);

// رقم واتساب المكتبة
const WHATSAPP_NUMBER = "201070606274";

// تصدير الأدوات لاستخدامها في باقي الملفات
export {
  app,
  db,
  auth,
  ref,
  onValue,
  push,
  set,
  update,
  remove,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  WHATSAPP_NUMBER
};
