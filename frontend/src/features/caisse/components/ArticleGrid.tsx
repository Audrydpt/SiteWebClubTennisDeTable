/* eslint-disable */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { ReactSortable } from 'react-sortablejs';
import type { Plat, CategorieCaisse } from '@/services/type';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GripVertical } from 'lucide-react';
import ArticleCard from './ArticleCard';
import { reorderCategoriesCaisse, reorderPlatsCaisse } from '@/services/api';

interface ArticleGridProps {
  plats: Plat[];
  categories: CategorieCaisse[];
  onAddToCart: (plat: Plat) => void;
  onReordered?: () => void;
  isEditMode?: boolean;
}

export default function ArticleGrid({
  plats,
  categories,
  onAddToCart,
  onReordered,
  isEditMode = false,
}: ArticleGridProps) {
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [sortableCategories, setSortableCategories] = useState<
    (CategorieCaisse & { count: number })[]
  >([]);
  const [sortablePlats, setSortablePlats] = useState<Plat[]>([]);

  const availablePlats = useMemo(() => {
    return plats.filter((p) => p.disponible);
  }, [plats]);

  // Sync categories from props
  useEffect(() => {
    if (isReordering) return;

    const sorted = [...categories].sort((a, b) => a.ordre - b.ordre);
    const withCounts = sorted.map((cat) => ({
      ...cat,
      count: availablePlats.filter((p) => p.categorie === cat.nom).length,
    }));
    setSortableCategories(withCounts);
  }, [categories, availablePlats, isReordering]);

  // Set default category to first one
  useEffect(() => {
    if (!activeCategory && sortableCategories.length > 0) {
      setActiveCategory(sortableCategories[0].nom);
    }
  }, [sortableCategories, activeCategory]);

  // Sync filtered plats when category or plats change
  useEffect(() => {
    if (isReordering) return;

    const filtered = activeCategory
      ? availablePlats.filter((p) => p.categorie === activeCategory)
      : availablePlats;
    const sorted = [...filtered].sort(
      (a, b) => (a.ordre ?? 999) - (b.ordre ?? 999)
    );
    setSortablePlats(sorted);
  }, [availablePlats, activeCategory, isReordering]);

  const handleCategoryReorder = useCallback(async (
    newList: (CategorieCaisse & { count: number })[]
  ) => {
    setIsReordering(true);
    setSortableCategories(newList);

    const orderedIds = newList.map((cat, index) => ({
      id: cat.id,
      ordre: index,
    }));

    try {
      await reorderCategoriesCaisse(orderedIds);
      await new Promise(resolve => setTimeout(resolve, 500));
      onReordered?.();
      setTimeout(() => setIsReordering(false), 1000);
    } catch (err) {
      console.error('Erreur reorder categories:', err);
      setIsReordering(false);
    }
  }, [onReordered]);

  const handleProductReorder = useCallback(async (newList: Plat[]) => {
    setIsReordering(true);
    setSortablePlats(newList);

    const orderedItems = newList.map((plat, index) => ({
      id: plat.id,
      ordre: index,
    }));

    try {
      await reorderPlatsCaisse(orderedItems);
      await new Promise(resolve => setTimeout(resolve, 500));
      onReordered?.();
      setTimeout(() => setIsReordering(false), 1000);
    } catch (err) {
      console.error('Erreur reorder plats:', err);
      setIsReordering(false);
    }
  }, [onReordered]);

  return (
    <div className="flex flex-col h-full">
      {isEditMode ? (
        <ReactSortable
          list={sortableCategories}
          setList={handleCategoryReorder}
          className="flex gap-2 mb-4 overflow-x-auto pb-1"
          animation={200}
          easing="cubic-bezier(0.4, 0.0, 0.2, 1)"
          ghostClass="opacity-40"
          chosenClass="scale-105"
          dragClass="rotate-2"
          forceFallback={false}
          fallbackTolerance={3}
          delay={100}
          delayOnTouchOnly={true}
          touchStartThreshold={5}
          swapThreshold={0.65}
          onStart={() => console.log('[ArticleGrid] Catégories - Drag START')}
          onEnd={() => console.log('[ArticleGrid] Catégories - Drag END')}
          onChange={(_order, _sortable, evt) => {
            console.log('[ArticleGrid] Catégories - Ordre changé!', evt);
          }}
        >
          {sortableCategories.map((cat) => (
            <Button
              key={cat.id}
              variant="ghost"
              onClick={() => setActiveCategory(cat.nom)}
              className={`h-11 px-5 rounded-xl text-sm font-medium transition-colors shrink-0 cursor-move ${
                activeCategory === cat.nom
                  ? 'bg-[#F1C40F] text-[#2C2C2C] hover:bg-[#F1C40F]/90'
                  : 'bg-[#4A4A4A] text-gray-300 hover:bg-[#555] hover:text-white'
              }`}
            >
              <GripVertical className="w-4 h-4 mr-1.5 opacity-50" />
              {cat.nom}
              {cat.count > 0 && (
                <span className="ml-1.5 text-xs opacity-70">({cat.count})</span>
              )}
            </Button>
          ))}
        </ReactSortable>
      ) : (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
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
        </div>
      )}
      {sortableCategories.length === 0 && (
        <p className="text-gray-500 text-sm mb-4">
          Aucune categorie. Ajoutez-en via l'onglet Stock.
        </p>
      )}

      {sortablePlats.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Aucun article dans cette categorie
        </div>
      ) : isEditMode ? (
        <ScrollArea className="flex-1">
          <ReactSortable
            list={sortablePlats}
            setList={handleProductReorder}
            className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 pr-4 pb-4"
            animation={200}
            easing="cubic-bezier(0.4, 0.0, 0.2, 1)"
            ghostClass="opacity-40"
            chosenClass="scale-105"
            dragClass="rotate-2"
            filter=".pointer-events-none"
            preventOnFilter={false}
            forceFallback={false}
            fallbackTolerance={3}
            delay={100}
            delayOnTouchOnly={true}
            touchStartThreshold={5}
            swapThreshold={0.65}
            invertSwap={false}
            direction="horizontal"
            onStart={() => {
              console.log('[ArticleGrid] Produits - Drag START');
              setIsDragging(true);
            }}
            onEnd={() => {
              console.log('[ArticleGrid] Produits - Drag END');
              setTimeout(() => setIsDragging(false), 50);
            }}
            onChange={(_order, _sortable, evt) => {
              console.log('[ArticleGrid] Produits - Ordre changé!', evt);
            }}
          >
            {sortablePlats.map((plat) => (
              <ArticleCard
                key={plat.id}
                plat={plat}
                onAdd={onAddToCart}
                isDragging={isDragging}
                isEditMode={true}
              />
            ))}
          </ReactSortable>
        </ScrollArea>
      ) : (
        <ScrollArea className="flex-1">
          <div className="grid grid-cols-4 gap-3 pr-4 pb-4">
            {sortablePlats.map((plat) => (
              <ArticleCard
                key={plat.id}
                plat={plat}
                onAdd={onAddToCart}
                isDragging={false}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
