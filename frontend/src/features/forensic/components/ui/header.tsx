import JobTabs, { TabJob } from './job-tabs';
import { SortButtons, SortType } from './buttons';

interface HeaderProps {
  sortType: SortType;
  setSortType: (type: SortType) => void;
  sortOrder: 'asc' | 'desc';
  toggleSortOrder: () => void;
  // handleResumeLastSearch: () => Promise<void>;
  clearResults: () => void;
  tabJobs?: TabJob[];
  activeTabIndex?: number;
  onTabChange?: (tabIndex: number) => void;
}

export default function ForensicHeader({
  sortType,
  setSortType,
  sortOrder,
  toggleSortOrder,
  // handleResumeLastSearch,
  clearResults,
  tabJobs = [],
  activeTabIndex = 1,
  onTabChange = () => {},
}: HeaderProps) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center gap-4">
        <div className="flex-grow">
          <JobTabs
            tabJobs={tabJobs}
            activeTabIndex={activeTabIndex}
            onTabChange={onTabChange}
            hideTitle={false}
          />
        </div>
        <div className="flex-shrink-0">
          <SortButtons
            sortType={sortType}
            setSortType={setSortType}
            sortOrder={sortOrder}
            toggleSortOrder={toggleSortOrder}
            // handleResumeLastSearch={handleResumeLastSearch}
            clearResults={clearResults}
          />
        </div>
      </div>
    </div>
  );
}
