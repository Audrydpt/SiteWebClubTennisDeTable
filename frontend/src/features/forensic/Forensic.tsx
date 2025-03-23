/* eslint-disable no-console */
import { useRef, useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';

import useSearch from './hooks/use-search';
import { createSearchFormData } from './lib/format-query';

import ForensicForm from './components/form';
import Results from './components/results';
import ForensicFormProvider from './lib/provider/forensic-form-provider';
import { ForensicFormValues } from './lib/types';

export default function Forensic() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const collapsedWidth = 1;
  const expandedWidth = 350;
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    startSearch,
    stopSearch,
    progress,
    results,
    isSearching,
    sourceProgress,
  } = useSearch();

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleSearch = async (data: ForensicFormValues) => {
    if (isSearching) {
      return;
    }

    try {
      const searchFormData = createSearchFormData(data);
      await startSearch(searchFormData);
    } catch (error) {
      console.error('Failed to start search:', error);
    }
  };

  const currentWidth = isCollapsed ? collapsedWidth : expandedWidth;

  return (
    <div ref={containerRef} className="flex h-full">
      <div
        className="relative transition-all duration-300 ease-in-out"
        style={{
          width: `${currentWidth}px`,
          minWidth: `${currentWidth}px`,
          flexShrink: 0,
        }}
      >
        {/* Form Panel with dynamic width */}
        <Card className="h-[calc(100vh-2rem)] overflow-hidden flex flex-col">
          <CardContent
            className={`${isCollapsed ? 'p-2' : 'p-4'} h-full flex flex-col`}
          >
            <div
              className={`${isCollapsed ? 'mb-2' : 'mb-4'} flex items-center justify-between pointer-events-auto`}
            >
              <h1
                className={`${isCollapsed ? 'text-sm' : 'text-lg'} font-semibold truncate`}
              >
                {isCollapsed ? '' : 'Recherche vidéo'}
              </h1>
            </div>

            <ForensicFormProvider>
              <ForensicForm
                onSubmit={handleSearch}
                isSearching={isSearching}
                stopSearch={stopSearch}
                isCollapsed={isCollapsed}
              />
            </ForensicFormProvider>
          </CardContent>
        </Card>

        {/* Vertical handle that toggles collapse on click */}
        <button
          className="absolute top-0 right-0 w-4 h-full cursor-pointer z-30 bg-transparent border-none p-0"
          type="button"
          onClick={handleToggleCollapse}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleToggleCollapse();
            }
          }}
          aria-label={
            isCollapsed ? 'Expand search panel' : 'Collapse search panel'
          }
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          <div className="absolute top-0 right-0 w-1 h-full bg-border hover:bg-primary/70 hover:w-2 transition-all" />
        </button>
      </div>

      {/* Results Panel */}
      <Card className="h-[calc(100vh-2rem)] overflow-hidden flex-1 ml-2">
        <CardContent className="p-10 pb-8 h-full">
          <Results
            results={results}
            isSearching={isSearching}
            progress={progress}
            sourceProgress={sourceProgress}
          />
        </CardContent>
      </Card>
    </div>
  );
}
