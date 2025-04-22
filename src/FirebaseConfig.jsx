import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth"; 
import { getDatabase, ref } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDSu8gOBilxDtWRT53m-gqGCt-r1XCpjDw",
  authDomain: "mrket-62a33.firebaseapp.com",
  projectId: "mrket-62a33",
  storageBucket: "mrket-62a33.firebasestorage.app",
  messagingSenderId: "159670150710",
  appId: "1:159670150710:web:fdcd389e19101667339a97",
  measurementId: "G-CF05T2VQSP"
};


const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app); // Auth nesnesini oluşturun
const database = getDatabase(app);
const mesajlarRef = ref(database, 'mesajlar');

export { auth , app , analytics, database, mesajlarRef };
  