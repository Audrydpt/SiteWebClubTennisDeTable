/* eslint-disable */
import { useState, useEffect } from 'react';
import { ReactSortable } from 'react-sortablejs';
import type { Plat, CategorieCaisse } from '@/services/type';
import { Button } from '@/components/ui/button';
import ArticleCard from './ArticleCard';
import { reorderCategoriesCaisse, reorderPlatsCaisse } from '@/services/api';

interface ArticleGridProps {
  plats: Plat[];
  categories: CategorieCaisse[];
  onAddToCart: (plat: Plat) => void;
  onReordered?: () => void;
}

export default function ArticleGrid({
  plats,
  categories,
  onAddToCart,
  onReordered,
}: ArticleGridProps) {
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [sortableCategories, setSortableCategories] = useState<
    (CategorieCaisse & { count: number })[]
  >([]);
  const [sortablePlats, setSortablePlats] = useState<Plat[]>([]);

  const availablePlats = plats.filter((p) => p.disponible);

  // Sync categories from props
  useEffect(() => {
    const sorted = [...categories].sort((a, b) => a.ordre - b.ordre);
    const withCounts = sorted.map((cat) => ({
      ...cat,
      count: availablePlats.filter((p) => p.categorie === cat.nom).length,
    }));
    setSortableCategories(withCounts);
  }, [categories, plats]);

  // Set default category to first one
  useEffect(() => {
    if (!activeCategory && sortableCategories.length > 0) {
      setActiveCategory(sortableCategories[0].nom);
    }
  }, [sortableCategories, activeCategory]);

  // Sync filtered plats when category or plats change
  useEffect(() => {
    const filtered = activeCategory
      ? availablePlats.filter((p) => p.categorie === activeCategory)
      : availablePlats;
    const sorted = [...filtered].sort(
      (a, b) => (a.ordre ?? 999) - (b.ordre ?? 999)
    );
    setSortablePlats(sorted);
  }, [plats, activeCategory]);

  const handleCategoryReorder = async (
    newList: (CategorieCaisse & { count: number })[]
  ) => {
    setSortableCategories(newList);
    const orderedIds = newList.map((cat, index) => ({
      id: cat.id,
      ordre: index,
    }));
    try {
      await reorderCategoriesCaisse(orderedIds);
      onReordered?.();
    } catch (err) {
      console.error('Erreur reorder categories:', err);
    }
  };

  const handleProductReorder = async (newList: Plat[]) => {
    setSortablePlats(newList);
    const orderedItems = newList.map((plat, index) => ({
      id: plat.id,
      ordre: index,
    }));
    try {
      await reorderPlatsCaisse(orderedItems);
      onReordered?.();
    } catch (err) {
      console.error('Erreur reorder plats:', err);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ReactSortable
        list={sortableCategories}
        setList={handleCategoryReorder}
        className="flex gap-2 mb-4 overflow-x-auto pb-1"
        animation={200}
        ghostClass="opacity-40"
        forceFallback={true}
        delay={150}
        delayOnTouchOnly={true}
      >
        {sortableCategories.map((cat) => (
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
      </ReactSortable>
      {sortableCategories.length === 0 && (
        <p className="text-gray-500 text-sm mb-4">
          Aucune categorie. Ajoutez-en via l'onglet Stock.
        </p>
      )}

      {sortablePlats.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Aucun article dans cette categorie
        </div>
      ) : (
        <ReactSortable
          list={sortablePlats}
          setList={handleProductReorder}
          className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3"
          animation={200}
          ghostClass="opacity-40"
          forceFallback={true}
          delay={150}
          delayOnTouchOnly={true}
        >
          {sortablePlats.map((plat) => (
            <ArticleCard key={plat.id} plat={plat} onAdd={onAddToCart} />
          ))}
        </ReactSortable>
      )}
    </div>
  );
}
