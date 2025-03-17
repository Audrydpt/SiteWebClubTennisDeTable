import { useRef } from 'react';

/**
 * useLatest hook
 *
 * Ce hook renvoie une référence qui contient toujours la dernière valeur.
 * Utile lorsque vous avez besoin d'accéder à la dernière valeur d'une prop ou d'un état
 * dans un callback qui pourrait être "stale" (closure problem).
 *
 * @template T Le type de la valeur à référencer
 * @param {T} value - La valeur à référencer
 * @returns {MutableRefObject<T>} - Une référence qui contient toujours la dernière valeur
 */
export default function useLatest<T>(value: T) {
  const ref = useRef<T>(value);

  ref.current = value;

  return ref;
}
