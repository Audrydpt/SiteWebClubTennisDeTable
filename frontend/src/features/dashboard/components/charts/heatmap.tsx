/* eslint-disable @stylistic/indent */
import { useQuery } from '@tanstack/react-query';
import { DateTime, Duration } from 'luxon';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';

import {
  AcicAggregation,
  AggregationTypeToObject,
  ChartProps,
} from '../../lib/props';
import { getWidgetData } from '../../lib/utils';

interface DataItem {
  timestamp: string;
  count: number;
}

type HeatmapProps = ChartProps & {
  layout?: 'vertical' | 'horizontal';
  aggregation?: AcicAggregation;
  duration?: AcicAggregation;
};

const hourClasses = [
  'bg-primary/[0.05]',
  'bg-primary/[0.1]',
  'bg-primary/[0.2]',
  'bg-primary/[0.3]',
  'bg-primary/[0.4]',
  'bg-primary/[0.5]',
  'bg-primary/[0.6]',
  'bg-primary/[0.7]',
  'bg-primary/[0.8]',
  'bg-primary/[0.9]',
  'bg-primary',
];

const getOpacityClass = (
  count: number | undefined,
  maxCount: number
): string => {
  if (count === undefined || count === null) return 'bg-muted';
  const ratio = count / maxCount;
  const index = Math.floor(ratio * (hourClasses.length - 1));
  return hourClasses[index];
};

const formatTimestamp = (
  locale: string,
  timestamp: string,
  aggregation: AcicAggregation
) => {
  const date = DateTime.fromISO(timestamp).setLocale(locale);
  if (aggregation === AcicAggregation.OneMinute) {
    return {
      rowKey: date.toFormat('yyyy-MM-dd HH'),
      rowLabel: date.toFormat("HH'h'"),
      columnKey: date.toFormat('mm'),
      columnLabel: date.toFormat('mm'),
    };
  }
  if (aggregation === AcicAggregation.FifteenMinutes) {
    const minutes = date.minute;
    const slot = Math.floor(minutes / 15) * 15;
    return {
      rowKey: date.toFormat('yyyy-MM-dd HH'),
      rowLabel: date.toFormat("HH'h'"),
      columnKey: slot.toString().padStart(2, '0'),
      columnLabel: `${slot.toString().padStart(2, '0')}-${(slot + 14).toString().padStart(2, '0')}`,
    };
  }
  if (aggregation === AcicAggregation.ThirtyMinutes) {
    const minutes = date.minute;
    const slot = Math.floor(minutes / 30) * 30;
    return {
      rowKey: date.toFormat('yyyy-MM-dd HH'),
      rowLabel: date.toFormat("HH'h'"),
      columnKey: slot.toString().padStart(2, '0'),
      columnLabel: `${slot.toString().padStart(2, '0')}-${(slot + 29).toString().padStart(2, '0')}`,
    };
  }
  if (aggregation === AcicAggregation.OneHour) {
    return {
      rowKey: date.toFormat('yyyy-MM-dd'),
      rowLabel: date.toFormat('ccc dd/MM'),
      columnKey: date.toFormat('HH'),
      columnLabel: date.toFormat('HH'),
    };
  }
  if (aggregation === AcicAggregation.OneDay) {
    return {
      rowKey: date.toFormat('yyyy-MM'),
      rowLabel: date.toFormat('MMM yyyy'),
      columnKey: date.toFormat('dd'),
      columnLabel: date.toFormat('dd'),
    };
  }
  if (aggregation === AcicAggregation.OneWeek) {
    const { weekNumber } = date;
    const weekStart = date.startOf('week');
    const weekEnd = date.endOf('week');

    return {
      rowKey: date.toFormat('yyyy-MM'),
      rowLabel: date.toFormat('MMM yyyy'),
      columnKey: weekStart.toFormat('dd'),
      columnLabel: `W${weekNumber}\n${weekStart.toFormat('dd')}-${weekEnd.toFormat('dd')}`,
    };
  }
  return {
    rowKey: '',
    rowLabel: '',
    columnKey: '',
    columnLabel: '',
  };
};

const generateColumns = (aggregation: AcicAggregation) => {
  if (aggregation === AcicAggregation.OneMinute) {
    return Array.from({ length: 60 }, (_, i) => ({
      key: i.toString().padStart(2, '0'),
      label: i.toString().padStart(2, '0'),
    }));
  }
  if (aggregation === AcicAggregation.FifteenMinutes) {
    return Array.from({ length: 4 }, (_, i) => {
      const start = i * 15;
      const end = start + 14;
      return {
        key: start.toString().padStart(2, '0'),
        label: `${start.toString().padStart(2, '0')}-${end.toString().padStart(2, '0')}`,
      };
    });
  }
  if (aggregation === AcicAggregation.ThirtyMinutes) {
    return Array.from({ length: 2 }, (_, i) => {
      const start = i * 30;
      const end = start + 29;
      return {
        key: start.toString().padStart(2, '0'),
        label: `${start.toString().padStart(2, '0')}-${end.toString().padStart(2, '0')}`,
      };
    });
  }
  if (aggregation === AcicAggregation.OneHour) {
    return Array.from({ length: 24 }, (_, i) => ({
      key: i.toString().padStart(2, '0'),
      label: `${i.toString().padStart(2, '0')}h`,
    }));
  }
  if (aggregation === AcicAggregation.OneDay) {
    return Array.from({ length: 31 }, (_, i) => ({
      key: (i + 1).toString().padStart(2, '0'),
      label: (i + 1).toString().padStart(2, '0'),
    }));
  }
  if (aggregation === AcicAggregation.OneWeek) {
    return Array.from({ length: 6 }, (_, i) => ({
      key: (i * 7 + 1).toString().padStart(2, '0'),
      label: `W${i + 1}`,
    }));
  }
  return [];
};

const getAggregationLabel = (
  t: (key: string) => string,
  aggregation: AcicAggregation
) => {
  switch (aggregation) {
    case AcicAggregation.OneMinute:
      return t('dashboard:heatmap.hourMinute');
    case AcicAggregation.FifteenMinutes:
      return t('dashboard:heatmap.hour15min');
    case AcicAggregation.ThirtyMinutes:
      return t('dashboard:heatmap.hour30min');
    case AcicAggregation.OneHour:
      return t('dashboard:heatmap.dayHour');
    case AcicAggregation.OneDay:
      return t('dashboard:heatmap.monthDay');
    case AcicAggregation.OneWeek:
      return t('dashboard:heatmap.monthWeek');
    default:
      return '';
  }
};

interface HeatmapCellProps {
  cellData: DataItem | undefined;
  maxCount: number;
  legend: string;
  onMouseEnter?: (e: React.MouseEvent<HTMLTableCellElement>) => void;
  onMouseLeave?: () => void;
}

function HeatmapCell({
  cellData,
  maxCount,
  legend,
  onMouseEnter,
  onMouseLeave,
}: HeatmapCellProps) {
  const opacityClass = getOpacityClass(cellData?.count, maxCount);
  return (
    <td
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`border ${opacityClass}`}
      aria-label={legend}
    />
  );
}

export default function HeatmapComponent({
  layout = 'horizontal',
  ...props
}: HeatmapProps) {
  const { t, i18n } = useTranslation();
  const { widgetId, title, table, aggregation, duration, where, page } = props;
  const { isLoading, isError, data } = useQuery({
    queryKey: [widgetId, table, aggregation, duration, where, page],
    queryFn: () =>
      getWidgetData(
        { widgetId, table, aggregation, duration, where },
        undefined,
        page
      ),
    refetchInterval: Duration.fromObject(
      AggregationTypeToObject[aggregation]
    ).as('milliseconds'),
  });

  const { cellMatrix, chartConfig, sortedRowKeys, rowLabels } = useMemo(() => {
    if (!data)
      return {
        cellMatrix: {},
        chartConfig: { maxCount: 0 },
        sortedRowKeys: [],
        rowLabels: {},
      };

    const matrix: Record<string, Record<string, DataItem>> = {};
    const labels: Record<string, string> = {};
    let maxCount = 0;

    (data as DataItem[]).forEach((item) => {
      const { rowKey, rowLabel, columnKey } = formatTimestamp(
        i18n.language,
        item.timestamp,
        aggregation
      );

      if (!matrix[rowKey]) {
        matrix[rowKey] = {};
        labels[rowKey] = rowLabel;
      }

      matrix[rowKey][columnKey] = item;
      maxCount = Math.max(maxCount, item.count);
    });

    return {
      cellMatrix: matrix,
      chartConfig: { maxCount },
      sortedRowKeys: Object.keys(matrix).sort(),
      rowLabels: labels,
    };
  }, [i18n.language, data, aggregation]);

  const columns = useMemo(() => generateColumns(aggregation), [aggregation]);
  const [tooltipInfo, setTooltipInfo] = useState<{
    legend: string;
    x: number;
    y: number;
  } | null>(null);

  if (isLoading || isError) {
    return (
      <Card className="w-full h-full flex flex-col justify-center items-center">
        <CardHeader>
          <CardTitle>{title ?? `Heatmap ${layout.toString()}`}</CardTitle>
        </CardHeader>
        <CardContent className="grow w-full">
          <ChartContainer config={{}} className="h-full w-full">
            {isLoading ? (
              <Skeleton className="h-full w-full bg-muted" />
            ) : (
              <span>Error !</span>
            )}
          </ChartContainer>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-full flex flex-col justify-center">
      <CardHeader>
        <CardTitle className="text-center">
          {title ?? `Heatmap ${layout.toString()}`}
        </CardTitle>
      </CardHeader>
      <CardContent className="grow w-full">
        {layout === 'horizontal' ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-center">
                <th className="p-1 font-medium">
                  {getAggregationLabel(t, aggregation)}
                </th>
                {columns.map((col) => (
                  <th key={col.key} className="p-1 font-medium">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedRowKeys.map((rowKey) => {
                const rowLabel = rowLabels[rowKey];

                return (
                  <tr key={rowKey}>
                    <td className="p-2 font-medium">{rowLabel}</td>
                    {columns.map((col) => {
                      const cellData = cellMatrix[rowKey]?.[col.key];
                      const legend =
                        cellData != null
                          ? t('dashboard:legend.value', {
                              count: cellData.count,
                            })
                          : t('dashboard:legend.no_value');

                      return (
                        <HeatmapCell
                          key={col.key}
                          cellData={cellData}
                          maxCount={chartConfig.maxCount}
                          legend={legend}
                          onMouseEnter={(e) => {
                            const rect = (
                              e.currentTarget as HTMLTableCellElement
                            ).getBoundingClientRect();
                            setTooltipInfo({
                              legend,
                              x: rect.left + rect.width / 2,
                              y: rect.top,
                            });
                          }}
                          onMouseLeave={() => setTooltipInfo(null)}
                        />
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-center">
                <th className="p-2 font-medium">
                  {getAggregationLabel(t, aggregation)}
                </th>
                {sortedRowKeys.map((rowKey) => (
                  <th key={rowKey} className="p-1 font-medium">
                    {rowLabels[rowKey]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {columns.map((col) => (
                <tr key={col.key}>
                  <td className="p-1 font-medium">{col.label}</td>
                  {sortedRowKeys.map((rowKey) => {
                    const cellData = cellMatrix[rowKey]?.[col.key];
                    const legend =
                      cellData != null
                        ? t('dashboard:legend.value', {
                            count: cellData.count,
                          })
                        : t('dashboard:legend.no_value');

                    return (
                      <HeatmapCell
                        key={rowKey}
                        cellData={cellData}
                        maxCount={chartConfig.maxCount}
                        legend={legend}
                        onMouseEnter={(e) => {
                          const rect = (
                            e.currentTarget as HTMLTableCellElement
                          ).getBoundingClientRect();
                          setTooltipInfo({
                            legend,
                            x: rect.left + rect.width / 2,
                            y: rect.top,
                          });
                        }}
                        onMouseLeave={() => setTooltipInfo(null)}
                      />
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {tooltipInfo && (
          <div
            style={{
              position: 'fixed',
              top: tooltipInfo.y - 8,
              left: tooltipInfo.x,
              transform: 'translate(-50%, -100%)',
            }}
            className="z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95"
          >
            {tooltipInfo.legend}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
