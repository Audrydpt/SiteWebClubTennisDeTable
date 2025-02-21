/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unstable-nested-components */
import { useState } from 'react';

import Header from '@/components/header';
import { Button } from '@/components/ui/button';
import { defineStepper } from '@/components/ui/stepper';
import ExportSource from './components/export-source';
import { ExportSchema } from './components/form-export';
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
  const [formData, setFormData] = useState<ExportSchema>({
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
    format: '' as 'Excel' | 'PDF',
  });

  const updateFormData = (newData: Partial<ExportSchema['source']>) => {
    setFormData((prev) => ({
      ...prev,
      source: { ...prev.source, ...newData },
    }));
  };

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
                'step-1': () => (
                  <>
                    <ExportSource updateFormData={updateFormData} />
                    {console.log('formData before step-1:', formData)}
                  </>
                ),
                'step-2': () => (
                  <>
                    <div>StepOptions</div>
                    {console.log('formData before step-2:', formData)}
                  </>
                ),
                'step-3': () => (
                  <>
                    <div>StepFormat</div>
                    {console.log('formData before step-3:', formData)}
                  </>
                ),
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
              <Button
                onClick={() => {
                  if (methods.isLast) {
                    methods.reset();
                  } else {
                    methods.next();
                  }
                }}
              >
                {methods.isLast ? 'Reset' : 'Next'}
              </Button>
            </StepperControls>
          </>
        )}
      </StepperProvider>
    </>
  );
}
