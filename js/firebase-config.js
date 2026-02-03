/* ========== FIREBASE CONFIGURATION ========== */
const firebaseConfig = {
  apiKey: "AIzaSyA4eZiABJmB2WipDCWP1CMU2ne3brHP-as",
  authDomain: "seba-tutor.firebaseapp.com",
  projectId: "seba-tutor",
  storageBucket: "seba-tutor.firebasestorage.app",
  messagingSenderId: "396972336230",
  appId: "1:396972336230:web:c85a35423a535642b4b9a7",
  measurementId: "G-2GTXCNBHSE"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Export for use in other files
window.auth = auth;
