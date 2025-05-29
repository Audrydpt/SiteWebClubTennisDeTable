/* eslint-disable @stylistic/indent */
import { ChevronDown, ChevronUp, Clock, Timer } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';

import { calculateTimeRemaining } from '../../lib/estimation';
import { useSearchContext } from '../../providers/search-context';

// Helper to extract camera name and IP from camera ID
const extractCameraInfo = (cameraId: string) => {
  // Handle undefined or null cameraId
  if (!cameraId) {
    return {
      name: 'Caméra inconnue',
      ip: 'IP inconnue',
    };
  }

  // If cameraId has a structure like "Camera Name (192.168.1.1)"
  const match = cameraId.match(/^(.+?)\s*\(([^)]+)\)$/);
  if (match) {
    return {
      name: match[1].trim(),
      ip: match[2].trim(),
    };
  }

  // Default case - just return the ID as name and unknown IP
  return {
    name: cameraId !== 'unknown' ? cameraId : 'Caméra inconnue',
    ip: 'IP inconnue',
  };
};

export default function MultiProgress() {
  const { t } = useTranslation();
  const [showSourceDetails, setShowSourceDetails] = useState(false);
  const { progress: sourceProgress } = useSearchContext();
  const sourceProgressArray = Object.values(sourceProgress);
  const timeEstimates = useMemo(
    () => calculateTimeRemaining(sourceProgressArray),
    [sourceProgressArray]
  );

  if (sourceProgressArray.length === 0) {
    return null;
  }

  const progress =
    sourceProgressArray.reduce((acc, source) => acc + source.progress, 0) /
    sourceProgressArray.length;

  return (
    <Collapsible
      open={showSourceDetails}
      onOpenChange={setShowSourceDetails}
      className="space-y-3 mt-3"
    >
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <p className="text-sm font-medium text-foreground">
            {t('forensic:multi-progress.progression')}:{' '}
            <span className="text-primary font-semibold">
              {progress !== null ? progress.toFixed(0) : 0}%
            </span>{' '}
            <span className="text-sm font-medium text-muted">
              - {timeEstimates.combined}
            </span>
          </p>
        </div>
        {sourceProgressArray.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 hover:bg-muted/80"
            onClick={() => setShowSourceDetails(!showSourceDetails)}
          >
            {showSourceDetails
              ? t('forensic:multi-progress.hide_details')
              : t('forensic:multi-progress.show_details')}
            {showSourceDetails ? (
              <ChevronUp className="ml-1 h-4 w-4" />
            ) : (
              <ChevronDown className="ml-1 h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      <Progress value={progress} className="w-full" />

      <CollapsibleContent className="bg-muted rounded-lg p-3 transition-all">
        <div className="grid gap-3">
          {sourceProgressArray.map((source) => {
            if (source.progress === 0 || source.progress === 100) {
              return null;
            }

            // Get camera name from the sourceId using extractCameraInfo
            const cameraInfo = extractCameraInfo(source.sourceId ?? '');

            return (
              <div
                key={source.sourceId}
                className="space-y-1.5 border-b border-foreground/50 pb-3 last:border-0 last:pb-0"
              >
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">
                      {cameraInfo.name}
                    </span>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      {source.timestamp && (
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1 inline-block" />
                          {new Date(source.timestamp).toLocaleString()}
                        </span>
                      )}
                      {source.progress > 0 &&
                        source.progress < 100 &&
                        timeEstimates.individual[source.sourceId] && (
                          <span className="flex items-center">
                            <Timer className="w-3 h-3 mr-1 inline-block" />
                            {timeEstimates.individual[source.sourceId]}
                          </span>
                        )}
                    </div>
                  </div>
                  <span
                    className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                      source.progress >= 100
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-muted/10 text-primary/80'
                    }`}
                  >
                    {source.progress.toFixed(0)}%
                  </span>
                </div>
                <Progress value={source.progress} className="w-full" />
              </div>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
