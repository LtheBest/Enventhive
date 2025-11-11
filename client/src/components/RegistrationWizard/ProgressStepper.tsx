import { CheckCircle2 } from 'lucide-react';

interface ProgressStepperProps {
  currentStep: number;
}

const steps = [
  { number: 1, title: 'Entreprise' },
  { number: 2, title: 'Adresse' },
  { number: 3, title: 'Plan' },
  { number: 4, title: 'Compte' },
];

export function ProgressStepper({ currentStep }: ProgressStepperProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <div
                className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 
                  ${
                    step.number < currentStep
                      ? 'bg-primary border-primary text-primary-foreground'
                      : step.number === currentStep
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'bg-background border-muted-foreground/30 text-muted-foreground'
                  }
                `}
                data-testid={`step-indicator-${step.number}`}
              >
                {step.number < currentStep ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-semibold">{step.number}</span>
                )}
              </div>
              <span className={`
                mt-2 text-xs font-medium
                ${step.number <= currentStep ? 'text-foreground' : 'text-muted-foreground'}
              `}>
                {step.title}
              </span>
            </div>

            {/* Connecting line */}
            {index < steps.length - 1 && (
              <div
                className={`
                  flex-1 h-0.5 mx-2 mb-6
                  ${step.number < currentStep ? 'bg-primary' : 'bg-muted-foreground/30'}
                `}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
