import { ChevronLeftCircle, ChevronRightCircle } from 'lucide-react';

interface WidgetRangeNavigatorProps {
  page: number;
  onPageChange: (page: number) => void;
}

export default function WidgetRangeNavigation({
  page,
  onPageChange,
}: WidgetRangeNavigatorProps) {
  const handlePrevious = () => {
    onPageChange(page - 1);
  };

  const handleNext = () => {
    if (page === 0) return;
    onPageChange(page + 1);
  };

  return (
    <div>
      <div className="absolute left-2 top-1/2 transform -translate-y-1/2 cursor-pointer">
        <ChevronLeftCircle
          className="opacity-10 hover:opacity-100 transition-opacity"
          onClick={handlePrevious}
        />
      </div>

      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer">
        <ChevronRightCircle
          className="opacity-10 hover:opacity-100 transition-opacity"
          onClick={handleNext}
        />
      </div>
    </div>
  );
}
