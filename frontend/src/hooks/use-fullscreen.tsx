/* eslint-disable */
import { useEffect } from 'react';

export default function useFullscreen() {
  useEffect(() => {
    // 🔧 MODE DEBUG: Forcer le mode tablette via URL (?debug=tablet)
    const urlParams = new URLSearchParams(window.location.search);
    const debugMode = urlParams.get('debug') === 'tablet';

    // Détecter si on est sur tablette
    const isTablet = () => {
      // Si mode debug activé, toujours retourner true
      if (debugMode) {
        console.log('🔧 MODE DEBUG TABLETTE ACTIVÉ');
        return true;
      }

      const ua = navigator.userAgent.toLowerCase();
      const isTabletUA = /ipad|android(?!.*mobile)|tablet/i.test(ua);
      const isLargeScreen = window.innerWidth >= 768 && window.innerWidth <= 1366;
      return isTabletUA || (isLargeScreen && 'ontouchstart' in window);
    };

    // Détecter si on est sur iPad/iOS
    const isIOS = () => {
      const ua = navigator.userAgent.toLowerCase();
      return /ipad|iphone|ipod/.test(ua) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPad avec iPadOS 13+
    };

    // Détecter si c'est une PWA standalone (ajoutée à l'écran d'accueil)
    const isStandalone = () => {
      return (window.matchMedia('(display-mode: standalone)').matches) ||
        ((window.navigator as any).standalone === true);
    };

    // Ne rien faire si on n'est pas sur tablette (sauf en mode debug)
    if (!isTablet()) {
      return;
    }

    console.log('📱 Mode tablette détecté - Activation du plein écran');

    // Ajouter une classe au body pour appliquer les styles de plein écran
    document.body.classList.add('caisse-fullscreen-mode');
    document.documentElement.classList.add('caisse-fullscreen-mode');

    // Si c'est iOS et pas en mode standalone, informer l'utilisateur
    if (isIOS() && !isStandalone()) {
      console.log('💡 Astuce iPad: Ajoutez cette page à l\'écran d\'accueil pour une expérience plein écran optimale');
      // Masquer la barre Safari en utilisant le viewport meta
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
      }
    }

    const enterFullscreen = async () => {
      try {
        const elem = document.documentElement;
        const doc = document as any;

        // Ne pas tenter le fullscreen si on est déjà en standalone PWA
        if (isStandalone()) return;

        if (doc.fullscreenElement || doc.webkitFullscreenElement) return;

        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if ((elem as any).webkitRequestFullscreen) {
          // Pour iOS/iPad Safari
          await (elem as any).webkitRequestFullscreen();
        }
      } catch (err) {
        // Sur iOS, le fullscreen peut échouer, ce n'est pas grave
        // Les styles CSS feront le travail
      }
    };

    const handleFullscreenChange = () => {
      const doc = document as any;
      if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
        setTimeout(enterFullscreen, 300);
      }
    };

    const preventScroll = () => {
      window.scrollTo(0, 0);
    };

    enterFullscreen();
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    window.addEventListener('scroll', preventScroll);

    const interval = setInterval(() => {
      const doc = document as any;
      if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
        enterFullscreen();
      }
    }, 5000);

    return () => {
      // Nettoyer les classes CSS
      document.body.classList.remove('caisse-fullscreen-mode');
      document.documentElement.classList.remove('caisse-fullscreen-mode');

      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      window.removeEventListener('scroll', preventScroll);
      clearInterval(interval);
    };
  }, []);
}

