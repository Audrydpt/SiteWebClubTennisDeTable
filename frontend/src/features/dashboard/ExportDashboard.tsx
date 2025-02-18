/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/no-unstable-nested-components */
import { useState } from 'react';

import Header from '@/components/header';
import { Button } from '@/components/ui/button';
import { defineStepper } from '@/components/ui/stepper';
import StepSource from './components/export-source';

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
    eventType: '',
    startDate: '',
    endDate: '',
    streamIds: [],
    tables: [],
  });

  const handleFormUpdate = (updates: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };
  return (
    <>
      <Header title="Export Dashboard"> </Header>
      <StepperProvider>
        {({ methods }) => (
          <>
            <StepperNavigation className="p-8">
              {methods.all.map((step) => (
                <StepperStep of={step.id} onClick={() => methods.goTo(step.id)}>
                  <StepperTitle>{step.title}</StepperTitle>
                </StepperStep>
              ))}
            </StepperNavigation>
            <StepperPanel className="h-[600px] content-center rounded border bg-slate-50 p-8">
              {methods.switch({
                'step-1': (step) => (
                  <StepSource formData={formData} onUpdate={handleFormUpdate} />
                ),
                'step-2': (step) => <div>Step: {step.id}</div>,
                'step-3': (step) => <div>Step: {step.id}</div>,
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
