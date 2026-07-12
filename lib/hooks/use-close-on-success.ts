"use client";

import { useState } from "react";

/**
 * Runs `onSuccess` once, synchronously during render, the first time `state`
 * transitions to a new (successful) value — without calling setState from an
 * effect. See https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes.
 * `onSuccess` must only call setState setters (no DOM/router side effects).
 */
export function useCloseOnSuccess<S extends { success?: string } | undefined>(
  state: S,
  onSuccess: () => void,
) {
  const [handled, setHandled] = useState(state);
  if (state !== handled) {
    setHandled(state);
    if (state?.success) onSuccess();
  }
}
