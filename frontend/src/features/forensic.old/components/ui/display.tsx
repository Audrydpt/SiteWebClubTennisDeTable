/* eslint-disable no-console,@typescript-eslint/no-unused-vars,react-hooks/exhaustive-deps */
import { Download, Search } from 'lucide-react';
import { DateTime } from 'luxon';
import { useEffect, useMemo } from 'react';

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

import { ForensicResult } from '../../lib/types';
import { SortType } from './buttons';

// Helper function to avoid nested ternaries
const getScoreBackgroundColor = (score: number) => {
  if (score > 0.7) return 'rgba(220, 38, 38, 0.8)'; // Red for high scores
  if (score > 0.4) return 'rgba(245, 158, 11, 0.8)'; // Orange for medium scores
  return 'rgba(0, 0, 0, 0.7)'; // Black for low scores
};

// Helper to extract camera name and IP from camera ID
const extractCameraInfo = (cameraId: string | undefined) => {
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

interface DisplayProps {
  results?: ForensicResult[];
  isSearching?: boolean;
  progress?: number | null;
  sortType?: SortType;
  sortOrder?: 'asc' | 'desc';
  isTabLoading?: boolean;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  paginationInfo?: {
    currentPage: number;
    pageSize: number;
    totalPages: number;
    total: number;
  };
}

export default function Display({
  results = [],
  isSearching = false,
  progress = 0,
  sortType = 'score',
  sortOrder = 'desc',
  isTabLoading = false,
  currentPage = 1,
  onPageChange = () => {},
  paginationInfo = {
    currentPage: 1,
    pageSize: Number(process.env.FORENSIC_PAGINATION_ITEMS) || 12,
    totalPages: 1,
    total: 0,
  },
}: DisplayProps) {
  // Generate stable skeleton IDs
  const skeletonIds = useMemo(
    () =>
      Array.from({ length: 12 }, () =>
        Math.random().toString(36).substring(2, 15)
      ),
    []
  );

  // Sort results based on current sort type and order
  const sortedResults = useMemo(() => {
    if (!results.length) return [];

    return [...results].sort((a, b) => {
      if (sortType === 'score') {
        return sortOrder === 'desc' ? b.score - a.score : a.score - b.score;
      }
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [results, sortType, sortOrder]);

  // Pagination calculations
  const { totalPages } = paginationInfo;

  // Reset to first page when sorting or filters change
  useEffect(() => {
    if (currentPage !== 1) {
      onPageChange(1);
    }
  }, [sortType, sortOrder]);

  // Assurer que currentPage ne dépasse jamais totalPages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      onPageChange(totalPages);
    }
  }, [totalPages, currentPage, onPageChange]);

  const paginatedResults = useMemo(() => {
    // Pour la page 1 en cours de recherche active, on utilise les résultats du heap
    if (currentPage === 1 && isSearching) {
      return sortedResults;
    }
    // Pour les autres pages ou recherche terminée, on utilise les résultats paginés côté serveur
    return sortedResults;
  }, [sortedResults, currentPage, isSearching]);

  // Render expanded image modal
  const renderImage = (result: ForensicResult) => {
    const cameraUuid = result.cameraId;
    const timestamp = new Date(result.timestamp);

    return (
      <Dialog>
        <DialogTrigger asChild>
          <div className="border rounded-md overflow-hidden shadow-xs hover:shadow-md transition-shadow bg-card cursor-pointer relative group">
            <div className="relative">
              {result.imageData ? (
                <div className="relative">
                  <img
                    src={result.imageData}
                    alt="Forensic result"
                    className="w-full h-auto object-cover object-[center_10%] aspect-video"
                  />
                </div>
              ) : (
                <div className="w-full aspect-video bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground text-sm">
                    Pas d&#39;image
                  </span>
                </div>
              )}
              <div
                className="absolute top-2 right-2 text-white rounded-full px-2 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: getScoreBackgroundColor(result.score),
                }}
              >
                {(result.score * 100).toFixed(1)}%
              </div>
            </div>
            <div className="p-4">
              <div className="text-xs text-muted-foreground">
                {timestamp.toLocaleString()}
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

                  const fromTimestamp = DateTime.fromJSDate(result.timestamp)
                    .minus({ seconds: 5 })
                    .toUTC()
                    .toISO({ includeOffset: false });
                  const toTimestamp = DateTime.fromJSDate(result.timestamp)
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
                <Download className="h-5 w-5" />
              </Button>
              <img
                src={result.imageData}
                alt="Résultat agrandi"
                className="w-full max-h-[85vh] h-auto object-contain"
              />
            </div>

            {/* Metadata Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium text-lg">Métadonnées</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">Type:</div>
                  <div>{result.type || 'detection'}</div>

                  <div className="text-muted-foreground">Caméra:</div>
                  <div>
                    {
                      extractCameraInfo(
                        result.camera || result.cameraId || 'unknown'
                      ).name
                    }
                  </div>

                  <div className="text-muted-foreground">IP:</div>
                  <div>
                    {
                      extractCameraInfo(
                        result.camera || result.cameraId || 'unknown'
                      ).ip
                    }
                  </div>

                  <div className="text-muted-foreground">Score:</div>
                  <div>{(result.score * 100).toFixed(1)}%</div>

                  <div className="text-muted-foreground">Timestamp:</div>
                  <div>{timestamp.toLocaleString()}</div>
                </div>
              </div>

              {/* Raw Data Section */}
              <div className="space-y-2">
                <h3 className="font-medium text-lg">Données brutes</h3>
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
  };

  const renderPagination = () => {
    // Détermine quels numéros de page afficher
    const getPageNumbers = () => {
      const pageNumbers = [];
      const maxPagesToShow = 5; // Nombre de pages à afficher autour de la page courante

      if (totalPages <= maxPagesToShow + 2) {
        // Si le nombre total de pages est petit, afficher toutes les pages
        // eslint-disable-next-line no-plusplus
        for (let i = 1; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        // Toujours afficher la première page
        pageNumbers.push(1);

        // Calculer la plage à afficher autour de la page courante
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

        // Ajouter les pages dans la plage calculée
        // eslint-disable-next-line no-plusplus
        for (let i = leftBound; i <= rightBound; i++) {
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
                  onPageChange(currentPage - 1);
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
                      onPageChange(page);
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
                  onPageChange(currentPage + 1);
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
        <div className="text-sm text-muted-foreground">
          {paginationInfo.total !== undefined && paginationInfo.total !== null
            ? `${paginationInfo.total} résultats`
            : 'Chargement...'}
        </div>
      </div>
    );
  };

  if (isTabLoading) {
    return (
      <div className="space-y-6">
        {/* Skeletons avec animations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {skeletonIds.map((id, index) => (
            <div
              key={`skeleton-${id}`}
              className="border rounded-md overflow-hidden shadow-xs animate-pulse"
              style={{
                animationDelay: `${index * 80}ms`,
                animationDuration: '2s',
              }}
            >
              <div className="bg-muted/80 w-full aspect-video relative">
                {/* Effet de balayage sur l'image */}
                <div className="absolute inset-0 overflow-hidden">
                  <div
                    className="h-full w-1/3 bg-linear-to-r from-transparent via-white/10 to-transparent absolute"
                    style={{
                      left: '-100%',
                      animationName: 'shimmer',
                      animationDuration: '2s',
                      animationIterationCount: 'infinite',
                    }}
                  />
                </div>
                <div className="absolute bottom-2 right-2 h-5 w-12 bg-muted/60 rounded-full" />
              </div>
              <div className="p-3">
                <div className="h-4 bg-muted/70 rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted/50 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Si nous avons des résultats à afficher, on les montre quelle que soit la progression
  if (results && results.length > 0) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedResults.map((result: ForensicResult, index) => (
            <div key={result.id || `result-${index}`}>
              {renderImage(result)}
            </div>
          ))}
        </div>

        {/* Pagination controls */}
        {renderPagination()}
      </div>
    );
  }

  if (isSearching && progress !== 100) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {skeletonIds.map((id) => (
          <div
            key={`skeleton-${id}`}
            className="border rounded-md overflow-hidden shadow-xs"
          >
            <div className="bg-muted w-full aspect-video animate-pulse" />
            <div className="p-3">
              <div className="h-4 bg-muted rounded w-3/4 mb-1 animate-pulse" />
              <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (progress === 100 && !isSearching && (!results || results.length === 0)) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
        Aucun résultat trouvé
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[50vh] items-center justify-center text-muted-foreground">
      <Search className="mb-2 opacity-30" size={48} />
      <p>Sélectionnez une caméra et lancez une recherche</p>
    </div>
  );
}
