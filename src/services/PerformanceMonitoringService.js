/**
 * PerformanceMonitoringService
 * 
 * Service for monitoring application performance, tracking metrics,
 * and providing performance insights for optimization.
 */

class PerformanceMonitoringService {
  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
    this.isEnabled = typeof window !== 'undefined' && 'performance' in window;
    this.startTime = performance.now();
    
    if (this.isEnabled) {
      this.initializeObservers();
      this.trackInitialMetrics();
    }
  }

  /**
   * Initialize performance observers
   */
  initializeObservers() {
    try {
      // Observe navigation timing
      if ('PerformanceObserver' in window) {
        // Navigation timing observer
        const navObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordNavigationTiming(entry);
          }
        });
        navObserver.observe({ entryTypes: ['navigation'] });
        this.observers.set('navigation', navObserver);

        // Resource timing observer
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordResourceTiming(entry);
          }
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.set('resource', resourceObserver);

        // Measure observer for custom metrics
        const measureObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordCustomMeasure(entry);
          }
        });
        measureObserver.observe({ entryTypes: ['measure'] });
        this.observers.set('measure', measureObserver);

        // Paint timing observer
        const paintObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordPaintTiming(entry);
          }
        });
        paintObserver.observe({ entryTypes: ['paint'] });
        this.observers.set('paint', paintObserver);
      }
    } catch (error) {
      console.warn('Failed to initialize performance observers:', error);
    }
  }

  /**
   * Track initial performance metrics
   */
  trackInitialMetrics() {
    // Track memory usage if available
    if ('memory' in performance) {
      this.recordMemoryUsage();
    }

    // Track connection information
    if ('connection' in navigator) {
      this.recordConnectionInfo();
    }
  }

  /**
   * Record navigation timing metrics
   */
  recordNavigationTiming(entry) {
    const metrics = {
      domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      loadComplete: entry.loadEventEnd - entry.loadEventStart,
      domInteractive: entry.domInteractive - entry.navigationStart,
      firstByte: entry.responseStart - entry.requestStart,
      dnsLookup: entry.domainLookupEnd - entry.domainLookupStart,
      tcpConnect: entry.connectEnd - entry.connectStart,
      serverResponse: entry.responseEnd - entry.responseStart,
      pageLoad: entry.loadEventEnd - entry.navigationStart
    };

    this.metrics.set('navigation', {
      ...metrics,
      timestamp: Date.now(),
      type: 'navigation'
    });

    this.logPerformanceMetric('Navigation Timing', metrics);
  }

  /**
   * Record resource timing metrics
   */
  recordResourceTiming(entry) {
    const resourceMetrics = this.metrics.get('resources') || [];
    
    const metric = {
      name: entry.name,
      type: this.getResourceType(entry.name),
      duration: entry.duration,
      size: entry.transferSize || 0,
      cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
      timestamp: Date.now()
    };

    resourceMetrics.push(metric);
    this.metrics.set('resources', resourceMetrics);

    // Track slow resources
    if (entry.duration > 1000) {
      this.logPerformanceWarning('Slow Resource', metric);
    }
  }

  /**
   * Record custom performance measures
   */
  recordCustomMeasure(entry) {
    const customMetrics = this.metrics.get('custom') || [];
    
    const metric = {
      name: entry.name,
      duration: entry.duration,
      startTime: entry.startTime,
      timestamp: Date.now()
    };

    customMetrics.push(metric);
    this.metrics.set('custom', customMetrics);
  }

  /**
   * Record paint timing metrics
   */
  recordPaintTiming(entry) {
    const paintMetrics = this.metrics.get('paint') || {};
    paintMetrics[entry.name] = {
      startTime: entry.startTime,
      timestamp: Date.now()
    };
    this.metrics.set('paint', paintMetrics);
  }

  /**
   * Record memory usage
   */
  recordMemoryUsage() {
    if ('memory' in performance) {
      const memory = performance.memory;
      this.metrics.set('memory', {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Record connection information
   */
  recordConnectionInfo() {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      this.metrics.set('connection', {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Start a custom performance measurement
   */
  startMeasure(name) {
    if (!this.isEnabled) return;
    
    try {
      performance.mark(`${name}-start`);
    } catch (error) {
      console.warn(`Failed to start measure ${name}:`, error);
    }
  }

  /**
   * End a custom performance measurement
   */
  endMeasure(name) {
    if (!this.isEnabled) return;
    
    try {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
      
      // Clean up marks
      performance.clearMarks(`${name}-start`);
      performance.clearMarks(`${name}-end`);
    } catch (error) {
      console.warn(`Failed to end measure ${name}:`, error);
    }
  }

  /**
   * Measure function execution time
   */
  measureFunction(name, fn) {
    if (!this.isEnabled) {
      return fn();
    }

    this.startMeasure(name);
    try {
      const result = fn();
      
      // Handle async functions
      if (result && typeof result.then === 'function') {
        return result.finally(() => {
          this.endMeasure(name);
        });
      }
      
      this.endMeasure(name);
      return result;
    } catch (error) {
      this.endMeasure(name);
      throw error;
    }
  }

  /**
   * Track component render performance
   */
  trackComponentRender(componentName, renderTime) {
    const componentMetrics = this.metrics.get('components') || [];
    
    componentMetrics.push({
      name: componentName,
      renderTime,
      timestamp: Date.now()
    });

    this.metrics.set('components', componentMetrics);

    // Warn about slow renders
    if (renderTime > 16) { // 60fps threshold
      this.logPerformanceWarning('Slow Component Render', {
        component: componentName,
        renderTime
      });
    }
  }

  /**
   * Track user interaction performance
   */
  trackInteraction(interactionType, duration, details = {}) {
    const interactions = this.metrics.get('interactions') || [];
    
    interactions.push({
      type: interactionType,
      duration,
      details,
      timestamp: Date.now()
    });

    this.metrics.set('interactions', interactions);

    // Warn about slow interactions
    if (duration > 100) {
      this.logPerformanceWarning('Slow Interaction', {
        type: interactionType,
        duration,
        details
      });
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const summary = {
      uptime: performance.now() - this.startTime,
      metrics: {},
      warnings: this.getPerformanceWarnings(),
      recommendations: this.getPerformanceRecommendations()
    };

    // Add all collected metrics
    for (const [key, value] of this.metrics.entries()) {
      summary.metrics[key] = value;
    }

    return summary;
  }

  /**
   * Get performance warnings
   */
  getPerformanceWarnings() {
    const warnings = [];
    
    // Check navigation timing
    const navigation = this.metrics.get('navigation');
    if (navigation) {
      if (navigation.pageLoad > 3000) {
        warnings.push({
          type: 'slow-page-load',
          message: `Page load time is ${Math.round(navigation.pageLoad)}ms (>3s)`,
          severity: 'high'
        });
      }
      
      if (navigation.firstByte > 1000) {
        warnings.push({
          type: 'slow-server-response',
          message: `Server response time is ${Math.round(navigation.firstByte)}ms (>1s)`,
          severity: 'medium'
        });
      }
    }

    // Check memory usage
    const memory = this.metrics.get('memory');
    if (memory && memory.used > memory.limit * 0.8) {
      warnings.push({
        type: 'high-memory-usage',
        message: `Memory usage is ${Math.round((memory.used / memory.limit) * 100)}% of limit`,
        severity: 'high'
      });
    }

    // Check resource count
    const resources = this.metrics.get('resources');
    if (resources && resources.length > 100) {
      warnings.push({
        type: 'too-many-resources',
        message: `${resources.length} resources loaded (>100)`,
        severity: 'medium'
      });
    }

    return warnings;
  }

  /**
   * Get performance recommendations
   */
  getPerformanceRecommendations() {
    const recommendations = [];
    const resources = this.metrics.get('resources') || [];
    
    // Analyze resources for optimization opportunities
    const uncachedResources = resources.filter(r => !r.cached);
    if (uncachedResources.length > 10) {
      recommendations.push({
        type: 'enable-caching',
        message: 'Enable caching for static resources to improve load times',
        priority: 'high'
      });
    }

    const largeResources = resources.filter(r => r.size > 1024 * 1024); // >1MB
    if (largeResources.length > 0) {
      recommendations.push({
        type: 'optimize-resources',
        message: `${largeResources.length} large resources detected. Consider compression or code splitting`,
        priority: 'medium'
      });
    }

    // Check component performance
    const components = this.metrics.get('components') || [];
    const slowComponents = components.filter(c => c.renderTime > 16);
    if (slowComponents.length > 0) {
      recommendations.push({
        type: 'optimize-components',
        message: `${slowComponents.length} components have slow render times. Consider memoization`,
        priority: 'medium'
      });
    }

    return recommendations;
  }

  /**
   * Export performance data
   */
  exportPerformanceData() {
    const data = {
      summary: this.getPerformanceSummary(),
      rawMetrics: Object.fromEntries(this.metrics),
      exportedAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Clear all performance data
   */
  clearMetrics() {
    this.metrics.clear();
    if (this.isEnabled) {
      performance.clearMeasures();
      performance.clearMarks();
    }
  }

  /**
   * Utility methods
   */
  getResourceType(url) {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image';
    if (url.includes('.woff') || url.includes('.ttf')) return 'font';
    return 'other';
  }

  logPerformanceMetric(type, data) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${type}:`, data);
    }
  }

  logPerformanceWarning(type, data) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[Performance Warning] ${type}:`, data);
    }
  }

  /**
   * Cleanup method
   */
  cleanup() {
    // Disconnect all observers
    for (const observer of this.observers.values()) {
      observer.disconnect();
    }
    this.observers.clear();
    this.clearMetrics();
  }
}

// Create singleton instance
export const performanceMonitoringService = new PerformanceMonitoringService();

export default PerformanceMonitoringService;