/* eslint-disable @typescript-eslint/no-unused-vars */
import { Search } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function Submit() {
  return (
    <div className="sticky bottom-0 left-0 right-0 z-50">
      <div className="flex items-center mb-2">
        <Button type="submit" className="w-full flex-1">
          <Search className="mr-2" size={16} /> Lancer la recherche
        </Button>
      </div>
    </div>
  );
}
