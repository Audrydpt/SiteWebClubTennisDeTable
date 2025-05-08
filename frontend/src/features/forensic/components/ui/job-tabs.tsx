/* eslint-disable no-console */
import { Loader2, Trash2 } from 'lucide-react';
import { useEffect, useRef } from 'react';

import DeleteConfirmation from '@/components/confirm-delete';
import { Button } from '@/components/ui/button.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  ForensicTaskStatus,
  isForensicTaskCompleted,
  isForensicTaskRunning,
} from '../../hooks/use-jobs';

export interface TabJob {
  tabIndex: number;
  jobId?: string;
  status: ForensicTaskStatus;
  isNew?: boolean;
}

interface JobTabsProps {
  tabJobs: TabJob[];
  activeTabIndex: number;
  onTabChange: (tabIndex: number) => void;
  onDeleteTab: (tabIndex: number) => void;
  hideTitle?: boolean;
  isLoading?: boolean;
  setIsLoading?: (isLoading: boolean) => void;
}

export default function JobTabs({
  tabJobs = [],
  activeTabIndex = 1,
  onTabChange,
  onDeleteTab,
  hideTitle = false,
  isLoading = false,
  setIsLoading,
}: JobTabsProps) {
  const MAX_TABS = 5;
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (isLoading && tabJobs.length === 0) {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }

      loadingTimeoutRef.current = setTimeout(() => {
        if (setIsLoading) {
          setIsLoading(false);
        }
      }, 5000);
    } else if (!isLoading && loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [isLoading, tabJobs.length, setIsLoading]);

  let displayTabs = [...tabJobs];

  if (displayTabs.length === 0) {
    displayTabs = [{ tabIndex: 1, status: ForensicTaskStatus.PENDING }];
  }

  if (!displayTabs.some((tab) => tab.tabIndex === activeTabIndex)) {
    displayTabs.push({
      tabIndex: activeTabIndex,
      status: ForensicTaskStatus.PENDING,
    });
  }

  displayTabs = displayTabs.slice(0, MAX_TABS);

  if (isLoading && tabJobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg">Chargement des tâches...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {!hideTitle && (
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-lg font-semibold">Résultats de recherche</h2>
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          )}
        </div>
      )}

      <Tabs
        value={activeTabIndex.toString()}
        className="w-full"
        onValueChange={(value) => onTabChange(parseInt(value, 10))}
      >
        <TabsList className="grid w-full grid-cols-5">
          {displayTabs.map((tab) => {
            const hasJob = !!tab.jobId;
            let tabDisplay = 'Nouvel onglet';
            let statusIndicator = null;

            if (hasJob) {
              tabDisplay = `R${tab.tabIndex}`;
              if (!isForensicTaskCompleted(tab.status)) {
                statusIndicator = (
                  <Loader2 className="ml-1 h-3 w-3 animate-spin" />
                );
              } else if (tab.status === ForensicTaskStatus.SUCCESS) {
                statusIndicator = <span className="ml-1 text-primary">✓</span>;
              } else if (tab.status === ForensicTaskStatus.REVOKED) {
                statusIndicator = (
                  <span className="ml-1 text-destructive">✗</span>
                );
              } else if (tab.status === ForensicTaskStatus.FAILURE) {
                statusIndicator = (
                  <span className="ml-1 text-destructive">⚠️</span>
                );
              }
            }
            const activeTabClass =
              activeTabIndex === tab.tabIndex ? 'ring-1 ring-primary' : '';

            const runningClass = isForensicTaskRunning(tab.status)
              ? 'bg-muted/50 animate-pulse'
              : '';

            return (
              <TabsTrigger
                key={tab.tabIndex}
                value={tab.tabIndex.toString()}
                className={`${hasJob ? 'font-medium' : ''} ${activeTabClass} ${runningClass} transition-all relative group`}
                disabled={isLoading}
              >
                <div className="flex items-center">
                  {tabDisplay}
                  {statusIndicator}
                  {hasJob && (
                    <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DeleteConfirmation
                        onDelete={() => onDeleteTab(tab.tabIndex)}
                        title="Supprimer cette recherche"
                        description="Êtes-vous sûr de vouloir supprimer cet onglet de recherche ?"
                        confirmText="Supprimer"
                      >
                        <Button
                          variant="destructive"
                          className="h-4 w-4 p-0"
                          title="Supprimer cette recherche"
                          aria-label="Supprimer cette recherche"
                        >
                          <Trash2 className="!h-3 !w-3" />
                        </Button>
                      </DeleteConfirmation>
                    </div>
                  )}
                </div>
              </TabsTrigger>
            );
          })}
        </TabsList>
        {displayTabs.map((tab) => (
          <TabsContent key={tab.tabIndex} value={tab.tabIndex.toString()} />
        ))}
      </Tabs>
    </div>
  );
}
