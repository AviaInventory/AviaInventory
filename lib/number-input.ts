/**
 * Controlled number inputs that can be cleared.
 *
 * Forms keep numbers in state, and an empty box used to be stored as 0 and shown
 * as "0" again, so users could not delete it and ended up typing "050". An unset
 * value (0, NaN, null) is now shown as an empty box; the form's own validation
 * still rejects it on submit.
 */
export function numberInputValue(value: number | string | null | undefined): number | string {
  if (value === null || value === undefined || value === "") return "";
  const n = Number(value);
  return Number.isFinite(n) && n !== 0 ? value : "";
}

/** Reads a number input; an empty box becomes 0, which validation treats as "not entered". */
export function parseNumberInput(raw: string): number {
  if (raw.trim() === "") return 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}
