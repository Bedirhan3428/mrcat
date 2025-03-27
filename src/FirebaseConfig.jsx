import { initializeApp } from "firebase/app";
import { getAuth, signOut, GoogleAuthProvider  } from "firebase/auth"; // v9 için doğru içe aktarma
import { getDatabase } from "firebase/database";


const firebaseConfig = {
  apiKey: "AIzaSyAnEP9D0xdKB43UehhCLqpOjaEXUbKgh8E",
  authDomain: "mrket-6cde9.firebaseapp.com",
  databaseURL: "https://mrket-6cde9-default-rtdb.firebaseio.com",
  projectId: "mrket-6cde9",
  storageBucket: "mrket-6cde9.firebasestorage.app",
  messagingSenderId: "100139465353",
  appId: "1:100139465353:web:9b438421b1e6fdcfcb2458",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app); // v9 için doğru getAuth kullanımı
const database = getDatabase(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, database, googleProvider, signOut };