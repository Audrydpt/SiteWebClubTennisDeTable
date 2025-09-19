/* eslint-disable */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AuthProvider } from "./lib/authContext";
import App from "./App.tsx";
import "./index.css";

const basename = import.meta.env.BASE_URL || "";
const queryClient = new QueryClient();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/firebase-messaging-sw.js")
    .then((registration) => {
      console.log("✅ Service Worker Firebase enregistré", registration);
    })
    .catch((err) => {
      console.error("❌ Erreur Service Worker Firebase", err);
    });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router basename={basename}>
          <App />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
);
