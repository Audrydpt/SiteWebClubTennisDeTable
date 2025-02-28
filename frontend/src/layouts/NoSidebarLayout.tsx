import { Outlet } from 'react-router-dom';

export default function NoSidebarLayout() {
  return (
    <div className="mx-auto flex max-w-6xl flex-wrap items-start gap-6 p-6 sm:p-8">
      <Outlet />
    </div>
  );
}
