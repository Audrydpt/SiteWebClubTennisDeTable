import { Accordion } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import Appearances from '@/features/forensic/components/paramsForm/appareances.tsx';
import Attributes from '@/features/forensic/components/paramsForm/attributes.tsx';
import Sources from '@/features/forensic/components/paramsForm/sources.tsx';
import Times from '@/features/forensic/components/paramsForm/times.tsx';
import Types from '@/features/forensic/components/paramsForm/types.tsx';

interface ParamsProps {
  isCollapsed: boolean;
}

export default function Params({ isCollapsed }: ParamsProps) {
  if (isCollapsed) {
    return <div className="flex flex-col h-full" />;
  }

  return (
    <ScrollArea className="flex-1">
      <div className="space-y-4">
        <Accordion type="single" defaultValue="sources" collapsible>
          <Sources />
          <Times />
          <Types />
          <Appearances />
          <Attributes />
        </Accordion>
      </div>
    </ScrollArea>
  );
}
