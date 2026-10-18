const firebaseConfig = {
  apiKey: "AIzaSyDe5o4C6FFWc_O8LcUao61xHHnlruKtIZc",
  authDomain: "online-examination-syste-21adf.firebaseapp.com",
  projectId: "online-examination-syste-21adf",
  storageBucket: "online-examination-syste-21adf.firebasestorage.app",
  messagingSenderId: "271890466949",
  appId: "1:271890466949:web:13ff78e6523d28ad7ac1ec",
  measurementId: "G-BSMQ1MB3J0"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();
