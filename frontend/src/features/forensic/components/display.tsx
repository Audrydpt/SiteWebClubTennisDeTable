import { AlertCircle, Download, Loader2, Search } from 'lucide-react';
import { DateTime } from 'luxon';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

import { ForensicResult } from '../lib/types';
import { useSearchContext } from '../providers/search-context';

const getScoreBackgroundColor = (score: number) => {
  if (score > 0.7) return 'rgba(220, 38, 38, 0.8)'; // Red for high scores
  if (score > 0.4) return 'rgba(245, 158, 11, 0.8)'; // Orange for medium scores
  return 'rgba(0, 0, 0, 0.7)'; // Black for low scores
};

function RenderPagination() {
  const { currentPage, setCurrentPage, totalPages } = useSearchContext();

  // Ne pas afficher la pagination s'il n'y a qu'une page
  if (totalPages <= 1) return null;

  // Détermine quels numéros de page afficher
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5; // Nombre de pages à afficher autour de la page courante

    if (totalPages <= maxPagesToShow + 2) {
      for (let i = 1; i <= totalPages; i += 1) {
        pageNumbers.push(i);
      }
    } else {
      pageNumbers.push(1);

      const leftBound = Math.max(
        2,
        currentPage - Math.floor(maxPagesToShow / 2)
      );
      const rightBound = Math.min(
        totalPages - 1,
        leftBound + maxPagesToShow - 1
      );

      // Ajouter des points de suspension si nécessaire
      if (leftBound > 2) {
        pageNumbers.push('...');
      }

      for (let i = leftBound; i <= rightBound; i += 1) {
        pageNumbers.push(i);
      }

      // Ajouter des points de suspension si nécessaire
      if (rightBound < totalPages - 1) {
        pageNumbers.push('...');
      }

      // Toujours afficher la dernière page
      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  return (
    <div className="flex flex-col items-center gap-4 mt-6">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (currentPage > 1) {
                  setCurrentPage(currentPage - 1);
                }
              }}
              className={
                currentPage === 1 ? 'pointer-events-none text-muted' : ''
              }
            />
          </PaginationItem>

          {getPageNumbers().map((page, index) =>
            typeof page === 'number' ? (
              <PaginationItem key={`page-${page}`}>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(page);
                  }}
                  isActive={currentPage === page}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ) : (
              // eslint-disable-next-line react/no-array-index-key
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            )
          )}

          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (currentPage < totalPages) {
                  setCurrentPage(currentPage + 1);
                }
              }}
              className={
                currentPage === totalPages
                  ? 'pointer-events-none text-muted'
                  : ''
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

function RenderImage(result: ForensicResult) {
  const { camera: cameraUuid, imageData, score, timestamp, type } = result;
  const { t } = useTranslation();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="border rounded-md overflow-hidden shadow-xs hover:shadow-md transition-shadow bg-card cursor-pointer relative group">
          <div className="relative">
            {imageData ? (
              <div className="relative">
                <img
                  src={imageData}
                  alt="Forensic result"
                  className="w-full h-auto object-cover object-[center_10%] aspect-video"
                />
              </div>
            ) : (
              <div className="w-full aspect-video bg-muted flex items-center justify-center">
                <span className="text-muted-foreground text-sm">
                  {t('forensic:display.no_image')}
                </span>
              </div>
            )}
            <div
              className="absolute top-2 right-2 text-white rounded-full px-2 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: getScoreBackgroundColor(score),
              }}
            >
              {(score * 100).toFixed(1)}%
            </div>
          </div>
          <div className="p-4">
            <div className="text-xs text-muted-foreground">
              {DateTime.fromJSDate(timestamp).toLocaleString(
                DateTime.DATETIME_SHORT
              )}
            </div>
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-[90vw] max-h-[90vh] p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Section */}
          <div className="relative">
            <Button
              size="icon"
              className="absolute top-4 left-4 bg-black/50 hover:bg-black/70 text-white"
              onClick={(e) => {
                e.stopPropagation();

                const fromTimestamp = DateTime.fromJSDate(timestamp)
                  .minus({ seconds: 5 })
                  .toUTC()
                  .toISO({ includeOffset: false });
                const toTimestamp = DateTime.fromJSDate(timestamp)
                  .plus({ seconds: 10 })
                  .toUTC()
                  .toISO({ includeOffset: false });

                const link = document.createElement('a');
                link.href = `${process.env.MAIN_API_URL}/vms/cameras/${cameraUuid}/replay?from_time=${fromTimestamp}&to_time=${toTimestamp}`;
                link.download = 'export.webm';
                link.target = '_blank';
                link.click();
              }}
            >
              <Download className="size-5" />
            </Button>
            <img
              src={imageData}
              alt="Résultat agrandi"
              className="w-full max-h-[85vh] h-auto object-contain"
            />
          </div>

          {/* Metadata Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium text-lg">
                {t('forensic:display.metadata')}
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">
                  {t('forensic:display.type')}:
                </div>
                <div>{type || 'detection'}</div>

                <div className="text-muted-foreground">
                  {t('forensic:display.camera')}:
                </div>
                <div>{cameraUuid}</div>

                <div className="text-muted-foreground">
                  {t('forensic:display.score')}:
                </div>
                <div>{(score * 100).toFixed(1)}%</div>

                <div className="text-muted-foreground">
                  {t('forensic:display.timestamp')}:
                </div>
                <div>
                  {DateTime.fromJSDate(timestamp).toLocaleString(
                    DateTime.DATETIME_SHORT
                  )}
                </div>
              </div>
            </div>

            {/* Raw Data Section */}
            <div className="space-y-2">
              <h3 className="font-medium text-lg">
                {t('forensic:display.raw_data')}
              </h3>
              <div className="mt-2 p-2 bg-muted rounded-md overflow-auto max-h-48">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Display() {
  const { taskId } = useParams();
  const { results, isLoading, error } = useSearchContext();
  const { t } = useTranslation();

  if (!taskId) {
    return (
      <div className="flex flex-col h-[50vh] items-center justify-center text-muted-foreground">
        <Search className="mb-2 opacity-30" size={48} />
        <p>{t('forensic:display.no_camera')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-[50vh] items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="size-4" />
          <AlertDescription>{t('forensic:display.error')}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading && (
          <div className="flex flex-col h-[50vh] w-full items-center justify-center text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {t('forensic:display.loading')}
          </div>
        )}
        {!isLoading &&
          results.map((result: ForensicResult, index: number) => (
            <div key={result.frame_uuid || result.id || `result-${index}`}>
              <RenderImage {...result} />
            </div>
          ))}
      </div>
      <div className="flex justify-center">
        <RenderPagination />
      </div>
    </div>
  );
}
