// firebase-config.js
const firebaseConfig = {
    apiKey: "AIzaSyDcqdppmvWUbwLzlOUVu5lXCAVZuRP1res",
    authDomain: "airlinereservation-c1255.firebaseapp.com",
    projectId: "airlinereservation-c1255",
    storageBucket: "airlinereservation-c1255.appspot.com",
    messagingSenderId: "774467371768",
    appId: "1:774467371768:web:ecb97fbe0bd2b19af8310d"
  };
  
  // Initialize Firebase (for Firebase v8)
  firebase.initializeApp(firebaseConfig);
  
  const db = firebase.firestore();