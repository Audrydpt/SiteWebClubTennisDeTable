/* eslint-disable */
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';
import axios from 'axios';

const firebaseConfig = {
  apiKey: 'AIzaSyAmpegkKTcQ8jlN3aPEr8CpnF-cxDCrLPA',
  authDomain: 'ctt-frameries.firebaseapp.com',
  projectId: 'ctt-frameries',
  storageBucket: 'ctt-frameries.firebasestorage.app',
  messagingSenderId: '1035922442788',
  appId: '1:1035922442788:web:71cf0e8190813af4ffe6b1',
  measurementId: 'G-FLKKEWFSNY',
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestNotificationPermission = async (membreId: string) => {
  try {
    const permission = await (Notification as any).requestPermission();
    if (permission === "granted") {
      const token = await getToken(messaging, {
        vapidKey:
          "BLZqp_xJyDNJlaji7P0fTyci2OQQ84j2ZGIyR_PickAWhXVplI-dmLqL0P2vpoGD6Wo6D6I3DyTXvnPigoOxmnk",
      });

      console.log("🔑 Token de notif :", token);

      // 👉 Sauvegarde le token dans ton JSON Server
      await axios.patch(`${import.meta.env.VITE_API_URL}/membres/${membreId}`, {
        notifToken: token,
      });

      return token;
    }
    console.log("❌ Permission refusée");
  } catch (err) {
    console.error("Erreur Firebase", err);
  }
};

