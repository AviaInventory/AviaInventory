import { Check } from "lucide-react";
import { ORDER_STEPS, currentStepIndex } from "./workflow";

/** Purchase order -> Invoice -> Payment -> Dispatch -> Received, with the current step highlighted. */
export default function OrderProgress({ status }: { status: string }) {
  const current = currentStepIndex(status);
  const cancelled = status === "Cancelled";
  return (
    <ol className="grid grid-cols-5 gap-1 sm:gap-2" aria-label="Order progress">
      {ORDER_STEPS.map((step, index) => {
        const done = !cancelled && index < current;
        const active = !cancelled && index === current;
        return (
          <li key={step.key} className="min-w-0 text-center" aria-current={active ? "step" : undefined}>
            <div className={`h-1.5 rounded-full ${done ? "bg-aviation-success" : active ? "bg-aviation-primary" : "bg-aviation-border"}`} />
            <div className="mt-2 flex flex-col items-center gap-1 sm:flex-row sm:justify-center">
              <span className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${done ? "bg-aviation-success text-white" : active ? "bg-aviation-primary text-white" : "bg-aviation-light text-aviation-muted"}`}>
                {done ? <Check size={13} /> : index + 1}
              </span>
              <span className={`text-[11px] font-semibold leading-tight sm:text-xs ${active ? "text-aviation-primary" : done ? "text-aviation-dark" : "text-aviation-muted"}`}>{step.label}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
