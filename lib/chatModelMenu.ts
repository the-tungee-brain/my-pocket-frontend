import { MAIN_CONTENT_ID } from "@/lib/positionAnalysis";

const MODEL_MENU_OPEN_BLOCK_MS = 500;

let mainContentScrollLockCount = 0;
let savedMainContentOverflow = "";

function lockMainContentScroll() {
  mainContentScrollLockCount += 1;
  if (mainContentScrollLockCount > 1) return;

  const main = document.getElementById(MAIN_CONTENT_ID);
  if (!main) return;

  savedMainContentOverflow = main.style.overflow;
  main.style.overflow = "hidden";
}

function unlockMainContentScroll() {
  mainContentScrollLockCount = Math.max(0, mainContentScrollLockCount - 1);
  if (mainContentScrollLockCount > 0) return;

  const main = document.getElementById(MAIN_CONTENT_ID);
  if (!main) return;

  main.style.overflow = savedMainContentOverflow;
}

/** Prevent page scroll while a model menu is open. Returns cleanup. */
export function lockMainContentWhileModelMenuOpen() {
  lockMainContentScroll();
  return unlockMainContentScroll;
}

let blockModelMenuOpenUntil = 0;

const menuRoots = new Set<HTMLElement>();
const dismissCallbacks = new Set<() => void>();
let globalListenerAttached = false;

export function markModelMenuDismissed() {
  blockModelMenuOpenUntil = Date.now() + MODEL_MENU_OPEN_BLOCK_MS;
}

export function clearModelMenuOpenBlock() {
  blockModelMenuOpenUntil = 0;
}

export function shouldBlockModelMenuOpen() {
  return Date.now() < blockModelMenuOpenUntil;
}

function isInsideAnyModelMenu(event: Event) {
  for (const node of event.composedPath()) {
    if (!(node instanceof Node)) continue;
    for (const root of menuRoots) {
      if (root.contains(node)) return true;
    }
  }
  return false;
}

function handleGlobalPointerDown(event: PointerEvent) {
  if (isInsideAnyModelMenu(event)) return;

  markModelMenuDismissed();
  for (const dismiss of dismissCallbacks) {
    dismiss();
  }
}

function ensureGlobalListener() {
  if (globalListenerAttached) return;
  document.addEventListener("pointerdown", handleGlobalPointerDown, true);
  globalListenerAttached = true;
}

function maybeRemoveGlobalListener() {
  if (menuRoots.size > 0 || dismissCallbacks.size > 0) return;
  document.removeEventListener("pointerdown", handleGlobalPointerDown, true);
  globalListenerAttached = false;
}

export function registerModelMenuDismissListener(
  root: HTMLElement,
  onDismiss: () => void,
) {
  menuRoots.add(root);
  dismissCallbacks.add(onDismiss);
  ensureGlobalListener();

  return () => {
    menuRoots.delete(root);
    dismissCallbacks.delete(onDismiss);
    maybeRemoveGlobalListener();
  };
}
