/* eslint-disable react/no-unstable-nested-components */
import { Database, FileDown, Settings2 } from 'lucide-react';
import { useState } from 'react';

import Header from '@/components/header';
import { Button } from '@/components/ui/button';
import { defineStepper } from '@/components/ui/stepper';

import ExportStepFormat from './components/export-format';
import ExportStepOptions from './components/export-options';
import ExportStepSource from './components/export-source';
import { StepperFormData } from './lib/export';
import { AcicAggregation, AcicEvent } from './lib/props';

const {
  StepperProvider,
  StepperNavigation,
  StepperStep,
  StepperTitle,
  StepperControls,
  StepperPanel,
} = defineStepper(
  { id: 'step-1', title: 'Source', icon: <Database /> },
  { id: 'step-2', title: 'Options', icon: <Settings2 /> },
  { id: 'step-3', title: 'Format', icon: <FileDown /> }
);

export default function ExportDashboard() {
  const [storedWidget, setStoredWidget] = useState<StepperFormData>({
    table: AcicEvent.AcicCounting,
  } as StepperFormData);
  const [isStepValid, setIsStepValid] = useState(false);

  const updateStoredWidget = (newData: Partial<StepperFormData>) => {
    setStoredWidget((prev) => ({
      ...prev,
      ...newData,
    }));
  };

  const handleReset = () => {
    storedWidget.table = AcicEvent.AcicCounting;
    storedWidget.aggregation = AcicAggregation.OneHour;
    storedWidget.range = undefined;
    storedWidget.where = undefined;
    storedWidget.groupBy = undefined;
    storedWidget.format = undefined;
    storedWidget.duration = undefined;
    setStoredWidget(storedWidget);
  };

  return (
    <>
      <Header title="Export Dashboard" />
      <StepperProvider>
        {({ methods }) => (
          <>
            <StepperNavigation className="p-8">
              {methods.all.map((step) => (
                <StepperStep
                  key={step.id}
                  of={step.id}
                  icon={step.icon}
                  disabled={!methods.current.id.includes(step.id)}
                >
                  <StepperTitle>{step.title}</StepperTitle>
                </StepperStep>
              ))}
            </StepperNavigation>

            <StepperPanel className="content-center rounded border bg-slate-50 p-8">
              {methods.switch({
                'step-1': () => (
                  <ExportStepSource
                    storedWidget={storedWidget}
                    updateStoredWidget={updateStoredWidget}
                    setStepValidity={setIsStepValid}
                  />
                ),
                'step-2': () => (
                  <ExportStepOptions
                    storedWidget={storedWidget}
                    updateStoredWidget={updateStoredWidget}
                    setStepValidity={setIsStepValid}
                  />
                ),
                'step-3': () => (
                  <ExportStepFormat
                    storedWidget={storedWidget}
                    updateStoredWidget={updateStoredWidget}
                    setStepValidity={setIsStepValid}
                  />
                ),
              })}
            </StepperPanel>

            <StepperControls className="p-8">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsStepValid(true);
                  methods.prev();
                }}
                disabled={methods.isFirst}
              >
                Précédent
              </Button>
              <Button
                onClick={() => {
                  if (!isStepValid) return;
                  if (methods.isLast) {
                    methods.reset();
                    handleReset();
                  } else {
                    methods.next();
                  }
                }}
                disabled={!isStepValid}
              >
                {methods.isLast ? 'Reset' : 'Suivant'}
              </Button>
            </StepperControls>
          </>
        )}
      </StepperProvider>
    </>
  );
}
