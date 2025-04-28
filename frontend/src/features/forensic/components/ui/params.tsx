import { Accordion } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';

import Appearances from '../paramsForm/appareances';
import Attributes from '../paramsForm/attributes';
import Sources from '../paramsForm/sources';
import Times from '../paramsForm/times';
import Types from '../paramsForm/types';

interface ParamsProps {
  isCollapsed: boolean;
}

export default function Params({ isCollapsed }: ParamsProps) {
  if (isCollapsed) {
    return <div className="flex flex-col h-full" />;
  }

  return (
    <ScrollArea className="flex-1" scrollHideDelay={0}>
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
