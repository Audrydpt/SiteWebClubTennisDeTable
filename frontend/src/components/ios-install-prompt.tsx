/* eslint-disable */
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export default function IOSInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // 🔧 MODE DEBUG: Forcer l'affichage via URL (?debug=ios-prompt)
    const urlParams = new URLSearchParams(window.location.search);
    const debugPrompt = urlParams.get('debug') === 'ios-prompt';

    // Vérifier si on est sur iOS/iPad
    const isIOS = () =>
      /ipad|iphone|ipod/.test(navigator.userAgent.toLowerCase()) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    // Vérifier si on est déjà en mode standalone
    const isStandalone = () =>
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    // Vérifier si l'utilisateur a déjà refusé le prompt
    const hasDeclinedPrompt = localStorage.getItem(
      'ios-install-prompt-declined'
    );

    // Mode debug : forcer l'affichage
    if (debugPrompt) {
      console.log('🔧 MODE DEBUG: Affichage forcé du prompt iOS');
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 1000); // 1 seconde en mode debug
      return () => clearTimeout(timer);
    }

    // Afficher le prompt uniquement sur iOS, pas en standalone, et si pas déjà refusé
    if (isIOS() && !isStandalone() && !hasDeclinedPrompt) {
      // Attendre 3 secondes avant d'afficher le prompt
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  const handleClose = () => {
    setShowPrompt(false);
    localStorage.setItem('ios-install-prompt-declined', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center p-4 pointer-events-none">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 max-w-md w-full pointer-events-auto animate-slide-up border-2 border-blue-500">
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          aria-label="Fermer"
        >
          <X size={20} />
        </button>

        <div className="text-center space-y-4">
          <div className="text-4xl">📱</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Installer l&apos;application
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Pour une expérience optimale en plein écran sur iPad :
          </p>
          <ol className="text-left text-sm space-y-2 text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <span className="font-bold">1.</span>
              <span>
                Appuyez sur le bouton{' '}
                <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-500 text-white rounded text-xs">
                  ⬆️
                </span>{' '}
                de partage
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">2.</span>
              <span>
                Sélectionnez &quot;Sur l&apos;écran d&apos;accueil&quot;
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">3.</span>
              <span>Appuyez sur &quot;Ajouter&quot;</span>
            </li>
          </ol>
          <p className="text-xs text-gray-500 dark:text-gray-400 italic">
            L&apos;application s&apos;ouvrira en plein écran, sans les barres
            Safari, comme une vraie app ! 🚀
          </p>
        </div>
      </div>
    </div>
  );
}


