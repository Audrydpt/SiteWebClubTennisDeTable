import Header from '@/components/header';
import { Button } from '@/components/ui/button';
import { defineStepper } from '@/components/ui/stepper';

const {
  StepperProvider,
  StepperNavigation,
  StepperStep,
  StepperTitle,
  StepperControls,
  StepperPanel,
} = defineStepper(
  { id: 'step-1', title: 'Source' },
  { id: 'step-2', title: 'Duration' },
  { id: 'step-3', title: 'Format' }
);

export default function ExportDashboard() {
  return (
    <>
      <Header title="Export Dashboard">uh</Header>
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
                'step-1': (step) => `Step: ${step.id}`,
                'step-2': (step) => `Step: ${step.id}`,
                'step-3': (step) => `Step: ${step.id}`,
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
