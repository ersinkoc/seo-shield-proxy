import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCollection = {
  insertOne: vi.fn().mockResolvedValue({ insertedId: 'test' }),
  find: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }),
  updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
  deleteOne: vi.fn().mockResolvedValue({ deletedCount: 1 }),
  createIndexes: vi.fn().mockResolvedValue(['index1', 'index2'])
};

const mockDb = {
  collection: vi.fn().mockReturnValue(mockCollection),
  admin: vi.fn().mockReturnValue({
    ping: vi.fn().mockResolvedValue({ ok: 1 })
  }),
  stats: vi.fn().mockResolvedValue({
    collections: 5,
    dataSize: 1024,
    indexSize: 512,
    storageSize: 2048
  })
};

const mockClient = {
  connect: vi.fn().mockResolvedValue(undefined),
  db: vi.fn().mockReturnValue(mockDb),
  close: vi.fn().mockResolvedValue(undefined)
};

vi.mock('mongodb', () => ({
  MongoClient: vi.fn().mockImplementation(() => mockClient)
}));

vi.mock('../../src/config', () => ({
  default: {
    MONGODB_URL: 'mongodb://localhost:27017',
    MONGODB_DB_NAME: 'test_db'
  }
}));

vi.mock('../../src/storage/mongodb-storage', () => ({
  MongoStorage: vi.fn().mockImplementation(() => ({
    insert: vi.fn(),
    find: vi.fn()
  }))
}));

describe('DatabaseManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('module import', () => {
    it('should import DatabaseManager', async () => {
      const module = await import('../../src/database/database-manager');
      expect(module.DatabaseManager).toBeDefined();
    });

    it('should export databaseManager singleton', async () => {
      const module = await import('../../src/database/database-manager');
      expect(module.databaseManager).toBeDefined();
    });
  });

  describe('getInstance', () => {
    it('should return singleton instance', async () => {
      const module = await import('../../src/database/database-manager');
      const instance1 = module.DatabaseManager.getInstance();
      const instance2 = module.DatabaseManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should return DatabaseManager instance', async () => {
      const module = await import('../../src/database/database-manager');
      const instance = module.DatabaseManager.getInstance();
      expect(instance).toBeDefined();
    });
  });

  describe('connect', () => {
    it('should have connect method', async () => {
      const module = await import('../../src/database/database-manager');
      expect(typeof module.databaseManager.connect).toBe('function');
    });

    it('should return boolean', async () => {
      const module = await import('../../src/database/database-manager');
      const result = await module.databaseManager.connect();
      expect(typeof result).toBe('boolean');
    });

    it('should return true on successful connection', async () => {
      vi.resetModules();
      const module = await import('../../src/database/database-manager');
      const result = await module.databaseManager.connect();
      expect(result).toBe(true);
    });

    it('should return false on connection failure', async () => {
      vi.resetModules();
      mockClient.connect.mockRejectedValueOnce(new Error('Connection failed'));

      const module = await import('../../src/database/database-manager');
      const result = await module.databaseManager.connect();
      expect(result).toBe(false);
    });
  });

  describe('disconnect', () => {
    it('should have disconnect method', async () => {
      const module = await import('../../src/database/database-manager');
      expect(typeof module.databaseManager.disconnect).toBe('function');
    });

    it('should disconnect successfully', async () => {
      const module = await import('../../src/database/database-manager');
      await module.databaseManager.disconnect();
      // Should not throw
    });

    it('should handle disconnect when not connected', async () => {
      vi.resetModules();
      const module = await import('../../src/database/database-manager');
      // Should not throw when no connection exists
      await expect(module.databaseManager.disconnect()).resolves.not.toThrow();
    });
  });

  describe('getMongoStorage', () => {
    it('should have getMongoStorage method', async () => {
      const module = await import('../../src/database/database-manager');
      expect(typeof module.databaseManager.getMongoStorage).toBe('function');
    });

    it('should return null when not connected', async () => {
      vi.resetModules();
      const module = await import('../../src/database/database-manager');
      const storage = module.databaseManager.getMongoStorage();
      expect(storage).toBeNull();
    });

    it('should return MongoStorage after connection', async () => {
      vi.resetModules();
      const module = await import('../../src/database/database-manager');
      await module.databaseManager.connect();
      const storage = module.databaseManager.getMongoStorage();
      expect(storage).not.toBeNull();
    });
  });

  describe('getDb', () => {
    it('should have getDb method', async () => {
      const module = await import('../../src/database/database-manager');
      expect(typeof module.databaseManager.getDb).toBe('function');
    });

    it('should return null when not connected', async () => {
      vi.resetModules();
      const module = await import('../../src/database/database-manager');
      const db = module.databaseManager.getDb();
      expect(db).toBeNull();
    });

    it('should return Db after connection', async () => {
      vi.resetModules();
      const module = await import('../../src/database/database-manager');
      await module.databaseManager.connect();
      const db = module.databaseManager.getDb();
      expect(db).not.toBeNull();
    });
  });

  describe('isDbConnected', () => {
    it('should have isDbConnected method', async () => {
      const module = await import('../../src/database/database-manager');
      expect(typeof module.databaseManager.isDbConnected).toBe('function');
    });

    it('should return false when not connected', async () => {
      vi.resetModules();
      const module = await import('../../src/database/database-manager');
      const connected = module.databaseManager.isDbConnected();
      expect(connected).toBe(false);
    });

    it('should return true after successful connection', async () => {
      vi.resetModules();
      const module = await import('../../src/database/database-manager');
      await module.databaseManager.connect();
      const connected = module.databaseManager.isDbConnected();
      expect(connected).toBe(true);
    });
  });

  describe('healthCheck', () => {
    it('should have healthCheck method', async () => {
      const module = await import('../../src/database/database-manager');
      expect(typeof module.databaseManager.healthCheck).toBe('function');
    });

    it('should return connected: false when not connected', async () => {
      vi.resetModules();
      const module = await import('../../src/database/database-manager');
      const health = await module.databaseManager.healthCheck();
      expect(health.connected).toBe(false);
    });

    it('should return stats when connected', async () => {
      vi.resetModules();
      const module = await import('../../src/database/database-manager');
      await module.databaseManager.connect();
      const health = await module.databaseManager.healthCheck();
      expect(health.connected).toBe(true);
      expect(health.stats).toBeDefined();
    });

    it('should include stats properties', async () => {
      vi.resetModules();
      const module = await import('../../src/database/database-manager');
      await module.databaseManager.connect();
      const health = await module.databaseManager.healthCheck();

      if (health.stats) {
        expect(health.stats).toHaveProperty('collections');
        expect(health.stats).toHaveProperty('dataSize');
        expect(health.stats).toHaveProperty('indexSize');
        expect(health.stats).toHaveProperty('storageSize');
      }
    });

    it('should handle stats error gracefully', async () => {
      vi.resetModules();
      mockDb.stats.mockRejectedValueOnce(new Error('Stats failed'));

      const module = await import('../../src/database/database-manager');
      await module.databaseManager.connect();
      const health = await module.databaseManager.healthCheck();

      expect(health.connected).toBe(false);
    });
  });

  describe('initializeIndexes', () => {
    it('should create indexes on connect', async () => {
      vi.resetModules();
      const module = await import('../../src/database/database-manager');
      await module.databaseManager.connect();

      expect(mockCollection.createIndexes).toHaveBeenCalled();
    });

    it('should create traffic_metrics indexes', async () => {
      vi.resetModules();
      const module = await import('../../src/database/database-manager');
      await module.databaseManager.connect();

      expect(mockDb.collection).toHaveBeenCalledWith('traffic_metrics');
    });

    it('should create configurations indexes', async () => {
      vi.resetModules();
      const module = await import('../../src/database/database-manager');
      await module.databaseManager.connect();

      expect(mockDb.collection).toHaveBeenCalledWith('configurations');
    });

    it('should create audit_logs indexes', async () => {
      vi.resetModules();
      const module = await import('../../src/database/database-manager');
      await module.databaseManager.connect();

      expect(mockDb.collection).toHaveBeenCalledWith('audit_logs');
    });

    it('should create error_logs indexes', async () => {
      vi.resetModules();
      const module = await import('../../src/database/database-manager');
      await module.databaseManager.connect();

      expect(mockDb.collection).toHaveBeenCalledWith('error_logs');
    });

    it('should handle index creation error gracefully', async () => {
      vi.resetModules();
      mockCollection.createIndexes.mockRejectedValueOnce(new Error('Index creation failed'));

      const module = await import('../../src/database/database-manager');
      // Should not throw, just log warning
      await expect(module.databaseManager.connect()).resolves.toBe(true);
    });
  });

  describe('connection lifecycle', () => {
    it('should handle connect -> disconnect cycle', async () => {
      vi.resetModules();
      const module = await import('../../src/database/database-manager');

      await module.databaseManager.connect();
      expect(module.databaseManager.isDbConnected()).toBe(true);

      await module.databaseManager.disconnect();
      expect(module.databaseManager.isDbConnected()).toBe(false);
    });

    it('should reset state on disconnect', async () => {
      vi.resetModules();
      const module = await import('../../src/database/database-manager');

      await module.databaseManager.connect();
      await module.databaseManager.disconnect();

      expect(module.databaseManager.getDb()).toBeNull();
      expect(module.databaseManager.getMongoStorage()).toBeNull();
    });

    it('should reset state on connection failure', async () => {
      vi.resetModules();
      mockClient.connect.mockRejectedValueOnce(new Error('Connection failed'));

      const module = await import('../../src/database/database-manager');
      await module.databaseManager.connect();

      expect(module.databaseManager.isDbConnected()).toBe(false);
      expect(module.databaseManager.getDb()).toBeNull();
    });
  });
});
