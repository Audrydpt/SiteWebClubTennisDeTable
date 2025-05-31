import { Loader2, Trash2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import DeleteConfirmation from '@/components/confirm-delete';
import Loading from '@/components/loading';
import { Button } from '@/components/ui/button.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import useJobs, {
  ForensicTaskStatus,
  isForensicTaskCompleted,
} from '../../hooks/use-jobs';

interface JobTabsProps {
  onTabChange?: (tabIndex: string) => void;
  hideTitle?: boolean;
  isLoading?: boolean;
  setIsLoading?: (isLoading: boolean) => void;
}

export default function JobTabs({
  onTabChange,
  hideTitle = false,
  isLoading = false,
  setIsLoading,
}: JobTabsProps) {
  const { t } = useTranslation();

  const MAX_TABS = 5;
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { tasks: tabJobs, deleteTab } = useJobs();
  const { taskId: activeTabIndex } = useParams();
  const navigate = useNavigate();

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

  displayTabs = displayTabs.slice(0, MAX_TABS);

  if (isLoading && tabJobs.length === 0) {
    return <Loading />;
  }

  const handleTabChange = (value: string) => {
    if (onTabChange) {
      onTabChange(value);
    } else {
      navigate(`/forensic/${value}`);
    }
  };

  return (
    <div className="flex flex-col">
      {!hideTitle && (
        <div className="flex items-center gap-2 mb-2">
          {isLoading && (
            <Loader2 className="size-4 animate-spin text-primary" />
          )}
        </div>
      )}

      <Tabs
        value={activeTabIndex}
        className="w-full"
        onValueChange={handleTabChange}
      >
        <TabsList className="grid w-full grid-cols-5">
          {displayTabs.map((tab, index) => {
            const hasJob = !!tab.id;
            let tabDisplay = t('forensic:job-tabs.new_tab');
            let statusIndicator = null;

            if (hasJob) {
              tabDisplay = `R${index + 1}`;
              if (!isForensicTaskCompleted(tab.status)) {
                statusIndicator = (
                  <Loader2 className="ml-1 size-3 animate-spin" />
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
              activeTabIndex === tab.id ? 'ring-1 ring-primary' : '';

            const runningClass = !isForensicTaskCompleted(tab.status)
              ? 'bg-muted/50 animate-pulse'
              : '';

            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id || ''}
                className={`${hasJob ? 'font-medium' : ''} ${activeTabClass} ${runningClass} transition-all relative group`}
                disabled={isLoading}
              >
                <div className="flex items-center">
                  {tabDisplay}
                  {statusIndicator}
                  {hasJob && (
                    <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DeleteConfirmation
                        onDelete={() => deleteTab(tab.id || '')}
                        title={t('forensic:job-tabs.delete_tab')}
                        description={t(
                          'forensic:job-tabs.delete_tab_description'
                        )}
                        confirmText={t('forensic:job-tabs.delete_tab_confirm')}
                      >
                        <Button
                          variant="destructive"
                          className="size-4 p-0"
                          title={t('forensic:job-tabs.delete_tab')}
                          aria-label={t('forensic:job-tabs.delete_tab')}
                        >
                          <Trash2 className="h-3! w-3!" />
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
          <TabsContent key={tab.id} value={tab.id || ''} />
        ))}
      </Tabs>
    </div>
  );
}
