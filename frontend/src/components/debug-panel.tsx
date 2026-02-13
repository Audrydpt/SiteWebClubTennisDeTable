/* eslint-disable */
import { useEffect, useState } from 'react';
import { Bug, Smartphone, X } from 'lucide-react';
import { Button } from './ui/button';

export default function DebugPanel() {
  const [isVisible, setIsVisible] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({
    userAgent: '',
    platform: '',
    width: 0,
    height: 0,
    touchPoints: 0,
    isStandalone: false,
  });

  useEffect(() => {
    // Vérifier si le mode debug est activé via URL
    const urlParams = new URLSearchParams(window.location.search);
    const hasDebugParam = urlParams.has('debug');

    if (hasDebugParam) {
      setIsVisible(true);
    }

    // Récupérer les infos de l'appareil
    const updateDeviceInfo = () => {
      setDeviceInfo({
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        width: window.innerWidth,
        height: window.innerHeight,
        touchPoints: navigator.maxTouchPoints || 0,
        isStandalone: window.matchMedia('(display-mode: standalone)').matches ||
          (window.navigator as any).standalone === true,
      });
    };

    updateDeviceInfo();
    window.addEventListener('resize', updateDeviceInfo);

    return () => window.removeEventListener('resize', updateDeviceInfo);
  }, []);

  const toggleDebugMode = (mode: string) => {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('debug', mode);
    window.location.href = currentUrl.toString();
  };

  const clearDebugMode = () => {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.delete('debug');
    window.location.href = currentUrl.toString();
  };

  const currentDebugMode = new URLSearchParams(window.location.search).get('debug');

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[10000] max-w-md">
      <div className="bg-gray-900 text-white rounded-lg shadow-2xl border-2 border-yellow-500">
        <div className="bg-yellow-500 text-black px-4 py-2 flex items-center justify-between rounded-t-lg">
          <div className="flex items-center gap-2">
            <Bug size={20} />
            <span className="font-bold">Mode Debug</span>
          </div>
          <button
            type="button"
            onClick={() => setIsVisible(false)}
            className="hover:bg-yellow-600 rounded p-1"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Mode actif */}
          {currentDebugMode && (
            <div className="bg-green-900/50 border border-green-500 rounded p-3">
              <p className="text-green-400 font-semibold mb-2">
                ✅ Mode actif: {currentDebugMode}
              </p>
              <Button
                size="sm"
                variant="destructive"
                onClick={clearDebugMode}
                className="w-full"
              >
                Désactiver le mode debug
              </Button>
            </div>
          )}

          {/* Boutons de test */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-yellow-400 mb-2">
              🧪 Modes de test :
            </h3>

            <Button
              size="sm"
              onClick={() => toggleDebugMode('tablet')}
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={currentDebugMode === 'tablet'}
            >
              <Smartphone size={16} className="mr-2" />
              Mode Tablette (Plein écran)
            </Button>

            <Button
              size="sm"
              onClick={() => toggleDebugMode('ios-prompt')}
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={currentDebugMode === 'ios-prompt'}
            >
              📱 Prompt iOS (Installation)
            </Button>
          </div>

          {/* Infos de l'appareil */}
          <div className="space-y-2 text-xs">
            <h3 className="text-sm font-semibold text-yellow-400 mb-2">
              📱 Infos de l&apos;appareil :
            </h3>

            <div className="bg-gray-800 rounded p-2 space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-400">Taille écran:</span>
                <span className="text-white font-mono">
                  {deviceInfo.width} × {deviceInfo.height}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Points tactiles:</span>
                <span className="text-white font-mono">{deviceInfo.touchPoints}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Standalone:</span>
                <span className={deviceInfo.isStandalone ? 'text-green-400' : 'text-red-400'}>
                  {deviceInfo.isStandalone ? 'OUI' : 'NON'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Plateforme:</span>
                <span className="text-white font-mono text-[10px]">
                  {deviceInfo.platform}
                </span>
              </div>

              <div className="mt-2 pt-2 border-t border-gray-700">
                <span className="text-gray-400">User Agent:</span>
                <p className="text-white font-mono text-[9px] mt-1 break-all">
                  {deviceInfo.userAgent}
                </p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-900/30 border border-blue-700 rounded p-3">
            <h3 className="text-sm font-semibold text-blue-400 mb-2">
              💡 Comment tester :
            </h3>
            <ul className="text-xs space-y-1 text-blue-300">
              <li>• <strong>Mode Tablette</strong>: Simule une tablette avec plein écran</li>
              <li>• <strong>Prompt iOS</strong>: Affiche le message d&apos;installation</li>
              <li>• Ajoutez <code className="bg-gray-800 px-1 rounded">?debug=tablet</code> à l&apos;URL</li>
              <li>• Ou utilisez les boutons ci-dessus</li>
            </ul>
          </div>

          {/* Reset localStorage */}
          <div className="pt-2 border-t border-gray-700">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                localStorage.removeItem('ios-install-prompt-declined');
                alert('✅ Cache du prompt iOS réinitialisé !');
              }}
              className="w-full text-xs"
            >
              🗑️ Réinitialiser le cache du prompt
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

