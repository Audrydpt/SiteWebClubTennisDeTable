import type { Plat } from '@/services/type';
import { ShoppingBag } from 'lucide-react';

interface ArticleCardProps {
  plat: Plat;
  onAdd: (plat: Plat) => void;
}

export default function ArticleCard({ plat, onAdd }: ArticleCardProps) {
  const isOutOfStock = plat.stock !== undefined && plat.stock <= 0;
  const isLowStock = plat.stock !== undefined && plat.stock > 0 && plat.stock <= 3;

  return (
    <button
      onClick={() => !isOutOfStock && onAdd(plat)}
      disabled={isOutOfStock}
      className={`relative flex flex-col items-center rounded-xl border-2 border-[#4A4A4A] overflow-hidden min-h-[120px] transition-transform select-none bg-[#4A4A4A] ${
        isOutOfStock
          ? 'opacity-40 cursor-not-allowed'
          : 'active:scale-95 cursor-pointer hover:border-[#F1C40F]/50 hover:brightness-110'
      }`}
    >
      {/* Stock badge */}
      {plat.stock !== undefined && (
        <span
          className={`absolute top-1.5 right-1.5 z-10 text-xs font-bold px-1.5 py-0.5 rounded-full ${
            isOutOfStock
              ? 'bg-red-600 text-white'
              : isLowStock
                ? 'bg-red-500 text-white'
                : 'bg-gray-600 text-gray-200'
          }`}
        >
          {plat.stock}
        </span>
      )}

      {/* Image */}
      {plat.imageUrl ? (
        <div className="w-full h-16 bg-[#3A3A3A] overflow-hidden">
          <img
            src={plat.imageUrl}
            alt={plat.nom}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-full h-16 bg-[#3A3A3A] flex items-center justify-center">
          <ShoppingBag className="w-6 h-6 text-gray-600" />
        </div>
      )}

      {/* Info */}
      <div className="flex flex-col items-center justify-center flex-1 p-2">
        <span className="text-white font-medium text-xs text-center leading-tight line-clamp-2">
          {plat.nom}
        </span>
        <span className="text-[#F1C40F] font-bold text-base mt-0.5">
          {plat.prix.toFixed(2)}&euro;
        </span>
      </div>
    </button>
  );
}
