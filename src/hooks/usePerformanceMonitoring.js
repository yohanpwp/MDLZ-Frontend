import { useEffect, useCallback, useRef } from 'react';
import { performanceMonitoringService } from '../services/PerformanceMonitoringService.js';

/**
 * Hook for monitoring component performance
 */
export const usePerformanceMonitoring = (componentName) => {
  const renderStartTime = useRef(null);
  const mountTime = useRef(null);

  useEffect(() => {
    mountTime.current = performance.now();
    
    return () => {
      // Track component unmount time
      if (mountTime.current) {
        const unmountTime = performance.now();
        const lifespan = unmountTime - mountTime.current;
        
        performanceMonitoringService.trackInteraction('component-lifespan', lifespan, {
          component: componentName,
          mountTime: mountTime.current,
          unmountTime
        });
      }
    };
  }, [componentName]);

  const startRender = useCallback(() => {
    renderStartTime.current = performance.now();
  }, []);

  const endRender = useCallback(() => {
    if (renderStartTime.current) {
      const renderTime = performance.now() - renderStartTime.current;
      performanceMonitoringService.trackComponentRender(componentName, renderTime);
      renderStartTime.current = null;
    }
  }, [componentName]);

  const measureFunction = useCallback((name, fn) => {
    return performanceMonitoringService.measureFunction(`${componentName}-${name}`, fn);
  }, [componentName]);

  const trackInteraction = useCallback((interactionType, duration, details) => {
    performanceMonitoringService.trackInteraction(interactionType, duration, {
      component: componentName,
      ...details
    });
  }, [componentName]);

  return {
    startRender,
    endRender,
    measureFunction,
    trackInteraction
  };
};

/**
 * Hook for tracking user interactions
 */
export const useInteractionTracking = () => {
  const trackClick = useCallback((elementName, startTime = performance.now()) => {
    const duration = performance.now() - startTime;
    performanceMonitoringService.trackInteraction('click', duration, {
      element: elementName
    });
  }, []);

  const trackFormSubmission = useCallback((formName, startTime = performance.now()) => {
    const duration = performance.now() - startTime;
    performanceMonitoringService.trackInteraction('form-submit', duration, {
      form: formName
    });
  }, []);

  const trackNavigation = useCallback((route, startTime = performance.now()) => {
    const duration = performance.now() - startTime;
    performanceMonitoringService.trackInteraction('navigation', duration, {
      route
    });
  }, []);

  const trackFileUpload = useCallback((fileSize, processingTime) => {
    performanceMonitoringService.trackInteraction('file-upload', processingTime, {
      fileSize,
      throughput: fileSize / processingTime
    });
  }, []);

  return {
    trackClick,
    trackFormSubmission,
    trackNavigation,
    trackFileUpload
  };
};

/**
 * Hook for performance monitoring dashboard
 */
export const usePerformanceDashboard = () => {
  const getPerformanceSummary = useCallback(() => {
    return performanceMonitoringService.getPerformanceSummary();
  }, []);

  const exportPerformanceData = useCallback(() => {
    return performanceMonitoringService.exportPerformanceData();
  }, []);

  const clearMetrics = useCallback(() => {
    performanceMonitoringService.clearMetrics();
  }, []);

  return {
    getPerformanceSummary,
    exportPerformanceData,
    clearMetrics
  };
};

export default usePerformanceMonitoring;