importScripts("https://www.gstatic.com/firebasejs/9.6.11/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.6.11/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAmpegkKTcQ8jlN3aPEr8CpnF-cxDCrLPA",
  authDomain: "ctt-frameries.firebaseapp.com",
  projectId: "ctt-frameries",
  storageBucket: "ctt-frameries.firebasestorage.app",
  messagingSenderId: "1035922442788",
  appId: "1:1035922442788:web:71cf0e8190813af4ffe6b1",
  measurementId: "G-FLKKEWFSNY",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("📩 Message reçu en arrière-plan : ", payload);

  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: "/logo-removebg.jpg",
  });
});
