import { describe, it, expect, vi } from 'vitest';
import { Logger, LogLevel } from '../../src/utils/logger';

describe('Logger', () => {
  describe('constructor', () => {
    it('should create logger with default context and level', () => {
      const logger = new Logger();
      expect(logger.getContext()).toBe('App');
    });

    it('should create logger with custom context', () => {
      const logger = new Logger('CustomContext');
      expect(logger.getContext()).toBe('CustomContext');
    });

    it('should create logger with custom level', () => {
      const logger = new Logger('Test', LogLevel.DEBUG);
      expect(logger).toBeDefined();
    });
  });

  describe('logging methods', () => {
    let logger: Logger;
    let consoleSpy: any;

    beforeEach(() => {
      logger = new Logger('TestLogger', LogLevel.DEBUG);
      consoleSpy = {
        debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
        info: vi.spyOn(console, 'info').mockImplementation(() => {}),
        warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
        error: vi.spyOn(console, 'error').mockImplementation(() => {})
      };
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should log debug messages', () => {
      logger.debug('Debug message');
      expect(consoleSpy.debug).toHaveBeenCalled();
    });

    it('should log info messages', () => {
      logger.info('Info message');
      expect(consoleSpy.info).toHaveBeenCalled();
    });

    it('should log warn messages', () => {
      logger.warn('Warn message');
      expect(consoleSpy.warn).toHaveBeenCalled();
    });

    it('should log error messages', () => {
      logger.error('Error message');
      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('should log with additional arguments', () => {
      logger.info('Message with data', { key: 'value' });
      expect(consoleSpy.info).toHaveBeenCalled();
    });

    it('should respect log level - skip debug when level is INFO', () => {
      const infoLogger = new Logger('Test', LogLevel.INFO);
      infoLogger.debug('Should not appear');
      expect(consoleSpy.debug).not.toHaveBeenCalled();
    });

    it('should respect log level - show warn when level is WARN', () => {
      const warnLogger = new Logger('Test', LogLevel.WARN);
      warnLogger.warn('Should appear');
      warnLogger.info('Should not appear');
      expect(consoleSpy.warn).toHaveBeenCalled();
      expect(consoleSpy.info).not.toHaveBeenCalled();
    });

    it('should respect log level - only show error when level is ERROR', () => {
      const errorLogger = new Logger('Test', LogLevel.ERROR);
      errorLogger.error('Should appear');
      errorLogger.warn('Should not appear');
      expect(consoleSpy.error).toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalled();
    });
  });

  describe('setLevel', () => {
    it('should change log level', () => {
      const logger = new Logger('Test', LogLevel.DEBUG);
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      
      logger.debug('Should appear');
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockClear();
      logger.setLevel(LogLevel.INFO);
      logger.debug('Should not appear');
      expect(consoleSpy).not.toHaveBeenCalled();
      
      vi.restoreAllMocks();
    });
  });

  describe('getContext', () => {
    it('should return the context', () => {
      const logger = new Logger('MyContext');
      expect(logger.getContext()).toBe('MyContext');
    });
  });

  describe('LogLevel enum', () => {
    it('should have correct values', () => {
      expect(LogLevel.DEBUG).toBe(0);
      expect(LogLevel.INFO).toBe(1);
      expect(LogLevel.WARN).toBe(2);
      expect(LogLevel.ERROR).toBe(3);
    });
  });
});
