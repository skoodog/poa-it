"use client";

/**
 * BlockingHighlight — when a user tries to advance past a form (clicks the
 * Continue/Save button) but required fields are empty or invalid, every
 * blocking field lights up with a saturated amber highlight so the user
 * knows exactly where to look. Greyed-out "you can't continue" isn't loud
 * enough; this is the louder signal.
 *
 * Usage:
 *
 *   <BlockingHighlightProvider>
 *     <YourFormWithRequiredFields />
 *     <SaveButton onClick={() => {
 *       if (!allValid) {
 *         triggerHighlight();  // call useBlockingHighlightControls().show()
 *         return;
 *       }
 *       ...
 *     }} />
 *   </BlockingHighlightProvider>
 *
 * The control side is exposed via `useBlockingHighlightControls` so the
 * submit handler can flip the highlight on, and reset it after success.
 * Fields inside the provider read `useBlockingHighlight()` to know whether
 * to render in the loud state.
 *
 * The wizard's WizardShell uses this automatically; modals and inline-edit
 * forms can wrap themselves to get the same behavior.
 *
 * Sprint 6 (UX polish round).
 */

import { createContext, useContext, useState, useMemo, useCallback } from "react";

const BlockingHighlightContext = createContext(false);
const BlockingHighlightControlsContext = createContext({
  show: () => {},
  reset: () => {},
});

export function BlockingHighlightProvider({ children }) {
  const [showBlocking, setShowBlocking] = useState(false);

  const controls = useMemo(
    () => ({
      show: () => setShowBlocking(true),
      reset: () => setShowBlocking(false),
    }),
    []
  );

  return (
    <BlockingHighlightContext.Provider value={showBlocking}>
      <BlockingHighlightControlsContext.Provider value={controls}>
        {children}
      </BlockingHighlightControlsContext.Provider>
    </BlockingHighlightContext.Provider>
  );
}

/**
 * Hook for FIELDS: returns true when the user has attempted to advance
 * past unfilled/invalid blockers and this field should highlight.
 */
export function useBlockingHighlight() {
  return useContext(BlockingHighlightContext);
}

/**
 * Hook for SUBMIT HANDLERS: returns { show, reset } to flip the highlight on
 * when the user tries to advance with invalid input, and clear it on success.
 */
export function useBlockingHighlightControls() {
  return useContext(BlockingHighlightControlsContext);
}

/**
 * Try/handle helper for the common pattern: clicking a submit button when
 * the form is invalid should highlight + scroll to the first highlighted
 * field; clicking when valid should call the real handler and clear the
 * highlight.
 *
 *   const onSubmit = useBlockingSubmit(allValid, doActualSubmit);
 *   <button onClick={onSubmit}>Save</button>
 *
 * The hook scrolls to the first element with `data-blocking-target="true"`
 * in the DOM, so fields can mark themselves as scroll-anchors with that
 * data attribute. Optional — the hook works without it.
 */
export function useBlockingSubmit(canProceed, onProceed) {
  const { show, reset } = useBlockingHighlightControls();

  return useCallback(() => {
    if (!canProceed) {
      show();
      // Best-effort scroll to first marked blocking target.
      if (typeof document !== "undefined") {
        const target = document.querySelector('[data-blocking-target="true"]');
        if (target?.scrollIntoView) {
          target.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
      return;
    }
    reset();
    onProceed?.();
  }, [canProceed, onProceed, show, reset]);
}
