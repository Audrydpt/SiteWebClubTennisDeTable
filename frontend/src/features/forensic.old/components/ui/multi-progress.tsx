/* eslint-disable @stylistic/indent */
import { useMemo } from 'react';

import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';

import { calculateTimeRemaining } from '../../lib/estimation/estimation';
import { SourceProgress } from '../../lib/types';

interface MultiProgressProps {
  sourceProgress?: SourceProgress[];
  showSourceDetails?: boolean;
  setShowSourceDetails?: (show: boolean) => void;
}

// Helper to extract camera name and IP from camera ID
const extractCameraInfo = (cameraId: string) => {
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

export default function MultiProgress({
  sourceProgress = [],
  showSourceDetails = false,
  setShowSourceDetails = () => {},
}: MultiProgressProps) {
  const timeEstimates = useMemo(
    () => calculateTimeRemaining(sourceProgress),
    [sourceProgress]
  );

  if (sourceProgress.length === 0) {
    return null;
  }

  return (
    <Collapsible
      open={showSourceDetails}
      onOpenChange={setShowSourceDetails}
      className="space-y-3 mt-3"
    >
      <CollapsibleContent className="bg-muted rounded-lg p-3 transition-all">
        <div className="grid gap-3">
          {sourceProgress.map((source) => {
            // Get camera name from the sourceId using extractCameraInfo
            const cameraInfo = extractCameraInfo(source.sourceId);

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
                          <svg
                            className="size-3 mr-1 inline-block"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          {new Date(source.timestamp).toLocaleString('fr-FR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                      {source.progress > 0 &&
                        source.progress < 100 &&
                        timeEstimates.individual[source.sourceId] && (
                          <span className="flex items-center">
                            <svg
                              className="size-3 mr-1 inline-block"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M17 8h2a2 2 0 0 1 2 2v2m-2 8H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h10" />
                              <path d="M22 16H13c-2 0-2-4-4-4H7" />
                            </svg>
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
