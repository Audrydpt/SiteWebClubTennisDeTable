import { Item } from './types';

export default function sortStreamsByNumericId(streams: Item[]): Item[] {
  return [...streams].sort((a, b) => {
    const idA = parseInt(a.id, 10);
    const idB = parseInt(b.id, 10);
    return Number.isNaN(idA) || Number.isNaN(idB) ? 0 : idA - idB;
  });
}
