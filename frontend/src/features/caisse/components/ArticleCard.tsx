import type { Plat } from '@/services/type';

interface ArticleCardProps {
  plat: Plat;
  onAdd: (plat: Plat) => void;
}

const categoryColors: Record<string, string> = {
  boisson: 'border-blue-500/50 bg-blue-500/10',
  entree: 'border-green-500/50 bg-green-500/10',
  plat: 'border-orange-500/50 bg-orange-500/10',
  dessert: 'border-purple-500/50 bg-purple-500/10',
};

export default function ArticleCard({ plat, onAdd }: ArticleCardProps) {
  const isOutOfStock = plat.stock !== undefined && plat.stock <= 0;
  const isLowStock = plat.stock !== undefined && plat.stock > 0 && plat.stock <= 3;
  const color = categoryColors[plat.categorie] || 'border-gray-500/50 bg-gray-500/10';

  return (
    <button
      onClick={() => !isOutOfStock && onAdd(plat)}
      disabled={isOutOfStock}
      className={`relative flex flex-col items-center justify-center rounded-xl border-2 p-3 min-h-[100px] transition-transform select-none ${color} ${
        isOutOfStock
          ? 'opacity-40 cursor-not-allowed'
          : 'active:scale-95 cursor-pointer hover:brightness-110'
      }`}
    >
      {plat.stock !== undefined && (
        <span
          className={`absolute top-1.5 right-1.5 text-xs font-bold px-1.5 py-0.5 rounded-full ${
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
      <span className="text-white font-medium text-sm text-center leading-tight">
        {plat.nom}
      </span>
      <span className="text-[#F1C40F] font-bold text-lg mt-1">
        {plat.prix.toFixed(2)}&euro;
      </span>
    </button>
  );
}
