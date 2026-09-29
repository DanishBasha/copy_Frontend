import { useEffect, useRef } from 'react';

/**
 * Hook to handle browser back navigation (e.g. double-finger swipe gesture, Android back button, or back click)
 * to close open modals or dialogs instead of navigating away or closing the web app.
 *
 * @param isOpen Whether the modal/overlay is currently active.
 * @param onClose Callback to close the modal.
 */
export const useBackHandler = (isOpen: boolean, onClose: () => void) => {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    // Push a modal history state
    const stateId = `modal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    try {
      window.history.pushState(
        { crpApp: true, isModal: true, modalId: stateId },
        ''
      );
    } catch {
      // Ignore if pushState fails
    }

    let closedByPop = false;

    const handlePopState = () => {
      closedByPop = true;
      onCloseRef.current();
    };

    window.addEventListener('popstate', handlePopState, { once: true });

    return () => {
      window.removeEventListener('popstate', handlePopState);
      // If modal was closed by UI button / click outside / form submission (not popstate),
      // cleanly revert the modal history entry we pushed so browser history stays in sync.
      if (!closedByPop && window.history.state?.modalId === stateId) {
        window.history.back();
      }
    };
  }, [isOpen]);
};
