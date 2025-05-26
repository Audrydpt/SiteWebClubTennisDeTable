import { ReactNode } from 'react';
import useSearch from '../hooks/use-search';
import { SearchContext } from './search-context';

interface ProviderProps {
  children: ReactNode;
}

export default function SearchProvider({ children }: ProviderProps) {
  const state = useSearch();

  return (
    <SearchContext.Provider value={state}>{children}</SearchContext.Provider>
  );
}
