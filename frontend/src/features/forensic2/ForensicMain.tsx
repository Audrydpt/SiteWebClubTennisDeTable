/* eslint-disable no-console */
import { Route, Routes } from 'react-router-dom';

import Header from '@/components/header';
import { Card, CardContent } from '@/components/ui/card';

import Display from './components/display';
import ForensicForm from './components/form';
import { SortButtons } from './components/ui/buttons';
import JobTabs from './components/ui/job-tabs';
import MultiProgress from './components/ui/multi-progress';
import ForensicFormProvider from './providers/forensic-form-provider';
import { useJobsContext } from './providers/job-context';
import JobsProvider from './providers/job-provider';
import SearchProvider from './providers/search-provider';

function Forensic() {
  const { addNewTab } = useJobsContext();

  return (
    <div className="flex h-full w-full">
      {/* Panneau du formulaire */}
      <Card className="h-full flex flex-col w-[350px]">
        <CardContent className="p4 h-full flex flex-col">
          <ForensicForm onSubmit={addNewTab} />
        </CardContent>
      </Card>

      <Card className="h-full flex-1 ml-2">
        <CardContent className="p-10 pb-8 h-full">
          <Header title="Recherche à postériori" />

          {/* Panneau des onglets */}
          <div className="mb-4">
            <div className="flex justify-between items-center gap-4">
              <div className="flex-grow">
                <JobTabs />
              </div>
              <div className="flex-shrink-0">
                <SortButtons />
              </div>
            </div>
            <MultiProgress />
          </div>

          {/* Panneau des résultats */}
          <Display />
        </CardContent>
      </Card>
    </div>
  );
}

export default function ForensicMain() {
  return (
    <JobsProvider>
      <SearchProvider>
        <ForensicFormProvider>
          <Routes>
            <Route index element={<Forensic />} />
            <Route path=":taskId" element={<Forensic />} />
          </Routes>{' '}
        </ForensicFormProvider>
      </SearchProvider>
    </JobsProvider>
  );
}
