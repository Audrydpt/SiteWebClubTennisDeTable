import JobTabs, { TabJob } from './job-tabs';
import { SortButtons, SortType } from './buttons';

interface HeaderProps {
  sortType: SortType;
  setSortType: (type: SortType) => void;
  sortOrder: 'asc' | 'desc';
  toggleSortOrder: () => void;
  clearResults: () => void;
  tabJobs?: TabJob[];
  activeTabIndex?: number;
  onTabChange?: (tabIndex: number) => void;
  loading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  onDeleteTab?: (tabIndex: number) => void;
  onDeleteAllTabs?: () => void;
}

export default function ForensicHeader({
  sortType,
  setSortType,
  sortOrder,
  toggleSortOrder,
  clearResults,
  tabJobs = [],
  activeTabIndex = 1,
  onTabChange = () => {},
  loading = false,
  setIsLoading = () => {},
  onDeleteTab = () => {},
  onDeleteAllTabs = () => {},
}: HeaderProps) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center gap-4">
        <div className="flex-grow">
          <JobTabs
            tabJobs={tabJobs}
            activeTabIndex={activeTabIndex}
            onTabChange={onTabChange}
            isLoading={loading}
            hideTitle={false}
            setIsLoading={setIsLoading}
            onDeleteTab={onDeleteTab}
          />
        </div>
        <div className="flex-shrink-0">
          <SortButtons
            sortType={sortType}
            setSortType={setSortType}
            sortOrder={sortOrder}
            toggleSortOrder={toggleSortOrder}
            clearResults={clearResults}
            onDeleteAllTabs={onDeleteAllTabs}
          />
        </div>
      </div>
    </div>
  );
}
