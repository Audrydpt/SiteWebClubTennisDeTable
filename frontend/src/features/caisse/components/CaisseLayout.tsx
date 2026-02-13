import { ReactNode } from 'react';

interface CaisseLayoutProps {
  leftPanel: ReactNode;
  centerPanel: ReactNode;
  rightPanel: ReactNode;
}

export default function CaisseLayout({
  leftPanel,
  centerPanel,
  rightPanel,
}: CaisseLayoutProps) {
  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Articles - Gauche */}
      <div className="w-[50%] bg-[#3A3A3A] p-4 flex flex-col overflow-hidden">
        {leftPanel}
      </div>
      {/* Panier - Centre */}
      <div className="w-[25%] bg-[#2C2C2C] border-l border-[#4A4A4A] p-4 flex flex-col overflow-hidden">
        {centerPanel}
      </div>
      {/* Comptes actifs - Droite */}
      <div className="w-[25%] bg-[#252525] border-l border-[#4A4A4A] p-4 flex flex-col overflow-hidden">
        {rightPanel}
      </div>
    </div>
  );
}
