import { createContext, useContext } from 'react';

import useSearch from '../hooks/use-search';

type ContextType = ReturnType<typeof useSearch>;

export const SearchContext = createContext<ContextType | null>(null);

export function useSearchContext() {
  const context = useContext(SearchContext);

  if (!context) {
    throw new Error('useSearchContext must be used within a SearchProvider');
  }

  return context;
}
