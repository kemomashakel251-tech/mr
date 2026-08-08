// =====================================================================
// إعدادات فايربيز — المستر
// هات القيم دي من: Firebase Console > Project settings > General > Your apps > SDK setup
// =====================================================================
const firebaseConfig = {
  apiKey: "AIzaSyBefkh7GpID57Mhir8JPoFdCoDOzY2Zv20",
  authDomain: "mrtt-564b6.firebaseapp.com",
  projectId: "mrtt-564b6",
  storageBucket: "mrtt-564b6.firebasestorage.app",
  messagingSenderId: "19184284333",
  appId: "1:19184284333:web:735a549e7c36ffdbdfcc24",
  measurementId: "G-KCHL22BF10"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db   = firebase.firestore();
