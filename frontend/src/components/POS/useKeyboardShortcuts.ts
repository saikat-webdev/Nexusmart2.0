import { useEffect, useRef } from 'react';

interface KeyboardShortcutActions {
  onF2?: () => void;  // Focus search
  onF9?: () => void;  // Checkout
  onF10?: () => void; // Clear cart
  onEscape?: () => void; // Cancel/Close
  onCtrlK?: () => void; // Focus customer search
}

export const useKeyboardShortcuts = (actions: KeyboardShortcutActions) => {
  const actionsRef = useRef(actions);

  useEffect(() => {
    actionsRef.current = actions;
  }, [actions]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // F2 - Focus search (works even in inputs)
      if (e.key === 'F2') {
        e.preventDefault();
        actionsRef.current.onF2?.();
        return;
      }

      // Escape - Close dialogs (works everywhere)
      if (e.key === 'Escape') {
        e.preventDefault();
        actionsRef.current.onEscape?.();
        return;
      }

      // Don't process other shortcuts if typing in input
      if (isInput) {
        // Ctrl+K works in inputs too
        if (e.ctrlKey && e.key === 'k') {
          e.preventDefault();
          actionsRef.current.onCtrlK?.();
        }
        return;
      }

      // F9 - Checkout
      if (e.key === 'F9') {
        e.preventDefault();
        actionsRef.current.onF9?.();
        return;
      }

      // F10 - Clear cart
      if (e.key === 'F10') {
        e.preventDefault();
        actionsRef.current.onF10?.();
        return;
      }

      // Ctrl+K - Focus customer search
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        actionsRef.current.onCtrlK?.();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
};
