import { useEffect, useState } from 'react';

export default function useSidebarState(
  initialState = window.innerWidth >= 1024
) {
  const [open, setOpen] = useState(initialState);

  useEffect(() => {
    const handleResize = () => setOpen(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { open, setOpen };
}
