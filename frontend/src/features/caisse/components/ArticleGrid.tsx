/* eslint-disable */
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  const [sortableCategories, setSortableCategories] = useState<
    (CategorieCaisse & { count: number })[]
  >([]);
  const [sortablePlats, setSortablePlats] = useState<Plat[]>([]);

  // Utiliser des refs pour bloquer la synchronisation pendant le drag
  const isCategoryDragging = useRef(false);
  const isProductDragging = useRef(false);
  const pendingCategoryReorder = useRef<
    (CategorieCaisse & { count: number })[] | null
  >(null);
  const pendingProductReorder = useRef<Plat[] | null>(null);

  const availablePlats = useMemo(() => {
    return plats.filter((p) => p.disponible);
  }, [plats]);

  // Sync categories from props - seulement si pas en cours de drag
  useEffect(() => {
    if (isCategoryDragging.current) return;

    const sorted = [...categories].sort((a, b) => a.ordre - b.ordre);
    const withCounts = sorted.map((cat) => ({
      ...cat,
      count: availablePlats.filter((p) => p.categorie === cat.nom).length,
    }));
    setSortableCategories(withCounts);
  }, [categories, availablePlats]);

  // Set default category to first one
  useEffect(() => {
    if (!activeCategory && sortableCategories.length > 0) {
      setActiveCategory(sortableCategories[0].nom);
    }
  }, [sortableCategories, activeCategory]);

  // Sync filtered plats when category or plats change - seulement si pas en cours de drag
  useEffect(() => {
    if (isProductDragging.current) return;

    const filtered = activeCategory
      ? availablePlats.filter((p) => p.categorie === activeCategory)
      : availablePlats;
    const sorted = [...filtered].sort(
      (a, b) => (a.ordre ?? 999) - (b.ordre ?? 999)
    );
    setSortablePlats(sorted);
  }, [availablePlats, activeCategory]);

  // Handler pour le changement de liste des catégories (appelé pendant le drag)
  const handleCategoryListChange = useCallback(
    (newList: (CategorieCaisse & { count: number })[]) => {
      pendingCategoryReorder.current = newList;
      setSortableCategories(newList);
    },
    []
  );

  // Handler appelé à la fin du drag des catégories
  const handleCategoryDragEnd = useCallback(async () => {
    console.log('[ArticleGrid] Catégories - Drag END');

    const newList = pendingCategoryReorder.current;
    if (!newList) {
      isCategoryDragging.current = false;
      return;
    }

    const orderedIds = newList.map((cat, index) => ({
      id: cat.id,
      ordre: index,
    }));

    try {
      await reorderCategoriesCaisse(orderedIds);
      // Garder l'état local après la sauvegarde réussie
      pendingCategoryReorder.current = null;
      isCategoryDragging.current = false;
      // Notifier le parent pour rafraîchir (optionnel, l'état local est déjà correct)
      onReordered?.();
    } catch (err) {
      console.error('Erreur reorder categories:', err);
      isCategoryDragging.current = false;
      pendingCategoryReorder.current = null;
    }
  }, [onReordered]);

  // Handler pour le changement de liste des produits (appelé pendant le drag)
  const handleProductListChange = useCallback((newList: Plat[]) => {
    pendingProductReorder.current = newList;
    setSortablePlats(newList);
  }, []);

  // Handler appelé à la fin du drag des produits
  const handleProductDragEnd = useCallback(async () => {
    console.log('[ArticleGrid] Produits - Drag END');
    setTimeout(() => setIsDragging(false), 50);

    const newList = pendingProductReorder.current;
    if (!newList) {
      isProductDragging.current = false;
      return;
    }

    const orderedItems = newList.map((plat, index) => ({
      id: plat.id,
      ordre: index,
    }));

    try {
      await reorderPlatsCaisse(orderedItems);
      // Garder l'état local après la sauvegarde réussie
      pendingProductReorder.current = null;
      isProductDragging.current = false;
      // Notifier le parent pour rafraîchir (optionnel, l'état local est déjà correct)
      onReordered?.();
    } catch (err) {
      console.error('Erreur reorder plats:', err);
      isProductDragging.current = false;
      pendingProductReorder.current = null;
    }
  }, [onReordered]);

  return (
    <div className="flex flex-col h-full min-h-0">
      {isEditMode ? (
        <ReactSortable
          list={sortableCategories}
          setList={handleCategoryListChange}
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
          onStart={() => {
            console.log('[ArticleGrid] Catégories - Drag START');
            isCategoryDragging.current = true;
          }}
          onEnd={handleCategoryDragEnd}
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
        <ScrollArea className="flex-1 min-h-0">
          <ReactSortable
            list={sortablePlats}
            setList={handleProductListChange}
            className="grid grid-cols-4 gap-3 pr-4 pb-4"
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
              isProductDragging.current = true;
              setIsDragging(true);
            }}
            onEnd={handleProductDragEnd}
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
        <ScrollArea className="flex-1 min-h-0">
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
