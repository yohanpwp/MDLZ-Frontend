import { describe, it, expect, beforeEach } from 'vitest';
import DataIntegrityService from '../DataIntegrityService.js';

describe('DataIntegrityService', () => {
  beforeEach(() => {
    // Clear any existing checks
    DataIntegrityService.integrityChecks.clear();
    DataIntegrityService.lastCheckResults.clear();
  });

  describe('registerCheck', () => {
    it('should register a new integrity check', () => {
      const checkFunction = () => ({ status: 'passed', message: 'Test passed' });
      
      DataIntegrityService.registerCheck('test_check', checkFunction, {
        name: 'Test Check',
        description: 'A test check'
      });

      expect(DataIntegrityService.integrityChecks.has('test_check')).toBe(true);
      const check = DataIntegrityService.integrityChecks.get('test_check');
      expect(check.name).toBe('Test Check');
      expect(check.description).toBe('A test check');
    });
  });

  describe('runSingleCheck', () => {
    it('should run a single integrity check', async () => {
      const checkFunction = () => ({ 
        status: 'passed', 
        message: 'Test passed',
        details: { testValue: 123 }
      });
      
      DataIntegrityService.registerCheck('test_check', checkFunction, {
        name: 'Test Check',
        category: 'test'
      });

      const result = await DataIntegrityService.runSingleCheck('test_check');

      expect(result.id).toBe('test_check');
      expect(result.name).toBe('Test Check');
      expect(result.category).toBe('test');
      expect(result.status).toBe('passed');
      expect(result.message).toBe('Test passed');
      expect(result.details).toEqual({ testValue: 123 });
      expect(result.timestamp).toBeDefined();
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should throw error for non-existent check', async () => {
      await expect(DataIntegrityService.runSingleCheck('non_existent'))
        .rejects.toThrow('Check not found: non_existent');
    });
  });

  describe('runAllChecks', () => {
    it('should run all registered checks', async () => {
      const check1 = () => ({ status: 'passed', message: 'Check 1 passed' });
      const check2 = () => ({ status: 'warning', message: 'Check 2 warning' });
      
      DataIntegrityService.registerCheck('check1', check1, { name: 'Check 1' });
      DataIntegrityService.registerCheck('check2', check2, { name: 'Check 2' });

      const result = await DataIntegrityService.runAllChecks();

      expect(result.checks).toHaveLength(2);
      expect(result.overallStatus).toBe('warning'); // Should be warning due to check2
      expect(result.summary.total).toBe(2);
      expect(result.summary.passed).toBe(1);
      expect(result.summary.warnings).toBe(1);
      expect(result.summary.failed).toBe(0);
    });

    it('should handle check failures gracefully', async () => {
      const failingCheck = () => { throw new Error('Check failed'); };
      
      DataIntegrityService.registerCheck('failing_check', failingCheck, { 
        name: 'Failing Check' 
      });

      const result = await DataIntegrityService.runAllChecks();

      expect(result.checks).toHaveLength(1);
      expect(result.checks[0].status).toBe('failed');
      expect(result.checks[0].message).toContain('Check failed');
      expect(result.overallStatus).toBe('failed');
    });
  });

  describe('built-in checks', () => {
    describe('checkUserDataConsistency', () => {
      it('should pass when user data is consistent', async () => {
        const result = await DataIntegrityService.checkUserDataConsistency();
        
        expect(result.status).toBe('passed');
        expect(result.message).toContain('consistent');
        expect(result.details.totalUsers).toBeGreaterThan(0);
        expect(result.details.inconsistencies).toBe(0);
      });
    });

    describe('checkAuditLogIntegrity', () => {
      it('should check audit log integrity', async () => {
        const result = await DataIntegrityService.checkAuditLogIntegrity();
        
        expect(result.status).toBe('passed');
        expect(result.message).toContain('unmodified');
        expect(result.details.totalLogs).toBeGreaterThanOrEqual(0);
        expect(result.details.integrityHash).toBeDefined();
      });
    });

    describe('checkInvoiceDataIntegrity', () => {
      it('should check invoice data integrity', async () => {
        const result = await DataIntegrityService.checkInvoiceDataIntegrity();
        
        expect(result.status).toBe('passed');
        expect(result.message).toContain('accurate');
        expect(result.details.totalInvoices).toBeGreaterThanOrEqual(0);
      });
    });

    describe('checkSystemConfiguration', () => {
      it('should check system configuration', async () => {
        const result = await DataIntegrityService.checkSystemConfiguration();
        
        expect(result.status).toBe('passed');
        expect(result.message).toContain('valid');
        expect(result.details.securitySettings).toBe('compliant');
        expect(result.details.encryptionStatus).toBe('active');
      });
    });
  });

  describe('getCheckResults', () => {
    it('should return stored check results', async () => {
      const checkFunction = () => ({ status: 'passed', message: 'Test passed' });
      DataIntegrityService.registerCheck('test_check', checkFunction);
      
      await DataIntegrityService.runAllChecks();
      
      const results = DataIntegrityService.getCheckResults();
      expect(results.results).toHaveLength(1);
      expect(results.timestamp).toBeDefined();
    });

    it('should return specific check result', async () => {
      const checkFunction = () => ({ status: 'passed', message: 'Test passed' });
      DataIntegrityService.registerCheck('test_check', checkFunction);
      
      await DataIntegrityService.runSingleCheck('test_check');
      
      const result = DataIntegrityService.getCheckResults('test_check');
      expect(result.id).toBe('test_check');
      expect(result.status).toBe('passed');
    });

    it('should return null for non-existent check result', () => {
      const result = DataIntegrityService.getCheckResults('non_existent');
      expect(result).toBeNull();
    });
  });
});