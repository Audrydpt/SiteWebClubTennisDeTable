import { ChevronLeftCircle, ChevronRightCircle } from 'lucide-react';

export default function WidgetRangeNavigation() {
  return (
    <div>
      <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
        <ChevronLeftCircle className="opacity-10 hover:opacity-100 transition-opacity" />
      </div>

      <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
        <ChevronRightCircle className="opacity-10 hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}
