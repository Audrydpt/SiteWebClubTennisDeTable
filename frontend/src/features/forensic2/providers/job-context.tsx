import { createContext, useContext } from 'react';

import useJobs from '../hooks/use-jobs';

type ContextType = ReturnType<typeof useJobs>;

export const JobsContext = createContext<ContextType | null>(null);

export function useJobsContext() {
  const context = useContext(JobsContext);

  if (!context) {
    throw new Error('useJobsContext must be used within a JobsProvider');
  }

  return context;
}
