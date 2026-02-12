/* eslint-disable */
import { useState, useEffect } from 'react';
import type { Plat, CategorieCaisse } from '@/services/type';
import { Button } from '@/components/ui/button';
import ArticleCard from './ArticleCard';

interface ArticleGridProps {
  plats: Plat[];
  categories: CategorieCaisse[];
  onAddToCart: (plat: Plat) => void;
}

export default function ArticleGrid({
  plats,
  categories,
  onAddToCart,
}: ArticleGridProps) {
  const sortedCategories = [...categories].sort((a, b) => a.ordre - b.ordre);
  const [activeCategory, setActiveCategory] = useState<string>('');

  // Set default category to first one
  useEffect(() => {
    if (!activeCategory && sortedCategories.length > 0) {
      setActiveCategory(sortedCategories[0].nom);
    }
  }, [sortedCategories, activeCategory]);

  const availablePlats = plats.filter((p) => p.disponible);
  const filteredPlats = activeCategory
    ? availablePlats.filter((p) => p.categorie === activeCategory)
    : availablePlats;

  const categoryCounts = sortedCategories.map((cat) => ({
    ...cat,
    count: availablePlats.filter((p) => p.categorie === cat.nom).length,
  }));

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {categoryCounts.map((cat) => (
          <Button
            key={cat.id}
            variant="ghost"
            onClick={() => setActiveCategory(cat.nom)}
            className={`h-11 px-5 rounded-xl text-sm font-medium transition-colors shrink-0 ${
              activeCategory === cat.nom
                ? 'bg-[#F1C40F] text-[#2C2C2C] hover:bg-[#F1C40F]/90'
                : 'bg-[#4A4A4A] text-gray-300 hover:bg-[#555] hover:text-white'
            }`}
          >
            {cat.nom}
            {cat.count > 0 && (
              <span className="ml-1.5 text-xs opacity-70">({cat.count})</span>
            )}
          </Button>
        ))}
        {sortedCategories.length === 0 && (
          <p className="text-gray-500 text-sm">
            Aucune categorie. Ajoutez-en via l'onglet Stock.
          </p>
        )}
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
