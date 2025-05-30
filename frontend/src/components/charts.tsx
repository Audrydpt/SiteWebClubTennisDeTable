import { DateTime } from 'luxon';
import {
  NameType,
  Payload,
  ValueType,
} from 'recharts/types/component/DefaultTooltipContent';

import {
  AcicAggregation,
  AggregationTypeToObject,
} from '@/features/dashboard/lib/props';
import { cn } from '@/lib/utils';
import { ChartConfig } from './ui/chart';

export function CustomChartTooltip(
  value: ValueType,
  name: NameType,
  item: Payload<ValueType, NameType>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _index: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _payload: Array<Payload<ValueType, NameType>>,
  chartConfig: ChartConfig | null = null
) {
  const color = item.color || item.stroke || item.payload.fill;
  const unit = item.unit || '';
  const v = unit === '%' ? Math.round(Number(value) * 100) : Number(value);
  const label = chartConfig?.[String(name)]?.label || name;

  return (
    <>
      <div
        className="shrink-0 rounded-[2px] border-border bg-(--color-bg) h-2.5 w-2.5"
        style={
          {
            '--color-bg': color,
            '--color-border': color,
          } as React.CSSProperties
        }
      />
      <div
        className={cn(
          'flex flex-1 gap-1.5 justify-between leading-none items-center'
        )}
      >
        <div className="grid gap-1.5">
          <span className="text-muted-foreground">{label}</span>
        </div>
        {value && (
          <span className="font-mono font-medium tabular-nums text-foreground">
            {v.toLocaleString()} {unit}
          </span>
        )}
      </div>
    </>
  );
}
export function CustomChartTickValue(value: string, unit: string = '') {
  const v = unit === '%' ? Math.round(Number(value) * 100) : Number(value);
  return `${v.toLocaleString()} ${unit}`;
}
export function CustomChartTickDate(
  locale: string,
  value: string,
  format: string,
  aggregation?: AcicAggregation
) {
  const dt = DateTime.fromISO(value).setLocale(locale);
  if (aggregation) {
    const dur = AggregationTypeToObject[aggregation];
    return dt.minus(dur).toFormat(format);
  }

  return dt.toFormat(format);
}
export function CustomChartLabel(value: string | number, label: string) {
  if (typeof value === 'number') {
    return `${label}: ${value.toLocaleString()}`;
  }

  const num = Number(value);
  if (Number.isFinite(num) && value !== '') {
    return `${label}: ${num.toLocaleString()}`;
  }

  return value;
}
