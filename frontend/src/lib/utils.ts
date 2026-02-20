import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Plat } from '@/services/type';

// eslint-disable-next-line import/prefer-default-export
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calcule le stock réel d'un plat en fonction de ses ingrédients (recette)
 * Si le plat a une recette (sousProduitsIds), le stock est limité par l'ingrédient le moins disponible
 * Si un ingrédient a 0, la quantité du plat devient 0
 * @param plat - Le plat pour lequel calculer le stock
 * @param allPlats - Tous les plats (pour accéder aux stocks des ingrédients)
 * @returns Le stock réel du plat
 */
export function calculateRealStock(plat: Plat, allPlats: Plat[]): number {
  // Si le plat n'a pas de recette, retourner son stock direct
  if (!plat.sousProduitsIds || plat.sousProduitsIds.length === 0) {
    return plat.stock ?? 0;
  }

  // Vérifier si au moins un ingrédient est à 0
  const hasZeroIngredient = plat.sousProduitsIds.some((ingredient) => {
    const ingredientPlat = allPlats.find(
      (p) => String(p.id) === String(ingredient.platId)
    );
    return !ingredientPlat || (ingredientPlat.stock ?? 0) === 0;
  });

  if (hasZeroIngredient) {
    // Si un ingrédient est manquant ou à 0, le plat ne peut pas être fait
    return 0;
  }

  // Calculer la quantité limitée par l'ingrédient le moins disponible
  let minQuantity = Infinity;
  plat.sousProduitsIds.forEach((ingredient) => {
    const ingredientPlat = allPlats.find(
      (p) => String(p.id) === String(ingredient.platId)
    );
    if (ingredientPlat && ingredientPlat.stock !== undefined) {
      // Diviser le stock disponible par la quantité requise dans la recette
      const availableRecipes = Math.floor(
        ingredientPlat.stock / ingredient.quantite
      );
      minQuantity = Math.min(minQuantity, availableRecipes);
    }
  });

  return minQuantity === Infinity ? 0 : minQuantity;
}
