/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  NameType,
  Payload,
  ValueType,
} from 'recharts/types/component/DefaultTooltipContent';

import { cn } from '@/lib/utils';

export default function CustomChartTooltip(
  value: ValueType,
  name: NameType,
  item: Payload<ValueType, NameType>,
  _index: number,
  _payload: Array<Payload<ValueType, NameType>>
) {
  const color = item.color || item.stroke || item.payload.fill;
  const unit = item.unit || '';
  const v = unit === '%' ? Math.round(Number(value) * 100) : Number(value);

  return (
    <>
      <div
        className="shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg] h-2.5 w-2.5"
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
          <span className="text-muted-foreground">{name}</span>
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
