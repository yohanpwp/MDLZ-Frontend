/**
 * AccessibilityService
 * 
 * Service for managing accessibility features, keyboard navigation,
 * screen reader support, and WCAG compliance.
 */

class AccessibilityService {
  constructor() {
    this.focusableElements = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');
    
    this.keyboardListeners = new Map();
    this.focusTraps = new Map();
    this.announcements = [];
    
    this.initializeAccessibility();
  }

  /**
   * Initialize accessibility features
   */
  initializeAccessibility() {
    // Add global keyboard event listeners
    document.addEventListener('keydown', this.handleGlobalKeydown.bind(this));
    
    // Add focus management
    document.addEventListener('focusin', this.handleFocusIn.bind(this));
    document.addEventListener('focusout', this.handleFocusOut.bind(this));
    
    // Add skip links if not present
    this.addSkipLinks();
    
    // Initialize ARIA live regions
    this.initializeLiveRegions();
    
    // Set up reduced motion detection
    this.setupReducedMotionDetection();
  }

  /**
   * Handle global keyboard events
   */
  handleGlobalKeydown(event) {
    // Handle Escape key globally
    if (event.key === 'Escape') {
      this.handleEscapeKey(event);
    }
    
    // Handle Tab key for focus management
    if (event.key === 'Tab') {
      this.handleTabKey(event);
    }
    
    // Handle arrow keys for custom navigation
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      this.handleArrowKeys(event);
    }
    
    // Handle Enter and Space for activation
    if (event.key === 'Enter' || event.key === ' ') {
      this.handleActivationKeys(event);
    }
  }

  /**
   * Handle Escape key press
   */
  handleEscapeKey(event) {
    // Close any open modals or dropdowns
    const openModal = document.querySelector('[role="dialog"][aria-hidden="false"]');
    if (openModal) {
      this.closeModal(openModal);
      event.preventDefault();
      return;
    }
    
    // Close any open dropdowns
    const openDropdown = document.querySelector('[aria-expanded="true"]');
    if (openDropdown) {
      openDropdown.setAttribute('aria-expanded', 'false');
      openDropdown.focus();
      event.preventDefault();
      return;
    }
    
    // Clear any active focus traps
    this.clearAllFocusTraps();
  }

  /**
   * Handle Tab key for focus management
   */
  handleTabKey(event) {
    const activeElement = document.activeElement;
    const focusTrapId = activeElement?.closest('[data-focus-trap]')?.dataset.focusTrap;
    
    if (focusTrapId && this.focusTraps.has(focusTrapId)) {
      const trap = this.focusTraps.get(focusTrapId);
      this.manageFocusTrap(event, trap);
    }
  }

  /**
   * Handle arrow key navigation
   */
  handleArrowKeys(event) {
    const activeElement = document.activeElement;
    const navigationGroup = activeElement?.closest('[data-keyboard-navigation]');
    
    if (navigationGroup) {
      const direction = navigationGroup.dataset.keyboardNavigation;
      this.handleGroupNavigation(event, navigationGroup, direction);
    }
  }

  /**
   * Handle Enter and Space key activation
   */
  handleActivationKeys(event) {
    const activeElement = document.activeElement;
    
    // Handle custom clickable elements
    if (activeElement?.hasAttribute('data-clickable')) {
      activeElement.click();
      event.preventDefault();
    }
    
    // Handle expandable elements
    if (activeElement?.hasAttribute('aria-expanded')) {
      const expanded = activeElement.getAttribute('aria-expanded') === 'true';
      activeElement.setAttribute('aria-expanded', !expanded);
      event.preventDefault();
    }
  }

  /**
   * Manage focus trap within a container
   */
  manageFocusTrap(event, trap) {
    const focusableElements = trap.container.querySelectorAll(this.focusableElements);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (event.shiftKey) {
      // Shift + Tab (backward)
      if (document.activeElement === firstElement) {
        lastElement.focus();
        event.preventDefault();
      }
    } else {
      // Tab (forward)
      if (document.activeElement === lastElement) {
        firstElement.focus();
        event.preventDefault();
      }
    }
  }

  /**
   * Handle group navigation (like menu items, tabs)
   */
  handleGroupNavigation(event, group, direction) {
    const items = group.querySelectorAll('[role="menuitem"], [role="tab"], [role="option"], button, a');
    const currentIndex = Array.from(items).indexOf(document.activeElement);
    
    if (currentIndex === -1) return;
    
    let nextIndex;
    
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        nextIndex = direction === 'vertical' || direction === 'both' 
          ? (currentIndex + 1) % items.length 
          : currentIndex;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        nextIndex = direction === 'vertical' || direction === 'both'
          ? (currentIndex - 1 + items.length) % items.length
          : currentIndex;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = items.length - 1;
        break;
      default:
        return;
    }
    
    if (nextIndex !== currentIndex) {
      items[nextIndex].focus();
      event.preventDefault();
    }
  }

  /**
   * Create a focus trap for modals and dialogs
   */
  createFocusTrap(container, options = {}) {
    const trapId = options.id || `trap-${Date.now()}`;
    const previousFocus = document.activeElement;
    
    const trap = {
      id: trapId,
      container,
      previousFocus,
      options
    };
    
    this.focusTraps.set(trapId, trap);
    container.setAttribute('data-focus-trap', trapId);
    
    // Focus the first focusable element or the container itself
    const firstFocusable = container.querySelector(this.focusableElements);
    if (firstFocusable) {
      firstFocusable.focus();
    } else {
      container.focus();
    }
    
    return trapId;
  }

  /**
   * Remove a focus trap
   */
  removeFocusTrap(trapId) {
    const trap = this.focusTraps.get(trapId);
    if (trap) {
      trap.container.removeAttribute('data-focus-trap');
      
      // Restore previous focus
      if (trap.previousFocus && document.contains(trap.previousFocus)) {
        trap.previousFocus.focus();
      }
      
      this.focusTraps.delete(trapId);
    }
  }

  /**
   * Clear all active focus traps
   */
  clearAllFocusTraps() {
    for (const trapId of this.focusTraps.keys()) {
      this.removeFocusTrap(trapId);
    }
  }

  /**
   * Add skip links for keyboard navigation
   */
  addSkipLinks() {
    if (document.querySelector('.skip-links')) return;
    
    const skipLinks = document.createElement('div');
    skipLinks.className = 'skip-links';
    skipLinks.innerHTML = `
      <a href="#main-content" class="skip-link">Skip to main content</a>
      <a href="#navigation" class="skip-link">Skip to navigation</a>
      <a href="#search" class="skip-link">Skip to search</a>
    `;
    
    // Add CSS for skip links
    const style = document.createElement('style');
    style.textContent = `
      .skip-links {
        position: absolute;
        top: -40px;
        left: 6px;
        z-index: 1000;
      }
      .skip-link {
        position: absolute;
        top: -40px;
        left: 6px;
        background: #000;
        color: #fff;
        padding: 8px;
        text-decoration: none;
        border-radius: 4px;
        z-index: 1001;
      }
      .skip-link:focus {
        top: 6px;
      }
    `;
    
    document.head.appendChild(style);
    document.body.insertBefore(skipLinks, document.body.firstChild);
  }

  /**
   * Initialize ARIA live regions for announcements
   */
  initializeLiveRegions() {
    // Create polite live region
    if (!document.getElementById('aria-live-polite')) {
      const politeRegion = document.createElement('div');
      politeRegion.id = 'aria-live-polite';
      politeRegion.setAttribute('aria-live', 'polite');
      politeRegion.setAttribute('aria-atomic', 'true');
      politeRegion.style.cssText = 'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;';
      document.body.appendChild(politeRegion);
    }
    
    // Create assertive live region
    if (!document.getElementById('aria-live-assertive')) {
      const assertiveRegion = document.createElement('div');
      assertiveRegion.id = 'aria-live-assertive';
      assertiveRegion.setAttribute('aria-live', 'assertive');
      assertiveRegion.setAttribute('aria-atomic', 'true');
      assertiveRegion.style.cssText = 'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;';
      document.body.appendChild(assertiveRegion);
    }
  }

  /**
   * Announce message to screen readers
   */
  announce(message, priority = 'polite') {
    const regionId = priority === 'assertive' ? 'aria-live-assertive' : 'aria-live-polite';
    const region = document.getElementById(regionId);
    
    if (region) {
      // Clear previous message
      region.textContent = '';
      
      // Add new message after a brief delay
      setTimeout(() => {
        region.textContent = message;
        this.announcements.push({
          message,
          priority,
          timestamp: new Date().toISOString()
        });
      }, 100);
    }
  }

  /**
   * Set up reduced motion detection
   */
  setupReducedMotionDetection() {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleMotionPreference = (e) => {
      document.documentElement.setAttribute('data-reduced-motion', e.matches);
    };
    
    handleMotionPreference(mediaQuery);
    mediaQuery.addEventListener('change', handleMotionPreference);
  }

  /**
   * Handle focus in events
   */
  handleFocusIn(event) {
    // Add focus indicator class
    event.target.classList.add('keyboard-focused');
    
    // Announce focus changes for screen readers
    const label = this.getAccessibleLabel(event.target);
    if (label) {
      this.announce(`Focused on ${label}`, 'polite');
    }
  }

  /**
   * Handle focus out events
   */
  handleFocusOut(event) {
    // Remove focus indicator class
    event.target.classList.remove('keyboard-focused');
  }

  /**
   * Get accessible label for an element
   */
  getAccessibleLabel(element) {
    // Check aria-label
    if (element.hasAttribute('aria-label')) {
      return element.getAttribute('aria-label');
    }
    
    // Check aria-labelledby
    if (element.hasAttribute('aria-labelledby')) {
      const labelId = element.getAttribute('aria-labelledby');
      const labelElement = document.getElementById(labelId);
      if (labelElement) {
        return labelElement.textContent.trim();
      }
    }
    
    // Check associated label
    if (element.id) {
      const label = document.querySelector(`label[for="${element.id}"]`);
      if (label) {
        return label.textContent.trim();
      }
    }
    
    // Check text content
    if (element.textContent.trim()) {
      return element.textContent.trim();
    }
    
    // Check placeholder
    if (element.hasAttribute('placeholder')) {
      return element.getAttribute('placeholder');
    }
    
    // Check title
    if (element.hasAttribute('title')) {
      return element.getAttribute('title');
    }
    
    return null;
  }

  /**
   * Close modal and restore focus
   */
  closeModal(modal) {
    modal.setAttribute('aria-hidden', 'true');
    
    // Find and remove associated focus trap
    const trapId = modal.getAttribute('data-focus-trap');
    if (trapId) {
      this.removeFocusTrap(trapId);
    }
    
    this.announce('Modal closed', 'polite');
  }

  /**
   * Make an element keyboard accessible
   */
  makeKeyboardAccessible(element, options = {}) {
    const {
      role = 'button',
      tabIndex = 0,
      ariaLabel,
      onClick
    } = options;
    
    // Set ARIA attributes
    element.setAttribute('role', role);
    element.setAttribute('tabindex', tabIndex);
    
    if (ariaLabel) {
      element.setAttribute('aria-label', ariaLabel);
    }
    
    // Add keyboard event listeners
    element.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (onClick) {
          onClick(event);
        } else {
          element.click();
        }
      }
    });
    
    // Add data attribute for styling
    element.setAttribute('data-clickable', 'true');
  }

  /**
   * Create accessible data table
   */
  makeTableAccessible(table) {
    // Add table role if not present
    if (!table.hasAttribute('role')) {
      table.setAttribute('role', 'table');
    }
    
    // Process headers
    const headers = table.querySelectorAll('th');
    headers.forEach((header, index) => {
      if (!header.id) {
        header.id = `header-${Date.now()}-${index}`;
      }
      header.setAttribute('role', 'columnheader');
    });
    
    // Process data cells
    const cells = table.querySelectorAll('td');
    cells.forEach(cell => {
      cell.setAttribute('role', 'cell');
      
      // Associate with headers
      const row = cell.closest('tr');
      const cellIndex = Array.from(row.children).indexOf(cell);
      const header = table.querySelector(`th:nth-child(${cellIndex + 1})`);
      
      if (header && header.id) {
        cell.setAttribute('headers', header.id);
      }
    });
    
    // Add caption if not present
    if (!table.querySelector('caption')) {
      const caption = document.createElement('caption');
      caption.textContent = 'Data table';
      caption.className = 'sr-only';
      table.insertBefore(caption, table.firstChild);
    }
  }

  /**
   * Get accessibility report
   */
  getAccessibilityReport() {
    const report = {
      focusTraps: this.focusTraps.size,
      announcements: this.announcements.length,
      recentAnnouncements: this.announcements.slice(-10),
      reducedMotion: document.documentElement.getAttribute('data-reduced-motion') === 'true',
      skipLinksPresent: !!document.querySelector('.skip-links'),
      liveRegionsPresent: {
        polite: !!document.getElementById('aria-live-polite'),
        assertive: !!document.getElementById('aria-live-assertive')
      }
    };
    
    return report;
  }

  /**
   * Cleanup method
   */
  cleanup() {
    // Remove event listeners
    document.removeEventListener('keydown', this.handleGlobalKeydown);
    document.removeEventListener('focusin', this.handleFocusIn);
    document.removeEventListener('focusout', this.handleFocusOut);
    
    // Clear all focus traps
    this.clearAllFocusTraps();
    
    // Clear keyboard listeners
    this.keyboardListeners.clear();
  }
}

// Create singleton instance
export const accessibilityService = new AccessibilityService();

export default AccessibilityService;