import { SortButtons, SortType } from './buttons';
import JobTabs from './job-tabs';

interface HeaderProps {
  sortType: SortType;
  setSortType: (type: SortType) => void;
  sortOrder: 'asc' | 'desc';
  toggleSortOrder: () => void;
  clearResults: () => void;
  onTabChange?: (tabIndex: string) => void;
  loading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}

export default function ForensicHeader({
  sortType,
  setSortType,
  sortOrder,
  toggleSortOrder,
  clearResults,
  onTabChange = () => {},
  loading = false,
  setIsLoading = () => {},
}: HeaderProps) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center gap-4">
        <div className="grow">
          <JobTabs
            onTabChange={onTabChange}
            isLoading={loading}
            hideTitle={false}
            setIsLoading={setIsLoading}
          />
        </div>
        <div className="shrink-0">
          <SortButtons
            sortType={sortType}
            setSortType={setSortType}
            sortOrder={sortOrder}
            toggleSortOrder={toggleSortOrder}
            clearResults={clearResults}
          />
        </div>
      </div>
    </div>
  );
}
