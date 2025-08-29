/**
 * ValidationDashboard Component Tests
 * 
 * Tests for the ValidationDashboard component including summary statistics,
 * progress tracking, and user interactions.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import ValidationDashboard from '../../components/validation/ValidationDashboard';
import validationSlice from '../../redux/slices/validationSlice';
import { SEVERITY_LEVELS } from '../../types/validation';

// Mock UI components
vi.mock('../../components/ui/Badge', () => ({
  Badge: ({ children, variant, className }) => (
    <span data-testid="badge" data-variant={variant} className={className}>
      {children}
    </span>
  )
}));

vi.mock('../../components/ui/Button', () => ({
  default: ({ children, onClick, variant, className, ...props }) => (
    <button 
      onClick={onClick} 
      data-variant={variant} 
      className={className}
      {...props}
    >
      {children}
    </button>
  )
}));

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  FileText: () => <div data-testid="file-text-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  XCircle: () => <div data-testid="x-circle-icon" />,
  TrendingUp: () => <div data-testid="trending-up-icon" />,
  DollarSign: () => <div data-testid="dollar-sign-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  BarChart3: () => <div data-testid="bar-chart-icon" />,
  RefreshCw: () => <div data-testid="refresh-icon" />
}));

describe('ValidationDashboard Component', () => {
  const mockOnNavigateToResults = vi.fn();
  const mockOnNavigateToAlerts = vi.fn();

  const createMockStore = (initialState = {}) => {
    const defaultState = {
      validation: {
        summary: {
          totalRecords: 100,
          validRecords: 85,
          invalidRecords: 15,
          totalDiscrepancies: 25,
          criticalCount: 2,
          highSeverityCount: 5,
          mediumSeverityCount: 10,
          lowSeverityCount: 8,
          validationEndTime: '2024-01-15T10:30:00Z',
          processingTimeMs: 5000,
          batchId: 'batch-123'
        },
        statistics: {
          severityBreakdown: {
            critical: 2,
            high: 5,
            medium: 10,
            low: 8
          },
          financialImpact: {
            totalDiscrepancyAmount: 15000,
            averageDiscrepancyAmount: 600,
            maxDiscrepancyAmount: 5000
          }
        },
        unacknowledgedAlerts: [
          {
            id: 'alert-1',
            severity: SEVERITY_LEVELS.CRITICAL,
            recordId: 'record-1',
            message: 'Critical discrepancy found'
          },
          {
            id: 'alert-2',
            severity: SEVERITY_LEVELS.HIGH,
            recordId: 'record-2',
            message: 'High discrepancy found'
          }
        ],
        isValidating: false,
        progress: null,
        ...initialState.validation
      }
    };

    return configureStore({
      reducer: {
        validation: validationSlice
      },
      preloadedState: defaultState
    });
  };

  const renderWithStore = (store, props = {}) => {
    return render(
      <Provider store={store}>
        <ValidationDashboard
          onNavigateToResults={mockOnNavigateToResults}
          onNavigateToAlerts={mockOnNavigateToAlerts}
          {...props}
        />
      </Provider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders dashboard header correctly', () => {
      const store = createMockStore();
      renderWithStore(store);

      expect(screen.getByText('Validation Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Monitor validation results and system performance')).toBeInTheDocument();
    });

    it('displays main statistics cards', () => {
      const store = createMockStore();
      renderWithStore(store);

      expect(screen.getByText('Total Records')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      
      expect(screen.getByText('Valid Records')).toBeInTheDocument();
      expect(screen.getByText('85')).toBeInTheDocument();
      
      expect(screen.getByText('Discrepancies Found')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
      
      expect(screen.getByText('Financial Impact')).toBeInTheDocument();
      expect(screen.getByText('฿15,000')).toBeInTheDocument();
    });

    it('shows success rate calculation', () => {
      const store = createMockStore();
      renderWithStore(store);

      expect(screen.getByText('85.0% success rate')).toBeInTheDocument();
    });

    it('displays severity breakdown chart', () => {
      const store = createMockStore();
      renderWithStore(store);

      expect(screen.getByText('Severity Breakdown')).toBeInTheDocument();
      expect(screen.getByText('Critical')).toBeInTheDocument();
      expect(screen.getByText('High')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
      expect(screen.getByText('Low')).toBeInTheDocument();
    });

    it('displays financial impact section', () => {
      const store = createMockStore();
      renderWithStore(store);

      expect(screen.getByText('Financial Impact')).toBeInTheDocument();
      expect(screen.getByText('Total Discrepancy Amount')).toBeInTheDocument();
      expect(screen.getByText('Average Discrepancy')).toBeInTheDocument();
      expect(screen.getByText('Largest Discrepancy')).toBeInTheDocument();
    });
  });

  describe('Alert Handling', () => {
    it('shows alerts button when unacknowledged alerts exist', () => {
      const store = createMockStore();
      renderWithStore(store);

      const alertsButton = screen.getByText('View Alerts');
      expect(alertsButton).toBeInTheDocument();
      
      const alertBadge = screen.getByText('2');
      expect(alertBadge).toBeInTheDocument();
    });

    it('calls onNavigateToAlerts when alerts button is clicked', () => {
      const store = createMockStore();
      renderWithStore(store);

      const alertsButton = screen.getByText('View Alerts');
      fireEvent.click(alertsButton);

      expect(mockOnNavigateToAlerts).toHaveBeenCalledTimes(1);
    });

    it('does not show alerts button when no unacknowledged alerts', () => {
      const store = createMockStore({
        validation: {
          unacknowledgedAlerts: []
        }
      });
      renderWithStore(store);

      expect(screen.queryByText('View Alerts')).not.toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('calls onNavigateToResults when View All Results button is clicked', () => {
      const store = createMockStore();
      renderWithStore(store);

      const resultsButton = screen.getByText('View All Results');
      fireEvent.click(resultsButton);

      expect(mockOnNavigateToResults).toHaveBeenCalledTimes(1);
    });

    it('calls onNavigateToResults when Total Records card is clicked', () => {
      const store = createMockStore();
      renderWithStore(store);

      const totalRecordsCard = screen.getByText('Total Records').closest('div');
      fireEvent.click(totalRecordsCard);

      expect(mockOnNavigateToResults).toHaveBeenCalledTimes(1);
    });

    it('calls onNavigateToResults when Discrepancies Found card is clicked', () => {
      const store = createMockStore();
      renderWithStore(store);

      const discrepanciesCard = screen.getByText('Discrepancies Found').closest('div');
      fireEvent.click(discrepanciesCard);

      expect(mockOnNavigateToResults).toHaveBeenCalledTimes(1);
    });
  });

  describe('Validation Progress', () => {
    it('shows validation progress when validation is in progress', () => {
      const store = createMockStore({
        validation: {
          isValidating: true,
          progress: {
            progressPercentage: 45,
            currentOperation: 'Validating tax calculations',
            processedRecords: 45,
            totalRecords: 100
          }
        }
      });
      renderWithStore(store);

      expect(screen.getByText('Validation in Progress')).toBeInTheDocument();
      expect(screen.getByText('45%')).toBeInTheDocument();
      expect(screen.getByText('Validating tax calculations')).toBeInTheDocument();
      expect(screen.getByText('45 / 100 records')).toBeInTheDocument();
    });

    it('does not show progress when validation is not running', () => {
      const store = createMockStore({
        validation: {
          isValidating: false,
          progress: null
        }
      });
      renderWithStore(store);

      expect(screen.queryByText('Validation in Progress')).not.toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('shows empty state for severity breakdown when no discrepancies', () => {
      const store = createMockStore({
        validation: {
          statistics: {
            severityBreakdown: {
              critical: 0,
              high: 0,
              medium: 0,
              low: 0
            }
          }
        }
      });
      renderWithStore(store);

      expect(screen.getByText('No discrepancies found')).toBeInTheDocument();
    });

    it('handles zero records gracefully', () => {
      const store = createMockStore({
        validation: {
          summary: {
            totalRecords: 0,
            validRecords: 0,
            invalidRecords: 0,
            totalDiscrepancies: 0,
            criticalCount: 0,
            highSeverityCount: 0,
            mediumSeverityCount: 0,
            lowSeverityCount: 0,
            validationEndTime: null,
            processingTimeMs: 0,
            batchId: null
          },
          statistics: {
            severityBreakdown: {
              critical: 0,
              high: 0,
              medium: 0,
              low: 0
            },
            financialImpact: {
              totalDiscrepancyAmount: 0,
              averageDiscrepancyAmount: 0,
              maxDiscrepancyAmount: 0
            }
          }
        }
      });
      renderWithStore(store);

      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('0.0% success rate')).toBeInTheDocument();
    });
  });

  describe('Summary Information', () => {
    it('displays validation timestamp and processing time', () => {
      const store = createMockStore();
      renderWithStore(store);

      expect(screen.getByText(/Last validation:/)).toBeInTheDocument();
      expect(screen.getByText('Processing time: 5.00s')).toBeInTheDocument();
    });

    it('displays batch ID', () => {
      const store = createMockStore();
      renderWithStore(store);

      expect(screen.getByText('Batch: batch-123')).toBeInTheDocument();
    });

    it('does not show summary when no validation has been performed', () => {
      const store = createMockStore({
        validation: {
          summary: {
            validationEndTime: null,
            processingTimeMs: null,
            batchId: null
          }
        }
      });
      renderWithStore(store);

      expect(screen.queryByText(/Last validation:/)).not.toBeInTheDocument();
    });
  });

  describe('Critical Discrepancies Badge', () => {
    it('shows critical badge when critical discrepancies exist', () => {
      const store = createMockStore();
      renderWithStore(store);

      const criticalBadge = screen.getByText('2 Critical');
      expect(criticalBadge).toBeInTheDocument();
      expect(criticalBadge.closest('[data-testid="badge"]')).toHaveAttribute('data-variant', 'critical');
    });

    it('does not show critical badge when no critical discrepancies', () => {
      const store = createMockStore({
        validation: {
          summary: {
            criticalCount: 0
          }
        }
      });
      renderWithStore(store);

      expect(screen.queryByText(/Critical/)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      const store = createMockStore();
      renderWithStore(store);

      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Validation Dashboard');
    });

    it('has clickable elements with proper roles', () => {
      const store = createMockStore();
      renderWithStore(store);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });
  });

  describe('Currency Formatting', () => {
    it('formats currency amounts correctly', () => {
      const store = createMockStore({
        validation: {
          statistics: {
            financialImpact: {
              totalDiscrepancyAmount: 1234567.89,
              averageDiscrepancyAmount: 1234.56,
              maxDiscrepancyAmount: 98765.43
            }
          }
        }
      });
      renderWithStore(store);

      // Thai Baht formatting
      expect(screen.getByText('฿1,234,568')).toBeInTheDocument();
    });
  });
});