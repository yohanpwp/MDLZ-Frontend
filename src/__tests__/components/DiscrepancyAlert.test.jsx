/**
 * DiscrepancyAlert Component Tests
 * 
 * Tests for the DiscrepancyAlert component including alert display,
 * acknowledgment functionality, and severity handling.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import DiscrepancyAlert from '../../components/validation/DiscrepancyAlert';
import validationSlice, { acknowledgeAlert, dismissAlert } from '../../redux/slices/validationSlice';
import { SEVERITY_LEVELS } from '../../types/validation';

// Mock UI components
vi.mock('../../components/ui/Alert', () => ({
  Alert: ({ children, variant, className }) => (
    <div data-testid="alert" data-variant={variant} className={className}>
      {children}
    </div>
  ),
  AlertTitle: ({ children, className }) => (
    <div data-testid="alert-title" className={className}>
      {children}
    </div>
  ),
  AlertDescription: ({ children, className }) => (
    <div data-testid="alert-description" className={className}>
      {children}
    </div>
  )
}));

vi.mock('../../components/ui/Button', () => ({
  Button: ({ children, onClick, variant, size, className, ...props }) => (
    <button 
      onClick={onClick} 
      data-variant={variant} 
      data-size={size}
      className={className}
      {...props}
    >
      {children}
    </button>
  )
}));

vi.mock('../../components/ui/Badge', () => ({
  Badge: ({ children, variant, className }) => (
    <span data-testid="badge" data-variant={variant} className={className}>
      {children}
    </span>
  )
}));

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
  Info: () => <div data-testid="info-icon" />,
  X: () => <div data-testid="x-icon" />,
  Check: () => <div data-testid="check-icon" />,
  DollarSign: () => <div data-testid="dollar-sign-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  FileText: () => <div data-testid="file-text-icon" />
}));

describe('DiscrepancyAlert Component', () => {
  const mockDispatch = vi.fn();

  const createMockStore = (initialState = {}) => {
    const store = configureStore({
      reducer: {
        validation: validationSlice
      },
      preloadedState: initialState
    });
    
    // Mock dispatch
    store.dispatch = mockDispatch;
    return store;
  };

  const createMockAlert = (overrides = {}) => ({
    id: 'alert-1',
    recordId: 'record-123',
    field: 'totalAmount',
    severity: SEVERITY_LEVELS.HIGH,
    message: 'Total amount calculation discrepancy detected',
    discrepancy: 150.75,
    acknowledged: false,
    createdAt: '2024-01-15T10:30:00Z',
    ...overrides
  });

  const renderWithStore = (store, props = {}) => {
    return render(
      <Provider store={store}>
        <DiscrepancyAlert {...props} />
      </Provider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders nothing when no alerts provided', () => {
      const store = createMockStore();
      const { container } = renderWithStore(store, { alerts: [] });
      
      expect(container.firstChild).toBeNull();
    });

    it('renders alert header with correct counts', () => {
      const store = createMockStore();
      const alerts = [
        createMockAlert(),
        createMockAlert({ id: 'alert-2', acknowledged: true })
      ];
      
      renderWithStore(store, { alerts });

      expect(screen.getByText('Validation Alerts')).toBeInTheDocument();
      expect(screen.getByText('2 Total')).toBeInTheDocument();
      expect(screen.getByText('1 Unacknowledged')).toBeInTheDocument();
    });

    it('displays individual alert with correct information', () => {
      const store = createMockStore();
      const alert = createMockAlert();
      
      renderWithStore(store, { alerts: [alert] });

      expect(screen.getByText('Discrepancy Detected')).toBeInTheDocument();
      expect(screen.getByText('record-123')).toBeInTheDocument();
      expect(screen.getByText('totalAmount')).toBeInTheDocument();
      expect(screen.getByText('$150.75')).toBeInTheDocument();
      expect(screen.getByText('Total amount calculation discrepancy detected')).toBeInTheDocument();
    });

    it('shows correct severity badge and icon for different severities', () => {
      const store = createMockStore();
      
      const criticalAlert = createMockAlert({ 
        id: 'critical', 
        severity: SEVERITY_LEVELS.CRITICAL 
      });
      
      renderWithStore(store, { alerts: [criticalAlert] });

      expect(screen.getByText('Critical')).toBeInTheDocument();
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
    });

    it('displays acknowledged status when alert is acknowledged', () => {
      const store = createMockStore();
      const acknowledgedAlert = createMockAlert({
        acknowledged: true,
        acknowledgedAt: '2024-01-15T11:00:00Z'
      });
      
      renderWithStore(store, { alerts: [acknowledgedAlert] });

      expect(screen.getByText('Acknowledged')).toBeInTheDocument();
      expect(screen.getByText(/Acknowledged on/)).toBeInTheDocument();
    });
  });

  describe('Alert Actions', () => {
    it('shows acknowledge button for unacknowledged alerts', () => {
      const store = createMockStore();
      const alert = createMockAlert({ acknowledged: false });
      
      renderWithStore(store, { alerts: [alert], showActions: true });

      expect(screen.getByText('Acknowledge')).toBeInTheDocument();
    });

    it('does not show acknowledge button for acknowledged alerts', () => {
      const store = createMockStore();
      const alert = createMockAlert({ acknowledged: true });
      
      renderWithStore(store, { alerts: [alert], showActions: true });

      expect(screen.queryByText('Acknowledge')).not.toBeInTheDocument();
    });

    it('dispatches acknowledgeAlert action when acknowledge button is clicked', () => {
      const store = createMockStore();
      const alert = createMockAlert();
      
      renderWithStore(store, { alerts: [alert] });

      const acknowledgeButton = screen.getByText('Acknowledge');
      fireEvent.click(acknowledgeButton);

      expect(mockDispatch).toHaveBeenCalledWith(acknowledgeAlert('alert-1'));
    });

    it('shows dismiss button for all alerts', () => {
      const store = createMockStore();
      const alert = createMockAlert();
      
      renderWithStore(store, { alerts: [alert], showActions: true });

      const dismissButton = screen.getByTestId('x-icon').closest('button');
      expect(dismissButton).toBeInTheDocument();
    });

    it('dispatches dismissAlert action when dismiss button is clicked', () => {
      const store = createMockStore();
      const alert = createMockAlert();
      
      renderWithStore(store, { alerts: [alert] });

      const dismissButton = screen.getByTestId('x-icon').closest('button');
      fireEvent.click(dismissButton);

      expect(mockDispatch).toHaveBeenCalledWith(dismissAlert('alert-1'));
    });

    it('does not show action buttons when showActions is false', () => {
      const store = createMockStore();
      const alert = createMockAlert();
      
      renderWithStore(store, { alerts: [alert], showActions: false });

      expect(screen.queryByText('Acknowledge')).not.toBeInTheDocument();
      expect(screen.queryByTestId('x-icon')).not.toBeInTheDocument();
    });
  });

  describe('Bulk Actions', () => {
    it('shows acknowledge all button when there are unacknowledged alerts', () => {
      const store = createMockStore();
      const alerts = [
        createMockAlert({ id: 'alert-1', acknowledged: false }),
        createMockAlert({ id: 'alert-2', acknowledged: false })
      ];
      
      renderWithStore(store, { alerts, showActions: true });

      expect(screen.getByText('Acknowledge All')).toBeInTheDocument();
    });

    it('does not show acknowledge all button when all alerts are acknowledged', () => {
      const store = createMockStore();
      const alerts = [
        createMockAlert({ id: 'alert-1', acknowledged: true }),
        createMockAlert({ id: 'alert-2', acknowledged: true })
      ];
      
      renderWithStore(store, { alerts, showActions: true });

      expect(screen.queryByText('Acknowledge All')).not.toBeInTheDocument();
    });

    it('dispatches acknowledge action for all unacknowledged alerts', () => {
      const store = createMockStore();
      const alerts = [
        createMockAlert({ id: 'alert-1', acknowledged: false }),
        createMockAlert({ id: 'alert-2', acknowledged: false }),
        createMockAlert({ id: 'alert-3', acknowledged: true })
      ];
      
      renderWithStore(store, { alerts });

      const acknowledgeAllButton = screen.getByText('Acknowledge All');
      fireEvent.click(acknowledgeAllButton);

      expect(mockDispatch).toHaveBeenCalledWith(acknowledgeAlert('alert-1'));
      expect(mockDispatch).toHaveBeenCalledWith(acknowledgeAlert('alert-2'));
      expect(mockDispatch).not.toHaveBeenCalledWith(acknowledgeAlert('alert-3'));
    });
  });

  describe('Alert Sorting', () => {
    it('sorts alerts by severity (critical first)', () => {
      const store = createMockStore();
      const alerts = [
        createMockAlert({ id: 'low', severity: SEVERITY_LEVELS.LOW }),
        createMockAlert({ id: 'critical', severity: SEVERITY_LEVELS.CRITICAL }),
        createMockAlert({ id: 'medium', severity: SEVERITY_LEVELS.MEDIUM }),
        createMockAlert({ id: 'high', severity: SEVERITY_LEVELS.HIGH })
      ];
      
      renderWithStore(store, { alerts });

      const alertElements = screen.getAllByTestId('alert');
      // Critical should be first, then high, medium, low
      expect(alertElements).toHaveLength(4);
    });

    it('sorts alerts by creation date when severity is equal', () => {
      const store = createMockStore();
      const alerts = [
        createMockAlert({ 
          id: 'older', 
          severity: SEVERITY_LEVELS.HIGH,
          createdAt: '2024-01-15T09:00:00Z'
        }),
        createMockAlert({ 
          id: 'newer', 
          severity: SEVERITY_LEVELS.HIGH,
          createdAt: '2024-01-15T11:00:00Z'
        })
      ];
      
      renderWithStore(store, { alerts });

      // Newer alerts should appear first
      const alertElements = screen.getAllByTestId('alert');
      expect(alertElements).toHaveLength(2);
    });
  });

  describe('Alert Limiting', () => {
    it('shows only maxVisible alerts when showAll is false', () => {
      const store = createMockStore();
      const alerts = Array.from({ length: 10 }, (_, i) => 
        createMockAlert({ id: `alert-${i}` })
      );
      
      renderWithStore(store, { alerts, showAll: false, maxVisible: 3 });

      const alertElements = screen.getAllByTestId('alert');
      expect(alertElements).toHaveLength(3);
      expect(screen.getByText('+7 more alerts')).toBeInTheDocument();
    });

    it('shows all alerts when showAll is true', () => {
      const store = createMockStore();
      const alerts = Array.from({ length: 10 }, (_, i) => 
        createMockAlert({ id: `alert-${i}` })
      );
      
      renderWithStore(store, { alerts, showAll: true });

      const alertElements = screen.getAllByTestId('alert');
      expect(alertElements).toHaveLength(10);
      expect(screen.queryByText(/more alerts/)).not.toBeInTheDocument();
    });
  });

  describe('Severity Configuration', () => {
    it('displays correct styling for critical severity', () => {
      const store = createMockStore();
      const alert = createMockAlert({ severity: SEVERITY_LEVELS.CRITICAL });
      
      renderWithStore(store, { alerts: [alert] });

      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
      expect(screen.getByText('Critical')).toBeInTheDocument();
    });

    it('displays correct styling for high severity', () => {
      const store = createMockStore();
      const alert = createMockAlert({ severity: SEVERITY_LEVELS.HIGH });
      
      renderWithStore(store, { alerts: [alert] });

      expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
      expect(screen.getByText('High')).toBeInTheDocument();
    });

    it('displays correct styling for medium severity', () => {
      const store = createMockStore();
      const alert = createMockAlert({ severity: SEVERITY_LEVELS.MEDIUM });
      
      renderWithStore(store, { alerts: [alert] });

      expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
    });

    it('displays correct styling for low severity', () => {
      const store = createMockStore();
      const alert = createMockAlert({ severity: SEVERITY_LEVELS.LOW });
      
      renderWithStore(store, { alerts: [alert] });

      expect(screen.getByTestId('info-icon')).toBeInTheDocument();
      expect(screen.getByText('Low')).toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('formats dates correctly', () => {
      const store = createMockStore();
      const alert = createMockAlert({
        createdAt: '2024-01-15T10:30:00Z'
      });
      
      renderWithStore(store, { alerts: [alert] });

      // Should display formatted date
      expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
    });
  });

  describe('Currency Formatting', () => {
    it('formats currency amounts correctly', () => {
      const store = createMockStore();
      const alert = createMockAlert({
        discrepancy: 1234.56
      });
      
      renderWithStore(store, { alerts: [alert] });

      expect(screen.getByText('$1,234.56')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper button roles and labels', () => {
      const store = createMockStore();
      const alert = createMockAlert();
      
      renderWithStore(store, { alerts: [alert] });

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });

    it('uses proper alert role', () => {
      const store = createMockStore();
      const alert = createMockAlert();
      
      renderWithStore(store, { alerts: [alert] });

      const alertElements = screen.getAllByTestId('alert');
      expect(alertElements).toHaveLength(1);
    });
  });
});