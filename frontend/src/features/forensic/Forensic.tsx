import { Search } from 'lucide-react';

import { Accordion } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

import Appearances from '@/features/forensic/components/appareances';
import Attributes from '@/features/forensic/components/attributes';
import Sources from '@/features/forensic/components/sources';
import Times from '@/features/forensic/components/times';
import Types from '@/features/forensic/components/types';
import {
  ForensicFormProvider,
  ForensicFormValues,
  useForensicForm,
} from '@/features/forensic/lib/provider/forensic-form-context';

import { useAuth } from '@/providers/auth-context';
import useSearch, { ForensicResult } from './hooks/use-search';
import { createSearchFormData } from './lib/format-query';

function ForensicFormContent({
  onSubmit,
  isSearching,
  progress,
  closeWebSocket,
}: {
  onSubmit: (data: ForensicFormValues) => void;
  isSearching: boolean;
  progress: number | null;
  closeWebSocket: () => void;
}) {
  const { formMethods } = useForensicForm();

  return (
    <Form {...formMethods}>
      <form
        onSubmit={formMethods.handleSubmit(onSubmit)}
        className="flex flex-col h-full relative"
      >
        <ScrollArea className="flex-1 pr-4 pb-28">
          <div className="space-y-4">
            <Accordion type="single" defaultValue="sources" collapsible>
              <Sources />
              <Times />
              <Types />
              <Appearances />
              <Attributes />
            </Accordion>
          </div>
        </ScrollArea>

        {/* Fixed position buttons section with z-index to ensure visibility */}
        <div className="absolute bottom-0 left-0 right-0 pt-4 bg-card z-10">
          <Button type="submit" className="w-full">
            <Search className="mr-2" size={16} /> Lancer la recherche
          </Button>

          <Button
            onClick={closeWebSocket}
            variant="outline"
            size="sm"
            className="w-full mt-2"
            disabled={!isSearching}
          >
            Annuler la recherche
          </Button>

          {isSearching && progress !== null && (
            <Progress value={progress} className="h-2 mt-2" />
          )}
        </div>
      </form>
    </Form>
  );
}

export default function Forensic() {
  const { sessionId = '' } = useAuth();

  const {
    startSearch,
    initWebSocket,
    closeWebSocket,
    progress,
    results,
    isSearching,
  } = useSearch(sessionId);

  // Modified handleSearch in Forensic.tsx
  const handleSearch = async (data: ForensicFormValues) => {
    try {
      const searchFormData = createSearchFormData(data);
      const guid = await startSearch(searchFormData, 5);
      initWebSocket(guid);
    } catch (error) {
      console.error('Failed to start search:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[350px_1fr] gap-4 h-full">
      <Card className="h-[calc(100vh-2rem)] overflow-hidden flex flex-col">
        <CardContent className="p-4 h-full flex flex-col">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-lg font-semibold">Recherche vidéo</h1>
          </div>

          <ForensicFormProvider>
            <ForensicFormContent
              onSubmit={handleSearch}
              isSearching={isSearching}
              progress={progress}
              closeWebSocket={closeWebSocket}
            />
          </ForensicFormProvider>
        </CardContent>
      </Card>

      {/* Results Area */}
      <Card className="h-[calc(100vh-2rem)] overflow-hidden">
        <CardContent className="p-4 h-full">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Résultats de recherche</h2>
            {progress !== null && progress < 100 && (
              <div className="mt-2">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground mt-1">
                  Progression: {progress.toFixed(1)}%
                </p>
              </div>
            )}
          </div>

          <ScrollArea className="h-[calc(100%-3rem)]">
            {results.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                {results.map((result: ForensicResult) => (
                  <div
                    key={result.id}
                    className="border rounded-md overflow-hidden"
                  >
                    <img
                      src={result.imageData}
                      alt="Forensic result"
                      className="w-full h-auto object-cover aspect-video"
                    />
                    <div className="p-2">
                      <p className="text-sm truncate">
                        Time: {new Date(result.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
                Aucun résultat trouvé
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
