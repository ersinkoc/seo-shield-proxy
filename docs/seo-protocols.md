# SEO Protocols

## Overview

SEO Shield Proxy includes advanced SEO optimization protocols that go beyond basic SSR rendering. These protocols address specific challenges with modern web applications and search engine indexing.

## Available Protocols

| Protocol | Purpose |
|----------|---------|
| **Content Health Check** | Validate SEO completeness |
| **Virtual Scroll** | Handle infinite scroll and lazy loading |
| **ETag Strategy** | Optimize caching with content hashing |
| **Shadow DOM Extractor** | Penetrate Web Components |
| **Circuit Breaker** | Prevent cascade failures |
| **Cluster Mode** | Distributed rendering |

## Content Health Check

Validates that rendered pages meet SEO requirements.

### Configuration

```typescript
contentHealthCheck: {
  enabled: true,
  criticalSelectors: [
    { selector: 'title', type: 'title', required: true },
    { selector: 'meta[name="description"]', type: 'meta', required: true },
    { selector: 'h1', type: 'h1', required: true },
    { selector: 'body', type: 'custom', required: true }
  ],
  minBodyLength: 500,
  minTitleLength: 30,
  metaDescriptionRequired: true,
  h1Required: true,
  failOnMissingCritical: true
}
```

### Validation Rules

| Rule | Description | Threshold |
|------|-------------|-----------|
| Title length | Minimum characters | 30 |
| Body length | Minimum content | 500 chars |
| Meta description | Required | Yes |
| H1 heading | Required | Yes |
| Critical selectors | Custom elements | Configurable |

### Health Score

```typescript
interface HealthCheckResult {
  passed: boolean;
  score: number;        // 0-100
  issues: Issue[];
  recommendations: string[];
}
```

### Example Response

```json
{
  "passed": false,
  "score": 65,
  "issues": [
    {
      "type": "warning",
      "message": "Meta description is too short (45 chars, min: 120)",
      "selector": "meta[name=\"description\"]"
    },
    {
      "type": "error",
      "message": "Missing canonical URL",
      "selector": "link[rel=\"canonical\"]"
    }
  ],
  "recommendations": [
    "Add a canonical URL to prevent duplicate content issues",
    "Extend meta description to 120-160 characters"
  ]
}
```

## Virtual Scroll Manager

Handles infinite scroll, lazy loading, and dynamic content loading.

### The Problem

Modern SPAs use:

- Infinite scroll (load more on scroll)
- Lazy loading images
- Virtual lists (render only visible items)
- Intersection Observer API

Search engine bots may not trigger these mechanisms, missing content.

### Solution

The Virtual Scroll Manager simulates user scrolling:

```typescript
virtualScroll: {
  enabled: true,
  scrollSteps: 10,              // Number of scroll actions
  scrollInterval: 500,          // ms between scrolls
  maxScrollHeight: 10000,       // Max pixels to scroll
  waitAfterScroll: 1000,        // Wait for content to load
  scrollSelectors: ['.infinite-scroll-container'],
  infiniteScrollSelectors: ['.load-more', '.infinite-trigger'],
  lazyImageSelectors: ['img[data-src]', 'img[loading="lazy"]'],
  triggerIntersectionObserver: true,
  waitForNetworkIdle: true,
  networkIdleTimeout: 2000
}
```

### Scroll Behavior

```
1. Initial page load
2. Wait for initial content
3. Scroll down in steps:
   ├── Scroll 1: 0 → 1000px
   ├── Wait 500ms for content
   ├── Scroll 2: 1000 → 2000px
   ├── Wait 500ms for content
   └── ... (repeat scrollSteps times)
4. Wait for network idle
5. Capture final HTML
```

### Lazy Image Handling

```typescript
// Automatically triggers lazy loading for:
img[data-src]           // Common lazy load pattern
img[loading="lazy"]     // Native lazy loading
img.lazyload            // Class-based lazy loading
[data-lazy]             // Generic lazy attribute
```

### Result

```json
{
  "success": true,
  "scrollSteps": 10,
  "initialHeight": 1200,
  "finalHeight": 8500,
  "newImages": 45,
  "newContent": 12,
  "completionRate": 95,
  "scrollDuration": 6500
}
```

## ETag Strategy

Intelligent content change detection for optimal caching.

### Configuration

```typescript
etagStrategy: {
  enabled: true,
  hashAlgorithm: 'sha256',      // or 'md5'
  enable304Responses: true,
  checkContentChanges: true,
  ignoredElements: ['.timestamp', '.ad-banner'],
  significantChanges: {
    minWordChange: 10,          // Min word difference
    minStructureChange: 3,      // Min element changes
    contentWeightThreshold: 0.1 // 10% content change
  }
}
```

### How It Works

```
1. Generate content hash (excluding dynamic elements)
2. Store ETag in cache metadata
3. On subsequent request:
   ├── If If-None-Match header matches → 304 Not Modified
   └── If content changed → 200 with new ETag
```

### Change Detection Levels

| Level | Description | Action |
|-------|-------------|--------|
| None | No changes | 304 response |
| Minor | < 10 words changed | May serve cached |
| Significant | > 10 words, structure | Update cache |
| Major | > 10% content change | Full re-render |

### Benefits

- **Bandwidth savings**: 304 responses save transfer
- **Faster responses**: No re-rendering for unchanged content
- **Better crawl efficiency**: Bots skip unchanged pages

## Shadow DOM Extractor

Penetrates Shadow DOM boundaries for complete content extraction.

### The Problem

Web Components with Shadow DOM encapsulate content:

```html
<my-product-card>
  #shadow-root (open)
    <h2>Product Name</h2>
    <p>Description here</p>
</my-product-card>
```

Standard DOM traversal doesn't see shadow content.

### Configuration

```typescript
shadowDom: {
  enabled: true,
  deepSerialization: true,
  includeShadowContent: true,
  flattenShadowTrees: true,
  customElements: {
    'lit-element': { extractMethod: 'slot' },
    'stencil-component': { extractMethod: 'slot' },
    'custom-element': { extractMethod: 'custom', selector: '.content' }
  },
  preserveShadowBoundaries: false,
  extractCSSVariables: true,
  extractComputedStyles: false
}
```

### Extraction Methods

| Method | Description | Use Case |
|--------|-------------|----------|
| `slot` | Extract slotted content | Lit, Stencil |
| `attribute` | Get from attribute | Data attributes |
| `custom` | Custom selector | Custom elements |

### Result

```json
{
  "lightDOM": "<html>...</html>",
  "shadowDOMs": [
    {
      "host": "my-product-card",
      "hostSelector": "#product-123",
      "content": "<h2>Product Name</h2>...",
      "slots": ["default", "price"],
      "cssVariables": {"--primary-color": "#007bff"}
    }
  ],
  "flattened": "<html><!-- Shadow content merged -->...</html>",
  "stats": {
    "totalShadowRoots": 5,
    "extractedElements": 23,
    "cssVariables": 12,
    "nestedDepth": 3
  }
}
```

## Circuit Breaker

Prevents cascade failures during high load or target site issues.

### Configuration

```typescript
circuitBreaker: {
  enabled: true,
  errorThreshold: 50,           // % errors to open circuit
  resetTimeout: 30000,          // ms before trying again
  monitoringPeriod: 10000,      // Window for error calculation
  fallbackToStale: true,        // Serve stale on failure
  halfOpenMaxCalls: 3,          // Test calls when half-open
  failureThreshold: 5,          // Consecutive failures
  successThreshold: 3,          // Successes to close
  timeoutThreshold: 10000       // Request timeout
}
```

### States

```
┌─────────────┐         Failure threshold
│   CLOSED    │──────────────────────────────────────┐
│  (Normal)   │                                      │
└──────┬──────┘                                      │
       │                                             ▼
       │ Success                              ┌─────────────┐
       │                                      │    OPEN     │
       │                                      │  (Failing)  │
       │                                      └──────┬──────┘
       │                                             │
       │                                             │ Reset timeout
       │                                             │
       │                                             ▼
       │                                      ┌─────────────┐
       └──────────────────────────────────────│  HALF-OPEN  │
                        Success               │  (Testing)  │
                                              └─────────────┘
                                                     │
                                                     │ Failure
                                                     ▼
                                              ┌─────────────┐
                                              │    OPEN     │
                                              └─────────────┘
```

### Behavior by State

| State | Behavior |
|-------|----------|
| **CLOSED** | Normal operation, requests pass through |
| **OPEN** | All requests fail fast, serve fallback |
| **HALF-OPEN** | Allow limited requests to test recovery |

### Fallback Strategy

When circuit is open:

1. Serve stale cache if available
2. Return cached error page
3. Proxy directly without SSR

## Cluster Mode

Distributed rendering across multiple workers.

### Configuration

```typescript
clusterMode: {
  enabled: true,
  useRedisQueue: true,
  maxWorkers: 10,
  jobTimeout: 30000,
  retryAttempts: 2,
  retryDelay: 1000,
  browser: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080 }
  }
}
```

### Architecture

```
                    ┌─────────────────┐
                    │  Redis Queue    │
                    │  (Job Queue)    │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   Worker 1    │   │   Worker 2    │   │   Worker 3    │
│   Browser     │   │   Browser     │   │   Browser     │
└───────────────┘   └───────────────┘   └───────────────┘
```

### Job Priority

```typescript
interface RenderJob {
  url: string;
  priority: 'low' | 'medium' | 'high';
  options: {
    timeout: number;
    waitUntil: 'networkidle0' | 'networkidle2' | 'domcontentloaded';
  };
}
```

### Benefits

- **Horizontal scaling**: Add workers as needed
- **Fault tolerance**: Failed workers don't crash system
- **Priority queue**: Important pages render first
- **Resource isolation**: Workers are independent

## Protocol Integration

### Applying Protocols

The `SEOProtocolsService` orchestrates all protocols:

```typescript
const seoService = new SEOProtocolsService(config);
await seoService.initialize();

const result = await seoService.applyOptimizations({
  url: '/product/123',
  html: renderedHtml,
  page: puppeteerPage
});

// Result includes:
// - Optimized HTML
// - Applied optimizations list
// - Metrics from each protocol
// - Warnings if any
```

### Execution Order

```
1. Virtual Scroll (expand content)
2. Shadow DOM Extraction (flatten shadows)
3. Content Health Check (validate)
4. ETag Generation (create hash)
```

### Protocol Status API

```bash
GET /shieldapi/protocols/status
```

```json
{
  "enabled": true,
  "protocols": {
    "contentHealthCheck": { "enabled": true, "status": "active" },
    "virtualScroll": { "enabled": true, "status": "active" },
    "etagStrategy": { "enabled": true, "status": "active" },
    "shadowDom": { "enabled": false, "status": "disabled" },
    "circuitBreaker": { "enabled": true, "status": "active" },
    "clusterMode": { "enabled": false, "status": "disabled" }
  },
  "overall": "healthy"
}
```

## Best Practices

### Content Health Check

1. Define critical selectors for your content types
2. Set realistic thresholds (don't be too strict)
3. Monitor health scores over time
4. Act on recurring issues

### Virtual Scroll

1. Use appropriate scroll steps for content density
2. Set reasonable `maxScrollHeight` to avoid infinite loops
3. Test with different page types
4. Monitor scroll completion rate

### ETag Strategy

1. Exclude dynamic elements (timestamps, ads)
2. Use SHA-256 for production
3. Enable 304 responses for bandwidth savings
4. Set appropriate significance thresholds

### Shadow DOM

1. Only enable if using Web Components
2. Map custom elements with correct extraction method
3. Test flattened output for SEO validity
4. Consider performance impact

### Circuit Breaker

1. Set thresholds based on normal error rates
2. Enable `fallbackToStale` for availability
3. Monitor circuit state in dashboard
4. Alert on persistent open circuits

### Cluster Mode

1. Use Redis queue for distributed setups
2. Set `maxWorkers` based on resources
3. Implement proper job prioritization
4. Monitor worker health

## Related Documentation

- [Configuration](configuration.md) - Protocol settings
- [Architecture](architecture.md) - System design
- [Concurrency Control](concurrency-control.md) - Render management
- [Debug Mode](debug-mode.md) - Testing protocols
