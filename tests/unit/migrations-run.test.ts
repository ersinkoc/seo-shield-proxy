import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock MongoDB
const mockCollection = {
  findOne: vi.fn(),
  insertOne: vi.fn().mockResolvedValue({ insertedId: 'mock-id' })
};

const mockDb = {
  collection: vi.fn().mockReturnValue(mockCollection),
  createCollection: vi.fn().mockResolvedValue({}),
  listCollections: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) })
};

const mockClient = {
  connect: vi.fn().mockResolvedValue(undefined),
  db: vi.fn().mockReturnValue(mockDb),
  close: vi.fn().mockResolvedValue(undefined)
};

vi.mock('mongodb', () => ({
  MongoClient: vi.fn().mockImplementation(() => mockClient),
  Db: vi.fn()
}));

// Mock the migration module
vi.mock('../../src/database/migrations/001-initial-setup', () => ({
  up: vi.fn().mockResolvedValue(undefined),
  down: vi.fn().mockResolvedValue(undefined)
}));

describe('Migrations Index', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection.findOne.mockReset();
    mockCollection.insertOne.mockReset().mockResolvedValue({ insertedId: 'mock-id' });
    mockClient.connect.mockReset().mockResolvedValue(undefined);
    mockClient.close.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('module exports', () => {
    it('should export runMigrations function', async () => {
      const module = await import('../../src/database/migrations/index');
      expect(module.runMigrations).toBeDefined();
      expect(typeof module.runMigrations).toBe('function');
    });

    it('should export migrations array', async () => {
      const module = await import('../../src/database/migrations/index');
      expect(module.migrations).toBeDefined();
      expect(Array.isArray(module.migrations)).toBe(true);
    });

    it('should have at least one migration', async () => {
      const module = await import('../../src/database/migrations/index');
      expect(module.migrations.length).toBeGreaterThan(0);
    });

    it('should have 001-initial-setup migration', async () => {
      const module = await import('../../src/database/migrations/index');
      const migration = module.migrations.find(m => m.name === '001-initial-setup');
      expect(migration).toBeDefined();
    });
  });

  describe('runMigrations function', () => {
    it('should connect to MongoDB', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const { runMigrations } = await import('../../src/database/migrations/index');
      await runMigrations();

      expect(mockClient.connect).toHaveBeenCalled();
    });

    it('should get database instance', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const { runMigrations } = await import('../../src/database/migrations/index');
      await runMigrations();

      expect(mockClient.db).toHaveBeenCalled();
    });

    it('should close connection after completion', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const { runMigrations } = await import('../../src/database/migrations/index');
      await runMigrations();

      expect(mockClient.close).toHaveBeenCalled();
    });

    it('should check for existing migrations', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const { runMigrations } = await import('../../src/database/migrations/index');
      await runMigrations();

      expect(mockCollection.findOne).toHaveBeenCalled();
    });

    it('should skip already applied migrations', async () => {
      // Migration already exists
      mockCollection.findOne.mockResolvedValue({ name: '001-initial-setup', appliedAt: new Date() });

      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const { runMigrations } = await import('../../src/database/migrations/index');
      await runMigrations();

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Skipping migration'));
      expect(mockCollection.insertOne).not.toHaveBeenCalled();

      logSpy.mockRestore();
    });

    it('should run new migrations', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const { runMigrations } = await import('../../src/database/migrations/index');
      await runMigrations();

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Running migration'));
      expect(mockCollection.insertOne).toHaveBeenCalled();

      logSpy.mockRestore();
    });

    it('should record applied migrations', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const { runMigrations } = await import('../../src/database/migrations/index');
      await runMigrations();

      expect(mockCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          name: '001-initial-setup',
          appliedAt: expect.any(Date)
        })
      );
    });

    it('should log completion message', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const { runMigrations } = await import('../../src/database/migrations/index');
      await runMigrations();

      expect(logSpy).toHaveBeenCalledWith('All migrations completed successfully');

      logSpy.mockRestore();
    });
  });

  describe('error handling', () => {
    it('should handle connection errors', async () => {
      mockClient.connect.mockRejectedValue(new Error('Connection failed'));

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const { runMigrations } = await import('../../src/database/migrations/index');

      try {
        await runMigrations();
      } catch (e) {
        // Expected to throw or exit
      }

      expect(errorSpy).toHaveBeenCalledWith('Migration failed:', expect.any(Error));

      errorSpy.mockRestore();
      exitSpy.mockRestore();
    });

    it('should close connection on error', async () => {
      mockCollection.findOne.mockRejectedValue(new Error('Query failed'));

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const { runMigrations } = await import('../../src/database/migrations/index');

      try {
        await runMigrations();
      } catch (e) {
        // Expected to throw or exit
      }

      expect(mockClient.close).toHaveBeenCalled();

      errorSpy.mockRestore();
      exitSpy.mockRestore();
    });
  });

  describe('environment variables', () => {
    it('should use default MongoDB URL when not set', async () => {
      const originalEnv = process.env.MONGODB_URL;
      delete process.env.MONGODB_URL;

      mockCollection.findOne.mockResolvedValue(null);
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const { runMigrations } = await import('../../src/database/migrations/index');
      await runMigrations();

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('mongodb://localhost:27017'));

      logSpy.mockRestore();
      process.env.MONGODB_URL = originalEnv;
    });

    it('should use default database name when not set', async () => {
      const originalEnv = process.env.MONGODB_DB_NAME;
      delete process.env.MONGODB_DB_NAME;

      mockCollection.findOne.mockResolvedValue(null);
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const { runMigrations } = await import('../../src/database/migrations/index');
      await runMigrations();

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('seo_shield_proxy'));

      logSpy.mockRestore();
      process.env.MONGODB_DB_NAME = originalEnv;
    });
  });

  describe('migration structure', () => {
    it('should have name property', async () => {
      const module = await import('../../src/database/migrations/index');
      for (const migration of module.migrations) {
        expect(migration.name).toBeDefined();
        expect(typeof migration.name).toBe('string');
      }
    });

    it('should have up function', async () => {
      const module = await import('../../src/database/migrations/index');
      for (const migration of module.migrations) {
        expect(migration.up).toBeDefined();
        expect(typeof migration.up).toBe('function');
      }
    });

    it('should have down function', async () => {
      const module = await import('../../src/database/migrations/index');
      for (const migration of module.migrations) {
        expect(migration.down).toBeDefined();
        expect(typeof migration.down).toBe('function');
      }
    });
  });
});

describe('Migration Interface', () => {
  it('should define Migration interface correctly', () => {
    interface Migration {
      name: string;
      up: (db: any) => Promise<void>;
      down: (db: any) => Promise<void>;
    }

    const testMigration: Migration = {
      name: 'test-migration',
      up: async () => {},
      down: async () => {}
    };

    expect(testMigration.name).toBe('test-migration');
    expect(typeof testMigration.up).toBe('function');
    expect(typeof testMigration.down).toBe('function');
  });
});
