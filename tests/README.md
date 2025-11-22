# SEO Shield Proxy - Test Suite

Comprehensive test suite with **100% code coverage** and **100% success rate** requirements.

## Overview

This test suite uses Jest with native ES modules support to test all aspects of the SEO Shield Proxy application.

### Test Statistics

- **Coverage Target:** 100% (branches, functions, lines, statements)
- **Test Framework:** Jest 29.7.0
- **HTTP Testing:** Supertest 7.0.0
- **Module Type:** ES Modules (experimental VM modules)

## Test Structure

```
tests/
├── setup.js              # Global test setup and environment
├── unit/                 # Unit tests for individual modules
│   ├── config.test.js    # Configuration validation tests
│   ├── cache.test.js     # Cache operations tests
│   ├── cache-rules.test.js # Pattern matching and rules tests
│   └── browser.test.js   # Puppeteer browser manager tests
├── integration/          # Integration tests
│   └── server.test.js    # Full HTTP server tests
├── mocks/                # Mock implementations
│   └── puppeteer.mock.js # Puppeteer mock for browser tests
└── fixtures/             # Test data and fixtures
```

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode (Development)
```bash
npm run test:watch
```

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests Only
```bash
npm run test:integration
```

### With Coverage Report
```bash
npm test -- --coverage
```

## Test Coverage

### Coverage Thresholds

All metrics must be at 100%:
- **Branches:** 100%
- **Functions:** 100%
- **Lines:** 100%
- **Statements:** 100%

### Coverage Reports

After running tests, coverage reports are generated in:
- **Text:** Console output
- **HTML:** `coverage/index.html`
- **LCOV:** `coverage/lcov.info`
- **JSON:** `coverage/coverage-summary.json`

View HTML coverage:
```bash
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
```

## Test Modules

### 1. config.test.js (Unit)

**Tests:** Configuration loading and validation

**Coverage:**
- ✅ Required TARGET_URL validation
- ✅ URL format validation
- ✅ Default value handling
- ✅ Environment variable parsing
- ✅ Type conversion (string to number)
- ✅ Invalid values handling
- ✅ Cache rules configuration

**Total Test Cases:** 30+

### 2. cache.test.js (Unit)

**Tests:** In-memory caching operations

**Coverage:**
- ✅ get() method (hit/miss)
- ✅ set() method
- ✅ delete() method
- ✅ flush() method
- ✅ getStats() method
- ✅ TTL expiration
- ✅ Singleton behavior
- ✅ Concurrent operations
- ✅ Edge cases

**Total Test Cases:** 25+

### 3. cache-rules.test.js (Unit)

**Tests:** URL pattern matching and cache decision logic

**Coverage:**
- ✅ Pattern parsing (literal, wildcard, regex)
- ✅ NO_CACHE_PATTERNS priority
- ✅ CACHE_PATTERNS whitelist mode
- ✅ CACHE_BY_DEFAULT behavior
- ✅ Meta tag detection (true/false)
- ✅ getCacheDecision() combined logic
- ✅ Priority order verification
- ✅ Complex pattern matching
- ✅ Edge cases and malformed input

**Total Test Cases:** 50+

### 4. browser.test.js (Unit)

**Tests:** Puppeteer browser management and rendering

**Coverage:**
- ✅ getBrowser() singleton pattern
- ✅ Browser launch configuration
- ✅ render() method
- ✅ Request interception (block images, CSS, fonts)
- ✅ Viewport and user agent setup
- ✅ Page lifecycle management
- ✅ Memory cleanup (page.close())
- ✅ Error handling
- ✅ Disconnect handling

**Total Test Cases:** 30+

**Mocking Strategy:** Uses custom Puppeteer mock (`tests/mocks/puppeteer.mock.js`)

### 5. server.test.js (Integration)

**Tests:** Complete HTTP server with all middleware

**Coverage:**
- ✅ Static asset handling (.js, .css, images, fonts)
- ✅ Human user proxying
- ✅ Bot detection (Googlebot, Bingbot, etc.)
- ✅ Cache hit/miss scenarios
- ✅ Cache rules integration
- ✅ Meta tag override
- ✅ Error handling and fallbacks
- ✅ /health endpoint
- ✅ /cache/clear endpoint
- ✅ Edge cases (missing UA, query params, etc.)

**Total Test Cases:** 60+

## Mocking Strategy

### Puppeteer Mock

Location: `tests/mocks/puppeteer.mock.js`

Provides:
- `createMockPage()` - Simulates Puppeteer page object
- `createMockBrowser()` - Simulates Puppeteer browser object
- `createMockRequest()` - Simulates HTTP request objects

Usage:
```javascript
import { createMockPage } from '../mocks/puppeteer.mock.js';

const mockPage = createMockPage({
  html: '<html>Test Content</html>',
  goto: jest.fn().mockResolvedValue(undefined),
});
```

### Environment Setup

Location: `tests/setup.js`

Configures:
- Test environment variables
- Console mocking (suppresses logs during tests)
- Global timeout settings

## Writing New Tests

### Test File Naming

- Unit tests: `tests/unit/<module>.test.js`
- Integration tests: `tests/integration/<feature>.test.js`
- Follow the pattern: `<module-name>.test.js`

### Test Structure

```javascript
import { jest } from '@jest/globals';

describe('Module Name', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  describe('Feature Group', () => {
    test('should do something specific', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = myFunction(input);

      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### Best Practices

1. **AAA Pattern:** Arrange, Act, Assert
2. **One assertion per test:** Keep tests focused
3. **Descriptive names:** Use clear, descriptive test names
4. **Mock external dependencies:** Isolate unit under test
5. **Clean up:** Always reset mocks and restore state
6. **Test edge cases:** Cover all branches and conditions

## Debugging Tests

### Run Single Test File
```bash
npm test tests/unit/config.test.js
```

### Run Single Test Case
```bash
npm test -- -t "should validate TARGET_URL"
```

### Enable Debug Mode
```bash
DEBUG=1 npm test
```

### Run with Node Inspector
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### Coverage Enforcement

Tests will **fail** if coverage drops below 100% for any metric.

## Common Issues

### ES Modules Error

**Problem:** `Cannot use import statement outside a module`

**Solution:** Ensure `"type": "module"` in package.json and use `NODE_OPTIONS='--experimental-vm-modules'`

### Timeout Errors

**Problem:** Tests timeout after 5 seconds

**Solution:** Increase timeout in jest.config.js or specific test:
```javascript
jest.setTimeout(30000);
```

### Open Handles Warning

**Problem:** Jest detects open handles

**Solution:** Ensure all connections, servers, and timers are properly closed:
```javascript
afterAll(async () => {
  await server.close();
  await browser.close();
});
```

## Continuous Improvement

### Adding New Features

When adding new features to the codebase:

1. Write tests **first** (TDD approach)
2. Ensure 100% coverage of new code
3. Run full test suite before commit
4. Update this README if adding new test categories

### Maintaining Coverage

- Run tests before every commit
- Review coverage reports regularly
- Address any uncovered code immediately
- Keep coverage at 100% - **NO EXCEPTIONS**

## Performance Metrics

Expected test execution times:
- Unit tests: < 5 seconds
- Integration tests: < 10 seconds
- Full suite: < 15 seconds

## Support

For issues or questions about tests:
1. Check test output for detailed error messages
2. Review coverage reports for missing coverage
3. Consult this README for debugging tips
4. Check Jest documentation: https://jestjs.io/

---

**Remember:** 100% coverage is not just a goal - it's a requirement! 🎯
