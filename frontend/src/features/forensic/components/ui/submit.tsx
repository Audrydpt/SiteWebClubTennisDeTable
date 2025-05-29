import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

export default function Submit() {
  const { t } = useTranslation();
  return (
    <div className="sticky bottom-0 left-0 right-0 pt-4 pb-4 z-50">
      <div className="flex items-center gap-2">
        <Button type="submit" className="w-full flex-1">
          <Search className="mr-2" size={16} /> {t('forensic:submit.launch')}
        </Button>
      </div>
    </div>
  );
}
