import { useQuery } from '@tanstack/react-query';
import { DateTime, Duration } from 'luxon';
import { useMemo } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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

interface ProcessedData {
  dataMerged: {
    [key: string]: DataItem[];
  };
  chartConfig: {
    maxCount: number;
  };
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

const formatTimestamp = (timestamp: string, aggregation: AcicAggregation) => {
  const date = DateTime.fromISO(timestamp);
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

const getAggregationLabel = (aggregation: AcicAggregation) => {
  switch (aggregation) {
    case AcicAggregation.OneMinute:
      return 'Hour/Minute';
    case AcicAggregation.FifteenMinutes:
      return 'Hour/15min';
    case AcicAggregation.ThirtyMinutes:
      return 'Hour/30min';
    case AcicAggregation.OneHour:
      return 'Day/Hour';
    case AcicAggregation.OneDay:
      return 'Month/Day';
    case AcicAggregation.OneWeek:
      return 'Month/Week';
    default:
      return '';
  }
};

interface HeatmapCellProps {
  cellData: DataItem | undefined;
  maxCount: number;
}

function HeatmapCell({ cellData, maxCount }: HeatmapCellProps) {
  const opacityClass = getOpacityClass(cellData?.count, maxCount);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <td className={`border ${opacityClass}`} />
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-medium">
          {cellData && cellData.count !== null
            ? `Count: ${cellData.count}`
            : 'No data'}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

export default function HeatmapComponent({
  layout = 'horizontal',
  ...props
}: HeatmapProps) {
  const { title, table, aggregation, duration, where } = props;

  const { isLoading, isError, data } = useQuery({
    queryKey: [table, aggregation, duration, where],
    queryFn: () => getWidgetData({ table, aggregation, duration, where }),
    refetchInterval: Duration.fromObject(
      AggregationTypeToObject[aggregation]
    ).as('milliseconds'),
  });

  const { dataMerged, chartConfig, sortedRows } = useMemo(() => {
    if (!data)
      return {
        dataMerged: {},
        chartConfig: { maxCount: 0 },
        sortedRows: [],
      };

    const reduced = (data as DataItem[]).reduce<ProcessedData>(
      (acc, item) => {
        const { rowKey } = formatTimestamp(item.timestamp, aggregation);

        if (!acc.dataMerged[rowKey]) acc.dataMerged[rowKey] = [];

        acc.dataMerged[rowKey].push(item);
        acc.chartConfig.maxCount = Math.max(
          acc.chartConfig.maxCount,
          item.count
        );

        return acc;
      },
      {
        dataMerged: {},
        chartConfig: { maxCount: 0 },
      }
    );

    return {
      dataMerged: reduced.dataMerged,
      chartConfig: reduced.chartConfig,
      sortedRows: Object.keys(reduced.dataMerged).sort(),
    };
  }, [data, aggregation]);

  const columns = useMemo(() => generateColumns(aggregation), [aggregation]);

  if (isLoading || isError) {
    return (
      <Card className="w-full h-full flex flex-col justify-center items-center">
        <CardHeader>
          <CardTitle>{title ?? `Heatmap ${layout.toString()}`}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow w-full">
          {isLoading ? (
            <Skeleton className="h-full w-full bg-muted" />
          ) : (
            <span>Error !</span>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-full flex flex-col justify-center items-center">
      <CardHeader>
        <CardTitle>{title ?? `Heatmap ${layout.toString()}`}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow w-full">
        <TooltipProvider delayDuration={1}>
          {layout === 'horizontal' ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-center">
                  <th className="p-1 font-medium">
                    {getAggregationLabel(aggregation)}
                  </th>
                  {columns.map((col) => (
                    <th key={col.key} className="p-1 font-medium">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row) => {
                  const firstItem = dataMerged[row][0];
                  const { rowLabel } = formatTimestamp(
                    firstItem.timestamp,
                    aggregation
                  );

                  return (
                    <tr key={row}>
                      <td className="p-2 font-medium">{rowLabel}</td>
                      {columns.map((col) => {
                        const cellData = dataMerged[row].find(
                          (item) =>
                            formatTimestamp(item.timestamp, aggregation)
                              .columnKey === col.key
                        );

                        return (
                          <HeatmapCell
                            key={col.key}
                            cellData={cellData}
                            maxCount={chartConfig.maxCount}
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
                    {getAggregationLabel(aggregation)}
                  </th>
                  {sortedRows.map((row) => {
                    const firstItem = dataMerged[row][0];
                    const { rowLabel } = formatTimestamp(
                      firstItem.timestamp,
                      aggregation
                    );
                    return (
                      <th key={row} className="p-1 font-medium">
                        {rowLabel}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {columns.map((col) => (
                  <tr key={col.key}>
                    <td className="p-1 font-medium">{col.label}</td>
                    {sortedRows.map((row) => {
                      const cellData = dataMerged[row].find(
                        (item) =>
                          formatTimestamp(item.timestamp, aggregation)
                            .columnKey === col.key
                      );

                      return (
                        <HeatmapCell
                          key={row}
                          cellData={cellData}
                          maxCount={chartConfig.maxCount}
                        />
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
