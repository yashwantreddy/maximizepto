import { useEffect, useMemo, useState } from 'react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const STEPS = [
  {
    title: 'Shape your leave budget',
    body: 'Set monthly accrual and strategy intensity first. This changes every recommendation and yield score.'
  },
  {
    title: 'Compare scenarios before deciding',
    body: 'Use the What-If Lab to compare your current strategy against a more conservative or aggressive option.'
  },
  {
    title: 'Ship a manager-ready plan',
    body: 'Use Action Deck to export CSV and copy a concise summary you can send for approval.'
  }
] as const;

export function OnboardingModal({ isOpen, onClose, onComplete }: OnboardingModalProps) {
  const [stepIndex, setStepIndex] = useState(0);

  const step = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;
  const progress = useMemo(() => ((stepIndex + 1) / STEPS.length) * 100, [stepIndex]);

  useEffect(() => {
    if (isOpen) {
      setStepIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="onboarding-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      onClick={onClose}
    >
      <div className="onboarding-card" onClick={(event) => event.stopPropagation()}>
        <p className="eyebrow">Welcome to Escape Atelier</p>
        <h3 id="onboarding-title">{step.title}</h3>
        <p>{step.body}</p>

        <div className="onboarding-progress" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>

        <div className="onboarding-controls">
          <button type="button" className="action-btn" onClick={onClose}>
            Skip
          </button>

          {!isLastStep ? (
            <button
              type="button"
              className="action-btn primary"
              onClick={() => setStepIndex((current) => current + 1)}
            >
              Next
            </button>
          ) : (
            <button type="button" className="action-btn primary" onClick={onComplete}>
              Start Planning
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
