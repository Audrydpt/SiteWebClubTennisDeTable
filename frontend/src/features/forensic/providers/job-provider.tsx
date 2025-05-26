import { ReactNode } from 'react';
import useJobs from '../hooks/use-jobs';
import { JobsContext } from './job-context';

interface JobsProviderProps {
  children: ReactNode;
}

export default function JobsProvider({ children }: JobsProviderProps) {
  const state = useJobs();

  return <JobsContext.Provider value={state}>{children}</JobsContext.Provider>;
}
