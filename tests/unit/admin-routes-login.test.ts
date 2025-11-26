import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock config
vi.mock('../../src/config', () => ({
  default: {
    ADMIN_PASSWORD: 'test-admin-password',
    PORT: 8080,
    TARGET_URL: 'http://localhost:3000'
  }
}));

describe('AdminRoutesLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('module import', () => {
    it('should import admin-routes-login', async () => {
      const module = await import('../../src/admin/admin-routes-login');
      expect(module).toBeDefined();
    });

    it('should export addLoginRoute function', async () => {
      const module = await import('../../src/admin/admin-routes-login');
      expect(typeof module.addLoginRoute).toBe('function');
    });
  });

  describe('addLoginRoute', () => {
    it('should add POST /api/auth/login route', async () => {
      const { addLoginRoute } = await import('../../src/admin/admin-routes-login');

      const mockRouter = {
        post: vi.fn()
      };

      addLoginRoute(mockRouter);

      expect(mockRouter.post).toHaveBeenCalledWith('/api/auth/login', expect.any(Function));
    });
  });

  describe('login route handler', () => {
    let loginHandler: Function;
    let mockReq: any;
    let mockRes: any;

    beforeEach(async () => {
      const { addLoginRoute } = await import('../../src/admin/admin-routes-login');

      const mockRouter = {
        post: vi.fn((path: string, handler: Function) => {
          loginHandler = handler;
        })
      };

      addLoginRoute(mockRouter);

      mockReq = {
        body: {}
      };

      mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
    });

    it('should return 400 when password is not provided', () => {
      mockReq.body = {};

      loginHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Password is required'
      });
    });

    it('should return 400 when password is empty string', () => {
      mockReq.body = { password: '' };

      loginHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Password is required'
      });
    });

    it('should return success when password is correct', () => {
      mockReq.body = { password: 'test-admin-password' };

      loginHandler(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Login successful'
      });
    });

    it('should return 401 when password is incorrect', () => {
      mockReq.body = { password: 'wrong-password' };

      loginHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid password'
      });
    });

    it('should return 500 when error occurs', () => {
      // Make req.body getter throw an error
      mockReq = {
        get body() {
          throw new Error('Body parse error');
        }
      };

      loginHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Login failed'
      });
    });
  });
});
