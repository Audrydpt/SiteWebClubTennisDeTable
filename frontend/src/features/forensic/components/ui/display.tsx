/* eslint-disable no-console,@typescript-eslint/no-unused-vars,react-hooks/exhaustive-deps */
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
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
  results: ForensicResult[];
  isSearching: boolean;
  progress: number | null;
  sortType: SortType;
  sortOrder: 'asc' | 'desc';
  isTabLoading?: boolean;
  currentPage: number;
  onPageChange: (page: number) => void;
  paginationInfo: {
    currentPage: number;
    pageSize: number;
    totalPages: number;
    total: number;
  };
}

export default function Display({
  results,
  isSearching,
  progress,
  sortType,
  sortOrder,
  isTabLoading = false,
  currentPage,
  onPageChange,
  paginationInfo,
}: DisplayProps) {
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  // Generate stable skeleton IDs
  const skeletonIds = useMemo(
    () =>
      Array.from({ length: 8 }, () =>
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

  useEffect(() => {
    console.log('paginationInfo reçue dans Display:', paginationInfo);
  }, [paginationInfo]);

  const paginatedResults = useMemo(() => {
    // Pour la page 1 en cours de recherche active, on utilise les résultats du heap
    if (currentPage === 1 && isSearching) {
      return sortedResults;
    }
    // On fait confiance aux résultats déjà paginés côté serveur
    return sortedResults;
  }, [sortedResults, currentPage, isSearching]);

  // Render expanded image modal
  const renderExpandedImageModal = () => {
    if (!expandedImage) return null;

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
        onClick={() => setExpandedImage(null)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setExpandedImage(null);
        }}
        role="presentation"
        tabIndex={-1}
      >
        <div className="relative max-w-[90%] max-h-[90%]">
          <button
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2"
            onClick={(e) => {
              e.stopPropagation();
              setExpandedImage(null);
            }}
            aria-label="Fermer"
            type="button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <img
            src={expandedImage}
            alt="Résultat agrandi"
            className="max-w-full max-h-[85vh] object-contain"
          />
        </div>
      </div>
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
      <div className="flex justify-center items-center mt-6 space-x-1 flex-wrap">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Affichage des numéros de page */}
        <div className="flex space-x-1 mx-1">
          {getPageNumbers().map((page, index) =>
            typeof page === 'number' ? (
              <Button
                key={`page-${page}`}
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => onPageChange(page)}
              >
                {page}
              </Button>
            ) : (
              // eslint-disable-next-line react/no-array-index-key
              <span key={`ellipsis-${index}`} className="px-1 self-center">
                ...
              </span>
            )
          )}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>

        <div className="ml-2 text-sm text-muted-foreground">
          {paginationInfo.total} résultats
        </div>
      </div>
    );
  };

  if (isTabLoading) {
    return (
      <div className="space-y-6">
        {/* Barre de progression pulsante */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between items-center">
            <div className="h-4 bg-muted/80 rounded w-32 animate-pulse" />
            <div className="h-3 bg-muted/60 rounded w-24 animate-pulse" />
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted/40">
            <div
              className="absolute inset-y-0 left-0 w-1/3 bg-primary/50 rounded-full"
              style={{
                animation: 'pulse 1.5s infinite ease-in-out',
                opacity: 0.7,
              }}
            />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {[1, 2, 3].map((n) => (
              <div key={`source-${n}`} className="flex flex-col space-y-1">
                <div className="h-3 bg-muted/60 rounded w-3/4 animate-pulse" />
                <div className="h-2 bg-muted/40 rounded w-full animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Skeletons avec animations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {skeletonIds.map((id, index) => (
            <div
              key={`skeleton-${id}`}
              className="border rounded-md overflow-hidden shadow-sm animate-pulse"
              style={{
                animationDelay: `${index * 80}ms`,
                animationDuration: '2s',
              }}
            >
              <div className="bg-muted/80 w-full aspect-[16/9] relative">
                {/* Effet de balayage sur l'image */}
                <div className="absolute inset-0 overflow-hidden">
                  <div
                    className="h-full w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent absolute"
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
          {paginatedResults.map((result: ForensicResult, index) => {
            const timestamp = new Date(result.timestamp);
            return (
              <Popover key={result.id || `result-${index}`}>
                <PopoverTrigger asChild>
                  <div className="border rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-card cursor-pointer relative group">
                    <div className="relative">
                      {result.imageData ? (
                        <div className="relative">
                          <img
                            src={result.imageData}
                            alt="Forensic result"
                            className="w-full h-auto object-cover object-[center_10%] aspect-[16/9]"
                          />
                          <button
                            className="absolute bottom-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedImage(result.imageData);
                            }}
                            aria-label="Agrandir l'image"
                            type="button"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="15 3 21 3 21 9" />
                              <polyline points="9 21 3 21 3 15" />
                              <line x1="21" y1="3" x2="14" y2="10" />
                              <line x1="3" y1="21" x2="10" y2="14" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="w-full aspect-[16/9] bg-muted flex items-center justify-center">
                          <span className="text-muted-foreground text-sm">
                            Pas d&#39;image
                          </span>
                        </div>
                      )}
                      <div
                        className="absolute top-2 right-2 text-white rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: getScoreBackgroundColor(
                            result.score
                          ),
                        }}
                      >
                        {(result.score * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="text-xs text-muted-foreground">
                        {timestamp.toLocaleString('fr-FR')}
                      </div>
                    </div>
                  </div>
                </PopoverTrigger>
                <PopoverContent>
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm">Métadonnées</h3>
                    <div className="grid grid-cols-2 gap-1 text-sm">
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

                      <div className="text-muted-foreground">Score:</div>
                      <div>{(result.score * 100).toFixed(1)}%</div>

                      <div className="text-muted-foreground">Timestamp:</div>
                      <div>
                        {timestamp.toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </div>
                    </div>

                    {/* Full raw data */}
                    <div className="mt-1">
                      <details>
                        <summary className="text-sm font-medium cursor-pointer">
                          Données brutes
                        </summary>
                        <div className="text-xs bg-muted p-2 mt-2 rounded-md overflow-auto max-h-48">
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(result, null, 2)}
                          </pre>
                        </div>
                      </details>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            );
          })}
        </div>

        {/* Pagination controls */}
        {renderPagination()}

        {renderExpandedImageModal()}
      </div>
    );
  }

  if (isSearching && progress !== 100) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {skeletonIds.map((id) => (
          <div
            key={`skeleton-${id}`}
            className="border rounded-md overflow-hidden shadow-sm"
          >
            <div className="bg-muted w-full aspect-[16/9] animate-pulse" />
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
