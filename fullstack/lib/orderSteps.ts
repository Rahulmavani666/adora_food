export const ORDER_STEPS = [
  "PLACED",
  "ACCEPTED", 
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "COMPLETED"
] as const;

export type OrderStep = typeof ORDER_STEPS[number];

export function stepIndex(status: string): number {
  const index = ORDER_STEPS.indexOf(status as OrderStep);
  return index === -1 ? 0 : index;
}

export function getStepStatus(currentStep: number, stepIndex: number) {
  if (stepIndex < currentStep) return "completed";
  if (stepIndex === currentStep) return "current";
  return "pending";
}


