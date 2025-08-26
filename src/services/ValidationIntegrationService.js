/**
 * ValidationIntegrationService
 * 
 * Service that integrates the validation engine with the file processing workflow
 * and provides high-level validation operations for the application.
 */

import { store } from '../redux/store.js';
import { 
  validateBatch, 
  validateRecord, 
  revalidateRecords,
  updateValidationConfig,
  clearValidationResults 
} from '../redux/slices/validationSlice.js';
import { 
  selectAllRecords, 
  selectValidRecords, 
  selectInvalidRecords 
} from '../redux/slices/fileProcessingSlice.js';
import { DEFAULT_VALIDATION_CONFIG } from '../types/validation.js';

/**
 * ValidationIntegrationService class for high-level validation operations
 */
export class ValidationIntegrationService {
  constructor() {
    this.defaultConfig = DEFAULT_VALIDATION_CONFIG;
  }

  /**
   * Validate all processed records from file processing
   * @param {Object} options - Validation options
   * @param {Object} options.config - Custom validation configuration
   * @param {Function} options.onProgress - Progress callback function
   * @returns {Promise<Object>} Validation summary
   */
  async validateAllProcessedRecords(options = {}) {
    const { config, onProgress } = options;
    
    try {
      // Get all processed records from file processing state
      const state = store.getState();
      const allRecords = selectAllRecords(state);
      
      if (allRecords.length === 0) {
        throw new Error('No records available for validation. Please process files first.');
      }

      // Clear previous validation results
      store.dispatch(clearValidationResults());

      // Update validation configuration if provided
      if (config) {
        store.dispatch(updateValidationConfig(config));
      }

      // Dispatch batch validation
      const result = await store.dispatch(validateBatch({ 
        records: allRecords, 
        config 
      })).unwrap();

      return {
        success: true,
        summary: result.summary,
        batchId: result.batchId,
        recordsValidated: allRecords.length,
        validatedAt: result.validatedAt
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        recordsValidated: 0
      };
    }
  }

  /**
   * Validate only records that haven't been validated yet
   * @param {Object} options - Validation options
   * @returns {Promise<Object>} Validation result
   */
  async validateNewRecords(options = {}) {
    const { config } = options;
    
    try {
      const state = store.getState();
      const allRecords = selectAllRecords(state);
      const validationResults = state.validation.results;
      
      // Find records that haven't been validated
      const validatedRecordIds = new Set(validationResults.map(r => r.recordId));
      const newRecords = allRecords.filter(record => !validatedRecordIds.has(record.id));
      
      if (newRecords.length === 0) {
        return {
          success: true,
          message: 'All records have already been validated',
          recordsValidated: 0
        };
      }

      // Update validation configuration if provided
      if (config) {
        store.dispatch(updateValidationConfig(config));
      }

      // Validate new records
      const result = await store.dispatch(validateBatch({ 
        records: newRecords, 
        config 
      })).unwrap();

      return {
        success: true,
        summary: result.summary,
        batchId: result.batchId,
        recordsValidated: newRecords.length,
        validatedAt: result.validatedAt
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        recordsValidated: 0
      };
    }
  }

  /**
   * Re-validate specific records with updated configuration
   * @param {string[]} recordIds - Array of record IDs to re-validate
   * @param {Object} config - Updated validation configuration
   * @returns {Promise<Object>} Re-validation result
   */
  async revalidateSpecificRecords(recordIds, config = null) {
    try {
      const state = store.getState();
      const allRecords = selectAllRecords(state);
      
      // Filter records to re-validate
      const recordsToValidate = allRecords.filter(record => recordIds.includes(record.id));
      
      if (recordsToValidate.length === 0) {
        throw new Error('No matching records found for re-validation');
      }

      // Dispatch re-validation
      const result = await store.dispatch(revalidateRecords({ 
        recordIds, 
        records: recordsToValidate, 
        config 
      })).unwrap();

      return {
        success: true,
        recordIds: result.recordIds,
        recordsRevalidated: recordsToValidate.length,
        revalidatedAt: result.revalidatedAt
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        recordIds,
        recordsRevalidated: 0
      };
    }
  }

  /**
   * Validate records from a specific file
   * @param {string} fileId - File ID to validate records from
   * @param {Object} config - Validation configuration
   * @returns {Promise<Object>} Validation result
   */
  async validateRecordsFromFile(fileId, config = null) {
    try {
      const state = store.getState();
      const allRecords = selectAllRecords(state);
      
      // Filter records from specific file
      const fileRecords = allRecords.filter(record => record.metadata?.fileId === fileId);
      
      if (fileRecords.length === 0) {
        throw new Error(`No records found for file ID: ${fileId}`);
      }

      // Update validation configuration if provided
      if (config) {
        store.dispatch(updateValidationConfig(config));
      }

      // Validate file records
      const result = await store.dispatch(validateBatch({ 
        records: fileRecords, 
        config 
      })).unwrap();

      return {
        success: true,
        fileId,
        summary: result.summary,
        batchId: result.batchId,
        recordsValidated: fileRecords.length,
        validatedAt: result.validatedAt
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        fileId,
        recordsValidated: 0
      };
    }
  }

  /**
   * Validate a single record by ID
   * @param {string} recordId - Record ID to validate
   * @param {Object} config - Validation configuration
   * @returns {Promise<Object>} Validation result
   */
  async validateSingleRecord(recordId, config = null) {
    try {
      const state = store.getState();
      const allRecords = selectAllRecords(state);
      
      // Find the specific record
      const record = allRecords.find(r => r.id === recordId);
      
      if (!record) {
        throw new Error(`Record not found: ${recordId}`);
      }

      // Update validation configuration if provided
      if (config) {
        store.dispatch(updateValidationConfig(config));
      }

      // Validate single record
      const result = await store.dispatch(validateRecord(record)).unwrap();

      return {
        success: true,
        recordId: result.recordId,
        results: result.results,
        validatedAt: result.validatedAt
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        recordId
      };
    }
  }

  /**
   * Get validation statistics for the current session
   * @returns {Object} Validation statistics
   */
  getValidationStatistics() {
    const state = store.getState();
    const validationState = state.validation;
    const fileProcessingState = state.fileProcessing;
    
    const totalRecords = selectAllRecords(state).length;
    const validatedRecordIds = new Set(validationState.results.map(r => r.recordId));
    const validatedRecordsCount = validatedRecordIds.size;
    
    return {
      totalRecords,
      validatedRecords: validatedRecordsCount,
      unvalidatedRecords: totalRecords - validatedRecordsCount,
      totalDiscrepancies: validationState.results.length,
      alertsCount: validationState.alerts.length,
      unacknowledgedAlertsCount: validationState.unacknowledgedAlerts.length,
      lastValidationTime: validationState.lastValidationTime,
      currentBatchId: validationState.currentBatchId,
      validationSummary: validationState.summary,
      processingStatistics: fileProcessingState.statistics
    };
  }

  /**
   * Get validation results for a specific record
   * @param {string} recordId - Record ID
   * @returns {Array} Validation results for the record
   */
  getRecordValidationResults(recordId) {
    const state = store.getState();
    return state.validation.results.filter(result => result.recordId === recordId);
  }

  /**
   * Get validation results by severity level
   * @param {string} severity - Severity level
   * @returns {Array} Validation results with specified severity
   */
  getResultsBySeverity(severity) {
    const state = store.getState();
    return state.validation.results.filter(result => result.severity === severity);
  }

  /**
   * Check if validation is currently in progress
   * @returns {boolean} Whether validation is in progress
   */
  isValidationInProgress() {
    const state = store.getState();
    return state.validation.isValidating;
  }

  /**
   * Get current validation progress
   * @returns {Object|null} Current validation progress or null
   */
  getValidationProgress() {
    const state = store.getState();
    return state.validation.progress;
  }

  /**
   * Update validation configuration
   * @param {Object} config - New configuration to merge
   */
  updateConfiguration(config) {
    store.dispatch(updateValidationConfig(config));
  }

  /**
   * Get current validation configuration
   * @returns {Object} Current validation configuration
   */
  getCurrentConfiguration() {
    const state = store.getState();
    return state.validation.config;
  }

  /**
   * Clear all validation results and alerts
   */
  clearAllValidationData() {
    store.dispatch(clearValidationResults());
  }

  /**
   * Get validation workflow recommendations
   * @returns {Object} Workflow recommendations
   */
  getWorkflowRecommendations() {
    const stats = this.getValidationStatistics();
    const recommendations = [];

    if (stats.totalRecords === 0) {
      recommendations.push({
        type: 'info',
        message: 'No records available. Please upload and process files first.',
        action: 'upload_files'
      });
    } else if (stats.validatedRecords === 0) {
      recommendations.push({
        type: 'action',
        message: `${stats.totalRecords} records are ready for validation.`,
        action: 'validate_all'
      });
    } else if (stats.unvalidatedRecords > 0) {
      recommendations.push({
        type: 'action',
        message: `${stats.unvalidatedRecords} new records need validation.`,
        action: 'validate_new'
      });
    }

    if (stats.unacknowledgedAlertsCount > 0) {
      recommendations.push({
        type: 'warning',
        message: `${stats.unacknowledgedAlertsCount} validation alerts need attention.`,
        action: 'review_alerts'
      });
    }

    if (stats.totalDiscrepancies > 0) {
      recommendations.push({
        type: 'info',
        message: `${stats.totalDiscrepancies} discrepancies found across ${stats.validatedRecords} records.`,
        action: 'review_discrepancies'
      });
    }

    return {
      recommendations,
      statistics: stats,
      nextSuggestedAction: recommendations.length > 0 ? recommendations[0].action : 'complete'
    };
  }
}

// Export singleton instance
export default new ValidationIntegrationService();