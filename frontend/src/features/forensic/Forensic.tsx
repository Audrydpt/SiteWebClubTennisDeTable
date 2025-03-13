/* eslint-disable */
import { Search } from 'lucide-react';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion } from '@/components/ui/accordion';
import { useState, useRef, useEffect } from 'react';

import {
  ForensicFormProvider,
  ForensicFormValues,
  useForensicForm,
} from '@/features/forensic/lib/provider/forensic-form-context';
import Appearances from '@/features/forensic/components/appareances';
import Attributes from '@/features/forensic/components/attributes';
import Sources from '@/features/forensic/components/sources';
import Times from '@/features/forensic/components/times';
import Types from '@/features/forensic/components/types';

import useSearch, { ForensicResult } from './hooks/use-search';
import { useAuth } from '@/providers/auth-context';
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

        <div className="absolute bottom-0 left-0 right-0 pt-4 bg-card z-10">
          <Button type="submit" className="w-full" disabled={isSearching}>
            {isSearching ? (
              <>
                <span className="animate-spin mr-2">◌</span> Recherche en
                cours...
              </>
            ) : (
              <>
                <Search className="mr-2" size={16} /> Lancer la recherche
              </>
            )}
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

          {isSearching && (
            <>
              <Progress value={progress ?? 0} className="h-2 mt-2" />
              <p className="text-xs text-muted-foreground mt-1 text-center">
                {progress !== null
                  ? `${progress}% terminé`
                  : 'Initialisation de la recherche...'}
              </p>
            </>
          )}
        </div>
      </form>
    </Form>
  );
}

// New resizable splitter component
function ResizableSplitter() {
  return (
    <div
      className="w-1 bg-border hover:bg-primary/50 cursor-col-resize flex-shrink-0 relative mx-1"
      title="Redimensionner le panneau"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-4"></div>
    </div>
  );
}

export default function Forensic() {
  const { sessionId = '' } = useAuth();
  const [formWidth, setFormWidth] = useState(350);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const {
    startSearch,
    initWebSocket,
    closeWebSocket,
    progress,
    results,
    isSearching,
  } = useSearch(sessionId);

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!isDraggingRef.current) return;

      const deltaX = e.clientX - startXRef.current;
      const newWidth = Math.max(250, Math.min(600, startWidthRef.current + deltaX));
      setFormWidth(newWidth);
    }

    function handleMouseUp() {
      isDraggingRef.current = false;
      document.body.classList.remove('select-none');
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const startResize = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = formWidth;
    document.body.classList.add('select-none');
  };

  const handleSearch = async (data: ForensicFormValues) => {
    // Si une recherche est déjà en cours, annulez-la d'abord
    if (isSearching) {
      await closeWebSocket();
      // Attendre un court délai pour s'assurer que tout est nettoyé
      await new Promise((resolve) => {
        setTimeout(resolve, 500);
      });
    }

    try {
      const searchFormData = createSearchFormData(data);
      const guid = await startSearch(searchFormData, 5);
      initWebSocket(guid);
    } catch (error) {
      console.error('Failed to start search:', error);
    }
  };

  const renderSearchResults = () => {
    // When we have results, display them
    if (results.length > 0) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {results.map((result: ForensicResult) => (
            <div key={result.id} className="border rounded-md overflow-hidden shadow-sm">
              <img
                src={result.imageData}
                alt="Forensic result"
                className="w-full h-auto object-cover aspect-[16/9]"
              />
              <div className="p-3">
                <p className="text-sm">
                  Time: {new Date(result.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Show skeleton loaders when searching (regardless of progress, except when 100%)
    if (isSearching && progress !== 100) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="border rounded-md overflow-hidden shadow-sm"
            >
              <div className="bg-muted w-full aspect-[16/9] animate-pulse" />
              <div className="p-3">
                <div className="h-4 bg-muted rounded w-3/4 mb-1 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Show "No results found" only when a search has completed with progress=100%
    if (progress === 100) {
      return (
        <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
          Aucun résultat trouvé
        </div>
      );
    }

    // Initial state - no search has been performed yet
    return (
      <div className="flex flex-col h-[50vh] items-center justify-center text-muted-foreground">
        <Search className="mb-2 opacity-30" size={48} />
        <p>Sélectionnez une caméra et lancez une recherche</p>
      </div>
    );
  };

  return (
    <div ref={containerRef} className="flex gap-0 h-full">
      {/* Form Panel with dynamic width */}
      <Card
        className="h-[calc(100vh-2rem)] overflow-hidden flex flex-col"
        style={{ width: `${formWidth}px` }}
      >
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

      {/* Resizable divider */}
      <div onMouseDown={startResize}>
        <ResizableSplitter />
      </div>

      {/* Results Area - takes remaining space */}
      <Card className="h-[calc(100vh-2rem)] overflow-hidden flex-1">
        <CardContent className="p-4 h-full">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Résultats de recherche</h2>
            {progress !== null && progress < 100 && (
              <div className="mt-2">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground mt-1">
                  Progression: {progress}%
                </p>
              </div>
            )}
          </div>

          <ScrollArea className="h-[calc(100%-3rem)]">
            {renderSearchResults()}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}