import { useEffect, useRef } from 'react';

/**
 * Hook to handle browser back navigation (e.g. double-finger swipe gesture, Android back button, or back click)
 * to close open modals or dialogs instead of navigating away or closing the web app.
 *
 * Designed to be completely resilient to React 18 StrictMode double-invocations,
 * fast remounts, and nested modal state trees.
 *
 * @param isOpen Whether the modal/overlay is currently active.
 * @param onClose Callback to close the modal.
 */
export const useBackHandler = (isOpen: boolean, onClose: () => void) => {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const stateIdRef = useRef<string | null>(null);
  const cleanupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // If a cleanup from an immediate StrictMode unmount was scheduled, cancel it!
    if (cleanupTimerRef.current) {
      clearTimeout(cleanupTimerRef.current);
      cleanupTimerRef.current = null;
    }

    if (!isOpen) {
      // If modal was closed via UI state (isOpen turned false), pop our history entry if it's still at top
      if (stateIdRef.current) {
        const idToPop = stateIdRef.current;
        stateIdRef.current = null;
        if (window.history.state?.modalId === idToPop) {
          window.history.back();
        }
      }
      return;
    }

    // Modal is OPEN:
    // Only push history state if we don't already have an active modal state for this hook instance
    if (!stateIdRef.current || window.history.state?.modalId !== stateIdRef.current) {
      const stateId = `modal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      stateIdRef.current = stateId;
      try {
        window.history.pushState(
          { crpApp: true, isModal: true, modalId: stateId },
          ''
        );
      } catch {
        // Ignore if pushState fails
      }
    }

    const currentModalId = stateIdRef.current;
    let closedByPop = false;

    const handlePopState = () => {
      // Check if we are popping away from THIS modal.
      // When back is pressed, the browser navigates back to the PREVIOUS state,
      // so window.history.state?.modalId will no longer be currentModalId.
      if (window.history.state?.modalId !== currentModalId) {
        closedByPop = true;
        stateIdRef.current = null;
        onCloseRef.current();
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);

      // Delay history.back() slightly (50ms) to allow React StrictMode to remount
      // without firing an unwanted back navigation.
      cleanupTimerRef.current = setTimeout(() => {
        cleanupTimerRef.current = null;
        if (!closedByPop && stateIdRef.current && window.history.state?.modalId === currentModalId) {
          stateIdRef.current = null;
          window.history.back();
        }
      }, 50);
    };
  }, [isOpen]);
};
