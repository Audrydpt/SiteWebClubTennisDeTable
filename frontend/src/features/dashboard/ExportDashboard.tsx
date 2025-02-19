/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unstable-nested-components */
import { useState } from 'react';

import Header from '@/components/header';
import { Button } from '@/components/ui/button';
import { defineStepper } from '@/components/ui/stepper';
import { AcicEvent } from './lib/props';

const {
  StepperProvider,
  StepperNavigation,
  StepperStep,
  StepperTitle,
  StepperControls,
  StepperPanel,
} = defineStepper(
  { id: 'step-1', title: 'Source' },
  { id: 'step-2', title: 'Options' },
  { id: 'step-3', title: 'Format' }
);

export default function ExportDashboard() {
  const [formData, setFormData] = useState({
    source: {
      startDate: '',
      endDate: '',
      table: {} as AcicEvent,
      streams: [] as number[],
    },
    options: {
      groupBy: '',
      aggregation: '',
      where: [],
    },
    format: 'Excel' as 'Excel' | 'PDF',
  });

  return (
    <>
      <Header title="Export Dashboard"> </Header>
      <StepperProvider>
        {({ methods }) => (
          <>
            <StepperNavigation className="p-8">
              {methods.all.map((step) => (
                <StepperStep
                  key={step.id}
                  of={step.id}
                  onClick={() => methods.goTo(step.id)}
                >
                  <StepperTitle>{step.title}</StepperTitle>
                </StepperStep>
              ))}
            </StepperNavigation>
            <StepperPanel className="h-[600px] content-center rounded border bg-slate-50 p-8">
              {methods.switch({
                'step-1': () => <div>StepSource</div>,
                'step-2': () => <div>StepOptions</div>,
                'step-3': () => <div>StepFormat</div>,
              })}
            </StepperPanel>
            <StepperControls className="p-8">
              <Button
                variant="ghost"
                onClick={methods.prev}
                disabled={methods.isFirst}
              >
                Previous
              </Button>
              <Button onClick={methods.isLast ? methods.reset : methods.next}>
                {methods.isLast ? 'Reset' : 'Next'}
              </Button>
            </StepperControls>
          </>
        )}
      </StepperProvider>
    </>
  );
}
