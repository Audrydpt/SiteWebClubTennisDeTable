/* eslint-disable */
import { useEffect } from 'react';

export default function useFullscreen() {
  useEffect(() => {
    // Détecter si on est sur tablette
    const isTablet = () => {
      const ua = navigator.userAgent.toLowerCase();
      const isTabletUA = /ipad|android(?!.*mobile)|tablet/i.test(ua);
      const isLargeScreen = window.innerWidth >= 768 && window.innerWidth <= 1366;
      return isTabletUA || (isLargeScreen && 'ontouchstart' in window);
    };

    // Ne rien faire si on n'est pas sur tablette
    if (!isTablet()) {
      return;
    }

    // Ajouter une classe au body pour appliquer les styles de plein écran
    document.body.classList.add('caisse-fullscreen-mode');
    document.documentElement.classList.add('caisse-fullscreen-mode');

    const enterFullscreen = async () => {
      try {
        const elem = document.documentElement;
        const doc = document as any;
        if (doc.fullscreenElement || doc.webkitFullscreenElement) return;
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if ((elem as any).webkitRequestFullscreen) {
          await (elem as any).webkitRequestFullscreen();
        }
      } catch (err) {}
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

