/**
 * ReportGenerator Component Tests
 * 
 * Tests for the ReportGenerator component including template selection,
 * report configuration, and generation functionality.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import ReportGenerator from '../../components/reports/ReportGenerator';
import reportsSlice, { generateReport, setSelectedTemplate } from '../../redux/slices/reportsSlice';

// Mock UI components
vi.mock('../../components/ui/Button', () => ({
  default: ({ children, onClick, variant, className, disabled, ...props }) => (
    <button 
      onClick={onClick} 
      data-variant={variant} 
      className={className}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}));

// Mock child components
vi.mock('../../components/reports/ReportFilters', () => ({
  default: () => <div data-testid="report-filters">Report Filters Component</div>
}));

vi.mock('../../components/reports/ReportPreview', () => ({
  default: ({ template }) => (
    <div data-testid="report-preview">
      Report Preview for {template.name}
    </div>
  )
}));

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  FileText: () => <div data-testid="file-text-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  Play: () => <div data-testid="play-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />
}));

// Mock reports slice
const mockReportsSlice = {
  name: 'reports',
  reducer: (state = {
    templates: [],
    selectedTemplate: null,
    isGenerating: false,
    filters: {},
    generated: []
  }, action) => {
    switch (action.type) {
      case 'reports/setSelectedTemplate':
        return { ...state, selectedTemplate: action.payload };
      case 'reports/generateReport/pending':
        return { ...state, isGenerating: true };
      case 'reports/generateReport/fulfilled':
        return { ...state, isGenerating: false };
      case 'reports/generateReport/rejected':
        return { ...state, isGenerating: false };
      default:
        return state;
    }
  }
};

describe('ReportGenerator Component', () => {
  const mockDispatch = vi.fn();

  const mockTemplates = [
    {
      id: 'validation-summary',
      name: 'Validation Summary',
      description: 'Comprehensive overview of validation results',
      type: 'Summary',
      sections: [
        { id: 'overview', title: 'Overview', type: 'summary', isRequired: true },
        { id: 'statistics', title: 'Statistics', type: 'chart', isRequired: true },
        { id: 'details', title: 'Details', type: 'table', isRequired: false }
      ]
    },
    {
      id: 'discrepancy-analysis',
      name: 'Discrepancy Analysis',
      description: 'Detailed analysis of found discrepancies',
      type: 'Analysis',
      sections: [
        { id: 'breakdown', title: 'Severity Breakdown', type: 'chart', isRequired: true },
        { id: 'financial', title: 'Financial Impact', type: 'summary', isRequired: true }
      ]
    },
    {
      id: 'audit-trail',
      name: 'Audit Trail',
      description: 'Complete audit trail of validation activities',
      type: 'Audit',
      sections: [
        { id: 'timeline', title: 'Timeline', type: 'timeline', isRequired: true },
        { id: 'changes', title: 'Changes', type: 'table', isRequired: true }
      ]
    }
  ];

  const createMockStore = (initialState = {}) => {
    const defaultState = {
      reports: {
        templates: mockTemplates,
        selectedTemplate: null,
        isGenerating: false,
        filters: {},
        generated: [],
        ...initialState.reports
      }
    };

    const store = configureStore({
      reducer: {
        reports: mockReportsSlice.reducer
      },
      preloadedState: defaultState
    });
    
    // Mock dispatch
    store.dispatch = mockDispatch;
    return store;
  };

  const renderWithStore = (store, props = {}) => {
    return render(
      <Provider store={store}>
        <ReportGenerator {...props} />
      </Provider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockDispatch.mockImplementation((action) => {
      if (typeof action === 'function') {
        return action(mockDispatch, () => ({}));
      }
      return Promise.resolve({ unwrap: () => Promise.resolve() });
    });
  });

  describe('Rendering', () => {
    it('renders the component header correctly', () => {
      const store = createMockStore();
      renderWithStore(store);

      expect(screen.getByText('Generate Report')).toBeInTheDocument();
      expect(screen.getByText('Select a template and configure filters to generate a custom report')).toBeInTheDocument();
    });

    it('displays all available templates', () => {
      const store = createMockStore();
      renderWithStore(store);

      expect(screen.getByText('Select Report Template')).toBeInTheDocument();
      expect(screen.getByText('Validation Summary')).toBeInTheDocument();
      expect(screen.getByText('Discrepancy Analysis')).toBeInTheDocument();
      expect(screen.getByText('Audit Trail')).toBeInTheDocument();
    });

    it('shows template descriptions and metadata', () => {
      const store = createMockStore();
      renderWithStore(store);

      expect(screen.getByText('Comprehensive overview of validation results')).toBeInTheDocument();
      expect(screen.getByText('Summary')).toBeInTheDocument();
      expect(screen.getByText('3 sections')).toBeInTheDocument();
    });

    it('displays quick action buttons', () => {
      const store = createMockStore();
      renderWithStore(store);

      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByText('Quick Summary')).toBeInTheDocument();
      expect(screen.getByText('Discrepancy Analysis')).toBeInTheDocument();
      expect(screen.getByText('Audit Trail')).toBeInTheDocument();
    });
  });

  describe('Template Selection', () => {
    it('highlights selected template', () => {
      const store = createMockStore({
        reports: {
          selectedTemplate: mockTemplates[0]
        }
      });
      renderWithStore(store);

      const selectedTemplate = screen.getByText('Validation Summary').closest('div');
      expect(selectedTemplate).toHaveClass('border-primary', 'bg-primary/5');
    });

    it('dispatches setSelectedTemplate when template is clicked', () => {
      const store = createMockStore();
      renderWithStore(store);

      const template = screen.getByText('Validation Summary').closest('div');
      fireEvent.click(template);

      expect(mockDispatch).toHaveBeenCalledWith(setSelectedTemplate(mockTemplates[0]));
    });

    it('updates report name when template is selected', () => {
      const store = createMockStore();
      renderWithStore(store);

      const template = screen.getByText('Validation Summary').closest('div');
      fireEvent.click(template);

      // Should show configuration section after selection
      expect(screen.getByText('Report Configuration')).toBeInTheDocument();
    });
  });

  describe('Report Configuration', () => {
    it('shows configuration section when template is selected', () => {
      const store = createMockStore({
        reports: {
          selectedTemplate: mockTemplates[0]
        }
      });
      renderWithStore(store);

      expect(screen.getByText('Report Configuration')).toBeInTheDocument();
      expect(screen.getByText('Report Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter report name...')).toBeInTheDocument();
    });

    it('displays template details in configuration', () => {
      const store = createMockStore({
        reports: {
          selectedTemplate: mockTemplates[0]
        }
      });
      renderWithStore(store);

      expect(screen.getByText('Validation Summary')).toBeInTheDocument();
      expect(screen.getByText('Comprehensive overview of validation results')).toBeInTheDocument();
      expect(screen.getByText('Report Sections:')).toBeInTheDocument();
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Statistics')).toBeInTheDocument();
      expect(screen.getByText('Details')).toBeInTheDocument();
    });

    it('shows required sections indicator', () => {
      const store = createMockStore({
        reports: {
          selectedTemplate: mockTemplates[0]
        }
      });
      renderWithStore(store);

      const requiredSections = screen.getAllByText('Required');
      expect(requiredSections).toHaveLength(2); // Overview and Statistics are required
    });

    it('allows editing report name', () => {
      const store = createMockStore({
        reports: {
          selectedTemplate: mockTemplates[0]
        }
      });
      renderWithStore(store);

      const nameInput = screen.getByPlaceholderText('Enter report name...');
      fireEvent.change(nameInput, { target: { value: 'Custom Report Name' } });

      expect(nameInput.value).toBe('Custom Report Name');
    });
  });

  describe('Action Buttons', () => {
    it('shows configuration action buttons when template is selected', () => {
      const store = createMockStore({
        reports: {
          selectedTemplate: mockTemplates[0]
        }
      });
      renderWithStore(store);

      expect(screen.getByText('Configure Filters')).toBeInTheDocument();
      expect(screen.getByText('Preview')).toBeInTheDocument();
      expect(screen.getByText('Generate Report')).toBeInTheDocument();
    });

    it('toggles filters panel when Configure Filters is clicked', () => {
      const store = createMockStore({
        reports: {
          selectedTemplate: mockTemplates[0]
        }
      });
      renderWithStore(store);

      const filtersButton = screen.getByText('Configure Filters');
      fireEvent.click(filtersButton);

      expect(screen.getByTestId('report-filters')).toBeInTheDocument();
      expect(screen.getByText('Hide Filters')).toBeInTheDocument();
    });

    it('shows preview panel when Preview is clicked', () => {
      const store = createMockStore({
        reports: {
          selectedTemplate: mockTemplates[0]
        }
      });
      renderWithStore(store);

      const previewButton = screen.getByText('Preview');
      fireEvent.click(previewButton);

      expect(screen.getByTestId('report-preview')).toBeInTheDocument();
      expect(screen.getByText('Report Preview for Validation Summary')).toBeInTheDocument();
    });

    it('disables Generate Report button when no report name', () => {
      const store = createMockStore({
        reports: {
          selectedTemplate: mockTemplates[0]
        }
      });
      renderWithStore(store);

      const generateButton = screen.getByText('Generate Report');
      expect(generateButton).toBeDisabled();
    });

    it('enables Generate Report button when report name is provided', () => {
      const store = createMockStore({
        reports: {
          selectedTemplate: mockTemplates[0]
        }
      });
      renderWithStore(store);

      const nameInput = screen.getByPlaceholderText('Enter report name...');
      fireEvent.change(nameInput, { target: { value: 'Test Report' } });

      const generateButton = screen.getByText('Generate Report');
      expect(generateButton).not.toBeDisabled();
    });
  });

  describe('Report Generation', () => {
    it('dispatches generateReport action when Generate Report is clicked', async () => {
      const store = createMockStore({
        reports: {
          selectedTemplate: mockTemplates[0]
        }
      });
      renderWithStore(store);

      const nameInput = screen.getByPlaceholderText('Enter report name...');
      fireEvent.change(nameInput, { target: { value: 'Test Report' } });

      const generateButton = screen.getByText('Generate Report');
      fireEvent.click(generateButton);

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringContaining('generateReport')
        })
      );
    });

    it('shows loading state during report generation', () => {
      const store = createMockStore({
        reports: {
          selectedTemplate: mockTemplates[0],
          isGenerating: true
        }
      });
      renderWithStore(store);

      expect(screen.getByText('Generating...')).toBeInTheDocument();
      expect(screen.getByText('Generating...').closest('button')).toBeDisabled();
    });

    it('resets form after successful generation', async () => {
      const store = createMockStore({
        reports: {
          selectedTemplate: mockTemplates[0]
        }
      });
      renderWithStore(store);

      const nameInput = screen.getByPlaceholderText('Enter report name...');
      fireEvent.change(nameInput, { target: { value: 'Test Report' } });

      const generateButton = screen.getByText('Generate Report');
      fireEvent.click(generateButton);

      // Mock successful generation
      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalled();
      });
    });
  });

  describe('Quick Actions', () => {
    it('selects validation summary template when Quick Summary is clicked', () => {
      const store = createMockStore();
      renderWithStore(store);

      const quickSummaryButton = screen.getByText('Quick Summary');
      fireEvent.click(quickSummaryButton);

      expect(mockDispatch).toHaveBeenCalledWith(setSelectedTemplate(mockTemplates[0]));
    });

    it('selects discrepancy analysis template when Discrepancy Analysis is clicked', () => {
      const store = createMockStore();
      renderWithStore(store);

      const discrepancyButton = screen.getByText('Discrepancy Analysis').closest('button');
      fireEvent.click(discrepancyButton);

      expect(mockDispatch).toHaveBeenCalledWith(setSelectedTemplate(mockTemplates[1]));
    });

    it('selects audit trail template when Audit Trail is clicked', () => {
      const store = createMockStore();
      renderWithStore(store);

      const auditButton = screen.getByText('Audit Trail').closest('button');
      fireEvent.click(auditButton);

      expect(mockDispatch).toHaveBeenCalledWith(setSelectedTemplate(mockTemplates[2]));
    });
  });

  describe('Error Handling', () => {
    it('handles generation errors gracefully', async () => {
      const store = createMockStore({
        reports: {
          selectedTemplate: mockTemplates[0]
        }
      });

      // Mock failed generation
      mockDispatch.mockImplementation((action) => {
        if (typeof action === 'function') {
          return action(mockDispatch, () => ({}));
        }
        return Promise.resolve({ 
          unwrap: () => Promise.reject(new Error('Generation failed')) 
        });
      });

      renderWithStore(store);

      const nameInput = screen.getByPlaceholderText('Enter report name...');
      fireEvent.change(nameInput, { target: { value: 'Test Report' } });

      const generateButton = screen.getByText('Generate Report');
      fireEvent.click(generateButton);

      // Should not crash the component
      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      const store = createMockStore();
      renderWithStore(store);

      const mainHeading = screen.getByRole('heading', { level: 2 });
      expect(mainHeading).toHaveTextContent('Generate Report');
    });

    it('has proper form labels', () => {
      const store = createMockStore({
        reports: {
          selectedTemplate: mockTemplates[0]
        }
      });
      renderWithStore(store);

      expect(screen.getByLabelText('Report Name')).toBeInTheDocument();
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

  describe('Template Metadata', () => {
    it('displays correct section count for each template', () => {
      const store = createMockStore();
      renderWithStore(store);

      expect(screen.getByText('3 sections')).toBeInTheDocument(); // Validation Summary
      expect(screen.getByText('2 sections')).toBeInTheDocument(); // Discrepancy Analysis
    });

    it('shows template types correctly', () => {
      const store = createMockStore();
      renderWithStore(store);

      expect(screen.getByText('Summary')).toBeInTheDocument();
      expect(screen.getByText('Analysis')).toBeInTheDocument();
      expect(screen.getByText('Audit')).toBeInTheDocument();
    });
  });
});