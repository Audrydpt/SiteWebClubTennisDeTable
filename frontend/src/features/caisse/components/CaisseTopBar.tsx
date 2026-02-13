/* eslint-disable */
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/authContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ShoppingCart,
  BookOpen,
  History,
  Package,
  LogOut,
  Maximize,
  Minimize,
  GripVertical,
  Wallet,
} from 'lucide-react';

export type CaisseView =
  | 'vente'
  | 'ardoises'
  | 'historique'
  | 'stock'
  | 'solde';

interface CaisseTopBarProps {
  activeView: CaisseView;
  onViewChange: (view: CaisseView) => void;
  isEditMode: boolean;
  onEditModeToggle: () => void;
  onFacebookClick?: () => void;
}

const tabs: { id: CaisseView; label: string; icon: React.ElementType }[] = [
  { id: 'vente', label: 'Vente', icon: ShoppingCart },
  { id: 'ardoises', label: 'Comptes', icon: BookOpen },
  { id: 'historique', label: 'Historique', icon: History },
  { id: 'stock', label: 'Stock', icon: Package },
  { id: 'solde', label: 'Solde', icon: Wallet },
];

export default function CaisseTopBar({
  activeView,
  onViewChange,
  isEditMode,
  onEditModeToggle,
  onFacebookClick,
}: CaisseTopBarProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () =>
      document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  }, []);

  const handleQuit = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="h-14 bg-[#2C2C2C] flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-[#F1C40F] font-bold text-lg">Caisse</span>
      </div>

      <div className="flex items-center gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeView === tab.id;
          return (
            <Button
              key={tab.id}
              variant="ghost"
              onClick={() => onViewChange(tab.id)}
              className={`h-10 px-4 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#F1C40F] text-[#2C2C2C] hover:bg-[#F1C40F]/90'
                  : 'text-gray-400 hover:text-white hover:bg-[#3A3A3A]'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.label}
            </Button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        {onFacebookClick && (
          <Button
            variant="ghost"
            onClick={onFacebookClick}
            className="h-10 px-3 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-[#3A3A3A]"
            title="Copier message Facebook"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="mr-2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Facebook
          </Button>
        )}
        <Button
          variant="ghost"
          onClick={onEditModeToggle}
          className={`h-10 px-3 rounded-lg transition-colors ${
            isEditMode
              ? 'bg-[#F1C40F] text-[#2C2C2C] hover:bg-[#F1C40F]/90'
              : 'text-gray-400 hover:text-white hover:bg-[#3A3A3A]'
          }`}
          title={
            isEditMode
              ? 'Désactiver le mode édition'
              : 'Activer le mode édition'
          }
        >
          <GripVertical className="w-4 h-4 mr-2" />
          {isEditMode ? 'Mode édition' : 'Édition'}
        </Button>
        <Button
          variant="ghost"
          onClick={toggleFullscreen}
          className="h-10 w-10 p-0 text-gray-400 hover:text-white hover:bg-[#3A3A3A] rounded-lg"
          title={isFullscreen ? 'Quitter plein ecran' : 'Plein ecran'}
        >
          {isFullscreen ? (
            <Minimize className="w-4 h-4" />
          ) : (
            <Maximize className="w-4 h-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          onClick={handleQuit}
          className="h-10 px-3 text-gray-400 hover:text-red-400 hover:bg-[#3A3A3A] rounded-lg"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Quitter
        </Button>
      </div>
    </div>
  );
}
