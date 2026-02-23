export type SidebarSide = "left" | "right";

export interface LayoutState {
  leftOpen: boolean;
  rightOpen: boolean;
}

let state: LayoutState = {
  leftOpen: false,
  rightOpen: true,
};

const listeners = new Set<(s: LayoutState) => void>();

export function getLayoutState(): LayoutState {
  return { ...state };
}

export function subscribeLayoutState(listener: (s: LayoutState) => void): () => void {
  listeners.add(listener);
  // Call immediately with current state.
  listener(getLayoutState());
  return () => listeners.delete(listener);
}

function commit(next: LayoutState): void {
  // Avoid noisy re-renders when nothing changed.
  if (next.leftOpen === state.leftOpen && next.rightOpen === state.rightOpen) return;

  state = next;
  const snapshot = getLayoutState();
  listeners.forEach((l) => l(snapshot));
}

export function openSidebar(side: SidebarSide): void {
  if (side === "left") {
    // Opening left closes right.
    commit({ leftOpen: true, rightOpen: false });
  } else {
    // Opening right closes left.
    commit({ leftOpen: false, rightOpen: true });
  }
}

export function closeSidebar(side: SidebarSide): void {
  if (side === "left") {
    commit({ ...state, leftOpen: false });
  } else {
    commit({ ...state, rightOpen: false });
  }
}

export function toggleSidebar(side: SidebarSide): void {
  const current = getLayoutState();
  if (side === "left") {
    if (current.leftOpen) closeSidebar("left");
    else openSidebar("left");
  } else {
    if (current.rightOpen) closeSidebar("right");
    else openSidebar("right");
  }
}

export function closeAllSidebars(): void {
  commit({ leftOpen: false, rightOpen: false });
}
