import { useState } from 'react';
import type { Plat } from '@/services/type';
import { Button } from '@/components/ui/button';
import ArticleCard from './ArticleCard';

interface ArticleGridProps {
  plats: Plat[];
  onAddToCart: (plat: Plat) => void;
}

const categories = [
  { id: 'boisson', label: 'Boissons' },
  { id: 'entree', label: 'Entrees' },
  { id: 'plat', label: 'Plats' },
  { id: 'dessert', label: 'Desserts' },
] as const;

export default function ArticleGrid({ plats, onAddToCart }: ArticleGridProps) {
  const [activeCategory, setActiveCategory] = useState<string>('boisson');

  const availablePlats = plats.filter((p) => p.disponible);
  const filteredPlats = availablePlats.filter(
    (p) => p.categorie === activeCategory
  );

  const categoryCounts = categories.map((cat) => ({
    ...cat,
    count: availablePlats.filter((p) => p.categorie === cat.id).length,
  }));

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-2 mb-4">
        {categoryCounts.map((cat) => (
          <Button
            key={cat.id}
            variant="ghost"
            onClick={() => setActiveCategory(cat.id)}
            className={`h-11 px-5 rounded-xl text-sm font-medium transition-colors ${
              activeCategory === cat.id
                ? 'bg-[#F1C40F] text-[#2C2C2C] hover:bg-[#F1C40F]/90'
                : 'bg-[#4A4A4A] text-gray-300 hover:bg-[#555] hover:text-white'
            }`}
          >
            {cat.label}
            {cat.count > 0 && (
              <span className="ml-1.5 text-xs opacity-70">({cat.count})</span>
            )}
          </Button>
        ))}
      </div>

      {filteredPlats.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Aucun article dans cette categorie
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {filteredPlats.map((plat) => (
            <ArticleCard key={plat.id} plat={plat} onAdd={onAddToCart} />
          ))}
        </div>
      )}
    </div>
  );
}
