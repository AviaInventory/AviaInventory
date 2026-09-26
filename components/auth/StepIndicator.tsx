interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
}

export default function StepIndicator({ currentStep, totalSteps, labels = [] }: StepIndicatorProps) {
  const percentage = Math.round((currentStep / totalSteps) * 100);

  return (
    <div aria-label={`Onboarding progress: ${percentage}% complete`}>
      <div className="flex items-center justify-between gap-3 text-xs font-semibold text-aviation-muted">
        <span>Step {currentStep} of {totalSteps}</span>
        <span>{percentage}% complete</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-aviation-light" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}>
        <div className="h-full rounded-full bg-aviation-primary transition-all duration-200" style={{ width: `${percentage}%` }} />
      </div>
      {labels.length > 0 && (
        <div className="mt-3 hidden grid-cols-6 gap-2 sm:grid">
          {labels.map((label, index) => (
            <span key={label} className={`truncate text-[11px] ${index + 1 === currentStep ? "font-bold text-aviation-primary" : "text-aviation-muted"}`}>
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
