/* eslint-disable @typescript-eslint/no-unused-vars,react/no-unused-prop-types */
import { SortAsc, SortDesc, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import DeleteConfirmation from '@/components/confirm-delete';
import { Button } from '@/components/ui/button';

import { useJobsContext } from '../../providers/job-context';
import { useSearchContext } from '../../providers/search-context';

export type SortType = 'score' | 'date';

export function SortButtons() {
  const { deleteAllTabs } = useJobsContext();
  const { order, setOrder, setCurrentPage } = useSearchContext();
  const { t } = useTranslation();

  const handleSortBy = (by: 'score' | 'date') => {
    setOrder({ ...order, by });
    setCurrentPage(1);
  };

  const toggleSortOrder = () => {
    setOrder({
      ...order,
      direction: order.direction === 'desc' ? 'asc' : 'desc',
    });
    setCurrentPage(1);
  };

  return (
    <div className="flex gap-2">
      {/* Contrôles de tri */}
      <div className="flex items-center gap-1 mr-2">
        <Button
          variant={order.by === 'score' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleSortBy('score')}
        >
          {t('forensic:buttons.score')}
        </Button>
        <Button
          variant={order.by === 'date' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleSortBy('date')}
        >
          {t('forensic:buttons.date')}
        </Button>
      </div>

      {/* Bouton pour basculer l'ordre */}
      <Button
        variant="outline"
        size="icon"
        onClick={toggleSortOrder}
        className="size-8"
        title={
          order.direction === 'desc'
            ? t('forensic:buttons.descending')
            : t('forensic:buttons.ascending')
        }
      >
        {order.direction === 'desc' ? (
          <SortDesc className="size-4" />
        ) : (
          <SortAsc className="size-4" />
        )}
      </Button>

      {/* Bouton pour vider les résultats avec confirmation */}
      <DeleteConfirmation
        onDelete={deleteAllTabs}
        title={t('forensic:buttons.delete_all_results')}
        description={t('forensic:buttons.delete_all_results_description')}
        confirmText={t('forensic:buttons.delete_all_results_confirm')}
      >
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-destructive"
          title={t('forensic:buttons.clear_results')}
        >
          <Trash2 className="size-4" />
        </Button>
      </DeleteConfirmation>
    </div>
  );
}
