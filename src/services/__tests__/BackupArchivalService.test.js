import { describe, it, expect, beforeEach, vi } from 'vitest';
import BackupArchivalService from '../BackupArchivalService.js';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
global.localStorage = localStorageMock;

describe('BackupArchivalService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('[]');
  });

  describe('createBackup', () => {
    it('should create a backup successfully', async () => {
      const options = {
        dataTypes: ['auditLogs', 'userData'],
        name: 'Test Backup',
        type: 'manual'
      };

      const result = await BackupArchivalService.createBackup(options);

      expect(result.success).toBe(true);
      expect(result.backup.name).toBe('Test Backup');
      expect(result.backup.type).toBe('manual');
      expect(result.backup.dataTypes).toEqual(['auditLogs', 'userData']);
      expect(result.backup.id).toBeDefined();
      expect(result.backup.createdAt).toBeDefined();
      expect(result.backup.checksum).toBeDefined();
    });

    it('should fail when no data types are selected', async () => {
      const options = {
        dataTypes: [],
        name: 'Empty Backup'
      };

      const result = await BackupArchivalService.createBackup(options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No data types selected');
    });

    it('should use default values for optional parameters', async () => {
      const options = {
        dataTypes: ['auditLogs']
      };

      const result = await BackupArchivalService.createBackup(options);

      expect(result.success).toBe(true);
      expect(result.backup.name).toContain('Backup');
      expect(result.backup.type).toBe('manual');
      expect(result.backup.encrypted).toBe(true);
      expect(result.backup.compressed).toBe(true);
    });
  });

  describe('getBackupHistory', () => {
    it('should return empty array when no backups exist', () => {
      const history = BackupArchivalService.getBackupHistory();
      expect(history).toEqual([]);
    });

    it('should return filtered backups', () => {
      const mockBackups = [
        {
          id: 'backup1',
          type: 'manual',
          dataTypes: ['auditLogs'],
          createdAt: '2024-01-15T10:00:00Z'
        },
        {
          id: 'backup2',
          type: 'automatic',
          dataTypes: ['userData'],
          createdAt: '2024-01-16T10:00:00Z'
        }
      ];
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockBackups));

      const filteredHistory = BackupArchivalService.getBackupHistory({ type: 'manual' });
      expect(filteredHistory).toHaveLength(1);
      expect(filteredHistory[0].id).toBe('backup1');
    });

    it('should filter by date range', () => {
      const mockBackups = [
        {
          id: 'backup1',
          createdAt: '2024-01-15T10:00:00Z'
        },
        {
          id: 'backup2',
          createdAt: '2024-01-20T10:00:00Z'
        }
      ];
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockBackups));

      const filteredHistory = BackupArchivalService.getBackupHistory({
        startDate: '2024-01-16T00:00:00Z'
      });
      
      expect(filteredHistory).toHaveLength(1);
      expect(filteredHistory[0].id).toBe('backup2');
    });
  });

  describe('deleteBackup', () => {
    it('should delete backup successfully', async () => {
      const mockBackups = [
        { id: 'backup1', name: 'Backup 1' },
        { id: 'backup2', name: 'Backup 2' }
      ];
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockBackups));

      const result = await BackupArchivalService.deleteBackup('backup1');

      expect(result.success).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalled();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('backup_data_backup1');
    });

    it('should fail when backup not found', async () => {
      const result = await BackupArchivalService.deleteBackup('non_existent');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Backup not found');
    });
  });

  describe('exportBackup', () => {
    it('should export backup as blob', async () => {
      const mockBackup = {
        id: 'backup1',
        name: 'Test Backup',
        createdAt: '2024-01-15T10:00:00Z'
      };
      
      const mockData = { auditLogs: [] };
      
      localStorageMock.getItem
        .mockReturnValueOnce(JSON.stringify([mockBackup]))
        .mockReturnValueOnce(JSON.stringify(mockData));

      const blob = await BackupArchivalService.exportBackup('backup1');

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/json');
    });

    it('should throw error when backup not found', async () => {
      await expect(BackupArchivalService.exportBackup('non_existent'))
        .rejects.toThrow('Backup not found');
    });
  });

  describe('configureAutoBackup', () => {
    it('should update archival settings', () => {
      const settings = {
        autoBackup: true,
        backupFrequency: 'weekly',
        retentionPeriod: 60
      };

      const result = BackupArchivalService.configureAutoBackup(settings);

      expect(result.success).toBe(true);
      expect(result.settings.autoBackup).toBe(true);
      expect(result.settings.backupFrequency).toBe('weekly');
      expect(result.settings.retentionPeriod).toBe(60);
    });
  });

  describe('getArchivalSettings', () => {
    it('should return current archival settings', () => {
      const settings = BackupArchivalService.getArchivalSettings();

      expect(settings).toHaveProperty('autoBackup');
      expect(settings).toHaveProperty('backupFrequency');
      expect(settings).toHaveProperty('retentionPeriod');
      expect(settings).toHaveProperty('compressionEnabled');
      expect(settings).toHaveProperty('encryptionEnabled');
    });
  });

  describe('restoreFromBackup', () => {
    it('should restore backup successfully', async () => {
      const mockBackup = {
        id: 'backup1',
        name: 'Test Backup',
        dataTypes: ['auditLogs'],
        checksum: 'test_checksum'
      };
      
      const mockData = { auditLogs: [{ id: 'log1' }] };
      
      localStorageMock.getItem
        .mockReturnValueOnce(JSON.stringify([mockBackup]))
        .mockReturnValueOnce(JSON.stringify(mockData));

      // Mock checksum calculation to match
      vi.spyOn(BackupArchivalService, 'calculateChecksum')
        .mockReturnValue('test_checksum');

      const result = await BackupArchivalService.restoreFromBackup('backup1');

      expect(result.success).toBe(true);
      expect(result.backup.id).toBe('backup1');
      expect(result.restoreResults).toHaveLength(1);
    });

    it('should fail when backup not found', async () => {
      const result = await BackupArchivalService.restoreFromBackup('non_existent');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Backup not found');
    });
  });
});