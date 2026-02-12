/* eslint-disable */
import { memo } from 'react';
import type { Plat } from '@/services/type';
import { ShoppingBag } from 'lucide-react';

interface ArticleCardProps {
  plat: Plat;
  onAdd: (plat: Plat) => void;
  isDragging?: boolean;
  isEditMode?: boolean;
}

const ArticleCard = memo(function ArticleCard({
  plat,
  onAdd,
  isDragging = false,
  isEditMode = false,
}: ArticleCardProps) {
  const isOutOfStock = plat.stock !== undefined && plat.stock <= 0;
  const isLowStock =
    plat.stock !== undefined && plat.stock > 0 && plat.stock <= 3;

  const handleClick = (e: React.MouseEvent) => {
    if (isEditMode) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (!isOutOfStock && !isDragging) {
      onAdd(plat);
    }
  };

  const className = `relative flex flex-col items-center rounded-xl border-2 border-[#4A4A4A] overflow-hidden min-h-[120px] transition-transform select-none bg-[#4A4A4A] ${
    isOutOfStock
      ? 'opacity-40 cursor-not-allowed'
      : isEditMode
        ? 'cursor-move hover:border-[#F1C40F]/50'
        : 'active:scale-95 cursor-pointer hover:border-[#F1C40F]/50 hover:brightness-110'
  }`;

  const content = (
    <>
      {/* Stock badge */}
      {plat.stock !== undefined && (
        <span
          className={`absolute top-1.5 right-1.5 z-10 text-xs font-bold px-1.5 py-0.5 rounded-full pointer-events-none ${
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

      {/* Image - Format vertical fixe */}
      {plat.imageUrl ? (
        <div className="w-full h-50 bg-[#3A3A3A] overflow-hidden flex items-center justify-center">
          <img
            src={plat.imageUrl}
            alt={plat.nom}
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>
      ) : (
        <div className="w-full h-32 bg-[#3A3A3A] flex items-center justify-center">
          <ShoppingBag className="w-8 h-8 text-gray-600" />
        </div>
      )}

      {/* Info */}
      <div className="flex flex-col items-center justify-center p-3 w-full">
        <span className="text-white font-medium text-sm text-center leading-tight line-clamp-2 mb-1">
          {plat.nom}
        </span>
        <span className="text-[#F1C40F] font-bold text-lg">
          {plat.prix.toFixed(2)}&euro;
        </span>
      </div>
    </>
  );

  if (isEditMode) {
    return (
      <div className={className} data-id={plat.id}>
        {content}
      </div>
    );
  }

  return (
    <button onClick={handleClick} disabled={isOutOfStock} className={className}>
      {content}
    </button>
  );
});

export default ArticleCard;
