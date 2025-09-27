import { useEffect, useCallback } from 'react';

/**
 * Hook to manage focus and keyboard navigation for better accessibility
 */
export function useAccessibility() {
  // Focus management
  const focusElement = useCallback((element: HTMLElement | null) => {
    if (element) {
      element.focus();
    }
  }, []);

  // Trap focus within a container (useful for modals)
  const trapFocus = useCallback((container: HTMLElement | null) => {
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Announce messages to screen readers
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  return {
    focusElement,
    trapFocus,
    announce,
  };
}

/**
 * Hook to manage keyboard shortcuts
 */
export function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const modifier = e.ctrlKey || e.metaKey;
      
      // Check for modifier + key combinations
      if (modifier) {
        const shortcut = `ctrl+${key}`;
        if (shortcuts[shortcut]) {
          e.preventDefault();
          shortcuts[shortcut]();
        }
      }
      
      // Check for single key shortcuts (only when not typing in input)
      if (!modifier && !e.target || (e.target as HTMLElement).tagName !== 'INPUT') {
        if (shortcuts[key]) {
          e.preventDefault();
          shortcuts[key]();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

/**
 * Hook to manage ARIA attributes for better screen reader support
 */
export function useAriaAttributes() {
  const setAriaExpanded = useCallback((element: HTMLElement | null, expanded: boolean) => {
    if (element) {
      element.setAttribute('aria-expanded', expanded.toString());
    }
  }, []);

  const setAriaSelected = useCallback((element: HTMLElement | null, selected: boolean) => {
    if (element) {
      element.setAttribute('aria-selected', selected.toString());
    }
  }, []);

  const setAriaHidden = useCallback((element: HTMLElement | null, hidden: boolean) => {
    if (element) {
      element.setAttribute('aria-hidden', hidden.toString());
    }
  }, []);

  return {
    setAriaExpanded,
    setAriaSelected,
    setAriaHidden,
  };
}