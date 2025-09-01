import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./redux/store.js";
import { ThemeProvider } from "./contexts/ThemeContext.jsx";
import { LanguageProvider } from "./contexts/LanguageContext.jsx";
import AppRouter from "./router/AppRouter.jsx";
import { performanceMonitoringService } from "./services/PerformanceMonitoringService.js";
import { accessibilityService } from "./services/AccessibilityService.js";
import "./index.css";

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  performanceMonitoringService.startMeasure('app-initialization');
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <LanguageProvider>
        <ThemeProvider>
          <AppRouter />
        </ThemeProvider>
      </LanguageProvider>
    </Provider>
  </React.StrictMode>
);

// Complete performance monitoring initialization
if (typeof window !== 'undefined') {
  performanceMonitoringService.endMeasure('app-initialization');
  
  // Track initial page load
  window.addEventListener('load', () => {
    performanceMonitoringService.announce('Application loaded successfully', 'polite');
  });
}
