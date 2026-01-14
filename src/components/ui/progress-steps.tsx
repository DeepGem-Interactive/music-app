'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: string;
  name: string;
}

interface ProgressStepsProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
}

export function ProgressSteps({ steps, currentStep, onStepClick }: ProgressStepsProps) {
  return (
    <nav aria-label="Progress" className="w-full">
      <ol className="flex items-center">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = onStepClick && index < currentStep;

          return (
            <li
              key={step.id}
              className={cn('relative flex-1', index !== steps.length - 1 && 'pr-8')}
            >
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => isClickable && onStepClick(index)}
                  disabled={!isClickable}
                  className={cn(
                    'relative flex h-8 w-8 items-center justify-center rounded-full',
                    'text-sm font-medium',
                    'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
                    isCompleted && 'bg-indigo-600 text-white hover:bg-indigo-700',
                    isCurrent && 'border-2 border-indigo-600 bg-white text-indigo-600',
                    !isCompleted && !isCurrent && 'border-2 border-gray-300 bg-white text-gray-500',
                    isClickable && 'cursor-pointer',
                    !isClickable && 'cursor-default'
                  )}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </button>
                {index !== steps.length - 1 && (
                  <div
                    className={cn(
                      'absolute top-4 left-8 -ml-px h-0.5 w-full -translate-y-1/2',
                      isCompleted ? 'bg-indigo-600' : 'bg-gray-300'
                    )}
                    aria-hidden="true"
                  />
                )}
              </div>
              <div className="mt-2">
                <span
                  className={cn(
                    'text-xs font-medium',
                    isCurrent ? 'text-indigo-600' : 'text-gray-500'
                  )}
                >
                  {step.name}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
