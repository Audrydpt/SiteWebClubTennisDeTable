import { Copy, Edit3, Share, Trash2 } from 'lucide-react';
import { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import DeleteConfirmation from '@/components/confirm-delete';
import { Button } from '@/components/ui/button';
import { FormWidget, StoredWidget } from './form-widget';
import QuickExport from './quick-export';

type ChartTiles = {
  id: string;
  content: JSX.Element;
  widget: StoredWidget;
};

interface WidgetActionsProps {
  isOperator: boolean;
  item: ChartTiles;
  chartRef: HTMLDivElement | undefined;
  edit: (widget: StoredWidget) => void;
  remove: (id: string) => void;
  clone: (widget: StoredWidget) => void;
}

export default function WidgetActions({
  isOperator,
  item,
  chartRef,
  edit,
  remove,
  clone,
}: WidgetActionsProps) {
  const { t } = useTranslation();

  return (
    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
      {!isOperator && (
        <Button
          variant="ghost"
          size="icon"
          area-label="Clone"
          onClick={() => clone(item.widget)}
        >
          <Copy className="h-4 w-4" />
        </Button>
      )}

      {!isOperator && (
        <QuickExport
          storedWidget={item.widget}
          chartContent={item.content}
          getChartRef={() => chartRef}
          updateStoredWidget={(newData) => edit({ ...item.widget, ...newData })}
          setStepValidity={() => {}}
        >
          <Button variant="default" size="icon" area-label="Export">
            <Share className="h-4 w-4" />
          </Button>
        </QuickExport>
      )}

      {!isOperator && (
        <FormWidget
          onSubmit={(d) => edit({ ...item.widget, ...d })}
          defaultValues={item.widget}
          edition
        >
          <Button variant="secondary" size="icon" area-label="Edit">
            <Edit3 className="h-4 w-4" />
          </Button>
        </FormWidget>
      )}

      {!isOperator && (
        <DeleteConfirmation
          onDelete={() => remove(item.id)}
          description={t('dashboard:widget.deleteConfirmation')}
        >
          <Button variant="destructive" size="icon" aria-label="Delete">
            <Trash2 className="h-4 w-4" />
          </Button>
        </DeleteConfirmation>
      )}
    </div>
  );
}
