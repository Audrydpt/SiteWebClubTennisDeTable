import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/authContext';
import { Button } from '@/components/ui/button';
import {
  ShoppingCart,
  BookOpen,
  History,
  Package,
  LogOut,
} from 'lucide-react';

export type CaisseView = 'vente' | 'ardoises' | 'historique' | 'stock';

interface CaisseTopBarProps {
  activeView: CaisseView;
  onViewChange: (view: CaisseView) => void;
}

const tabs: { id: CaisseView; label: string; icon: React.ElementType }[] = [
  { id: 'vente', label: 'Vente', icon: ShoppingCart },
  { id: 'ardoises', label: 'Ardoises', icon: BookOpen },
  { id: 'historique', label: 'Historique', icon: History },
  { id: 'stock', label: 'Stock', icon: Package },
];

export default function CaisseTopBar({
  activeView,
  onViewChange,
}: CaisseTopBarProps) {
  const { logout } = useAuth();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

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

      <div className="flex items-center gap-4">
        <span className="text-gray-400 text-sm tabular-nums">
          {time.toLocaleTimeString('fr-BE', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
        <Button
          variant="ghost"
          onClick={logout}
          className="h-10 px-3 text-gray-400 hover:text-red-400 hover:bg-[#3A3A3A] rounded-lg"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Quitter
        </Button>
      </div>
    </div>
  );
}
