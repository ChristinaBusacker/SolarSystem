type Listener = (title: string | null) => void;

let focusTitleOverride: string | null = null;
const listeners = new Set<Listener>();

export function getFocusTitleOverride(): string | null {
  return focusTitleOverride;
}

export function setFocusTitleOverride(next: string | null): void {
  const normalized = next && next.trim().length ? next.trim() : null;
  if (normalized === focusTitleOverride) return;

  focusTitleOverride = normalized;
  listeners.forEach(l => l(focusTitleOverride));
}

export function clearFocusTitleOverride(): void {
  setFocusTitleOverride(null);
}

export function subscribeFocusTitleOverride(listener: Listener): () => void {
  listeners.add(listener);
  listener(focusTitleOverride);
  return () => listeners.delete(listener);
}
