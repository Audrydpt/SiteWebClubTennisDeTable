import { ReactNode } from 'react';

interface CaisseLayoutProps {
  leftPanel: ReactNode;
  rightPanel: ReactNode;
}

export default function CaisseLayout({
  leftPanel,
  rightPanel,
}: CaisseLayoutProps) {
  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="w-[65%] bg-[#3A3A3A] p-4 flex flex-col overflow-hidden">
        {leftPanel}
      </div>
      <div className="w-[35%] bg-[#2C2C2C] border-l border-[#4A4A4A] p-4 flex flex-col overflow-hidden">
        {rightPanel}
      </div>
    </div>
  );
}
