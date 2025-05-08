import { ChevronLeftCircle, ChevronRightCircle } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';

interface WidgetRangeNavigatorProps {
  page: number;
  onPageChange: (page: number) => void;
}

export default function WidgetRangeNavigation({
  page,
  onPageChange,
}: WidgetRangeNavigatorProps) {
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    inactivityTimerRef.current = setTimeout(() => {
      onPageChange(0);
    }, 20000);
  }, [onPageChange]);

  useEffect(() => {
    resetInactivityTimer();

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [resetInactivityTimer]);

  const handlePrevious = () => {
    onPageChange(page - 1);
    resetInactivityTimer();
  };

  const handleNext = () => {
    if (page === 0) return;
    onPageChange(page + 1);
    resetInactivityTimer();
  };

  return (
    <div className="opacity-0 group-hover:opacity-100" role="navigation">
      <div className="absolute left-2 top-1/2 transform -translate-y-1/2 cursor-pointer">
        <ChevronLeftCircle
          className="opacity-10 hover:opacity-100 transition-opacity"
          onClick={handlePrevious}
          aria-label="Previous page"
        />
      </div>

      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer">
        <ChevronRightCircle
          className="opacity-10 hover:opacity-100 transition-opacity"
          onClick={handleNext}
          aria-label="Next page"
        />
      </div>
    </div>
  );
}
