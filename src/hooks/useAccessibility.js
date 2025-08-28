import { useEffect, useCallback, useRef } from 'react';
import { accessibilityService } from '../services/AccessibilityService.js';

/**
 * Hook for managing accessibility features in components
 */
export const useAccessibility = (options = {}) => {
  const {
    announceOnMount,
    focusTrap = false,
    keyboardNavigation = false,
    ariaLabel
  } = options;

  const elementRef = useRef(null);
  const focusTrapId = useRef(null);

  useEffect(() => {
    // Announce component mount if specified
    if (announceOnMount) {
      accessibilityService.announce(announceOnMount, 'polite');
    }

    // Set up focus trap if enabled
    if (focusTrap && elementRef.current) {
      focusTrapId.current = accessibilityService.createFocusTrap(elementRef.current);
    }

    // Set up keyboard navigation if enabled
    if (keyboardNavigation && elementRef.current) {
      elementRef.current.setAttribute('data-keyboard-navigation', 
        typeof keyboardNavigation === 'string' ? keyboardNavigation : 'both'
      );
    }

    // Set aria-label if provided
    if (ariaLabel && elementRef.current) {
      elementRef.current.setAttribute('aria-label', ariaLabel);
    }

    return () => {
      // Cleanup focus trap
      if (focusTrapId.current) {
        accessibilityService.removeFocusTrap(focusTrapId.current);
      }
    };
  }, [announceOnMount, focusTrap, keyboardNavigation, ariaLabel]);

  const announce = useCallback((message, priority = 'polite') => {
    accessibilityService.announce(message, priority);
  }, []);

  const makeKeyboardAccessible = useCallback((element, keyboardOptions) => {
    accessibilityService.makeKeyboardAccessible(element, keyboardOptions);
  }, []);

  const makeTableAccessible = useCallback((table) => {
    accessibilityService.makeTableAccessible(table);
  }, []);

  return {
    elementRef,
    announce,
    makeKeyboardAccessible,
    makeTableAccessible
  };
};

/**
 * Hook for managing focus
 */
export const useFocusManagement = () => {
  const focusRef = useRef(null);

  const focusElement = useCallback((element) => {
    if (element) {
      element.focus();
    } else if (focusRef.current) {
      focusRef.current.focus();
    }
  }, []);

  const focusFirst = useCallback((container) => {
    const firstFocusable = container?.querySelector(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    );
    if (firstFocusable) {
      firstFocusable.focus();
    }
  }, []);

  const focusLast = useCallback((container) => {
    const focusableElements = container?.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements && focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus();
    }
  }, []);

  return {
    focusRef,
    focusElement,
    focusFirst,
    focusLast
  };
};

/**
 * Hook for keyboard navigation
 */
export const useKeyboardNavigation = (items, options = {}) => {
  const {
    direction = 'vertical',
    loop = true,
    onSelect
  } = options;

  const currentIndex = useRef(0);

  const handleKeyDown = useCallback((event) => {
    if (!items || items.length === 0) return;

    let newIndex = currentIndex.current;

    switch (event.key) {
      case 'ArrowDown':
        if (direction === 'vertical' || direction === 'both') {
          newIndex = loop 
            ? (currentIndex.current + 1) % items.length
            : Math.min(currentIndex.current + 1, items.length - 1);
          event.preventDefault();
        }
        break;
      case 'ArrowUp':
        if (direction === 'vertical' || direction === 'both') {
          newIndex = loop
            ? (currentIndex.current - 1 + items.length) % items.length
            : Math.max(currentIndex.current - 1, 0);
          event.preventDefault();
        }
        break;
      case 'ArrowRight':
        if (direction === 'horizontal' || direction === 'both') {
          newIndex = loop
            ? (currentIndex.current + 1) % items.length
            : Math.min(currentIndex.current + 1, items.length - 1);
          event.preventDefault();
        }
        break;
      case 'ArrowLeft':
        if (direction === 'horizontal' || direction === 'both') {
          newIndex = loop
            ? (currentIndex.current - 1 + items.length) % items.length
            : Math.max(currentIndex.current - 1, 0);
          event.preventDefault();
        }
        break;
      case 'Home':
        newIndex = 0;
        event.preventDefault();
        break;
      case 'End':
        newIndex = items.length - 1;
        event.preventDefault();
        break;
      case 'Enter':
      case ' ':
        if (onSelect) {
          onSelect(items[currentIndex.current], currentIndex.current);
          event.preventDefault();
        }
        break;
    }

    if (newIndex !== currentIndex.current) {
      currentIndex.current = newIndex;
      
      // Focus the new item if it's a DOM element
      if (items[newIndex] && items[newIndex].focus) {
        items[newIndex].focus();
      }
    }
  }, [items, direction, loop, onSelect]);

  const setCurrentIndex = useCallback((index) => {
    if (index >= 0 && index < items.length) {
      currentIndex.current = index;
    }
  }, [items]);

  return {
    currentIndex: currentIndex.current,
    handleKeyDown,
    setCurrentIndex
  };
};

/**
 * Hook for screen reader announcements
 */
export const useScreenReader = () => {
  const announce = useCallback((message, priority = 'polite') => {
    accessibilityService.announce(message, priority);
  }, []);

  const announceError = useCallback((message) => {
    accessibilityService.announce(`Error: ${message}`, 'assertive');
  }, []);

  const announceSuccess = useCallback((message) => {
    accessibilityService.announce(`Success: ${message}`, 'polite');
  }, []);

  const announceLoading = useCallback((message = 'Loading') => {
    accessibilityService.announce(message, 'polite');
  }, []);

  const announceLoadingComplete = useCallback((message = 'Loading complete') => {
    accessibilityService.announce(message, 'polite');
  }, []);

  return {
    announce,
    announceError,
    announceSuccess,
    announceLoading,
    announceLoadingComplete
  };
};

export default useAccessibility;