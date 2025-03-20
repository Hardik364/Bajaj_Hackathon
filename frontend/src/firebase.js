// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth"; 
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCI3sZAOTOFl54R_gpTGkPyAPellD3l2Bo",
  authDomain: "bajaj-flex.firebaseapp.com",
  projectId: "bajaj-flex",
  storageBucket: "bajaj-flex.firebasestorage.app",
  messagingSenderId: "187105585915",
  appId: "1:187105585915:web:7f3fdeb9990a01cf271e5e",
  measurementId: "G-5CJLTSL7HC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);    
export const auth = getAuth(app); 
export const db = getFirestore(app);