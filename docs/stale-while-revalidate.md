# Stale-While-Revalidate (SWR) Strategy

## Overview

The Stale-While-Revalidate (SWR) strategy is a caching pattern that prioritizes **speed over freshness** for bot traffic. When a cached entry expires, instead of making the bot wait for a fresh render (3-5 seconds), we immediately serve the stale content and update the cache in the background.

**Philosophy**: *"Fast stale data > Slow fresh data"*

Googlebot and other search engine crawlers prefer fast responses. Serving content that's 1 hour old is usually better than making the bot wait or risk a timeout.

## How It Works

### 1. Cache Configuration

The cache is configured to **keep expired entries**:

```typescript
// src/cache.ts
this.cache = new NodeCache({
  stdTTL: config.CACHE_TTL,
  deleteOnExpire: false, // ✅ Keep stale entries for SWR
  maxKeys: 1000,
});
```

### 2. TTL-Aware Cache Retrieval

The `getWithTTL()` method returns cache entries with staleness information:

```typescript
interface CacheEntry {
  value: string;      // The cached HTML
  ttl: number;        // Remaining TTL in seconds (0 if expired)
  isStale: boolean;   // true if TTL expired
}

const cacheEntry = cache.getWithTTL('/product/123');
// Example result:
// {
//   value: '<html>...</html>',
//   ttl: -300,           // Expired 5 minutes ago
//   isStale: true
// }
```

### 3. Serving Strategy

When a bot requests a page:

```typescript
// src/server.ts
const cacheEntry = cache.getWithTTL(cacheKey);

if (cacheEntry) {
  if (cacheEntry.isStale) {
    // 🚀 Serve stale content IMMEDIATELY
    res.set('X-Cache-Status', 'STALE');
    res.set('X-SWR', 'true');

    // 🔄 Revalidate in background (non-blocking)
    (async () => {
      const renderResult = await browserManager.render(fullUrl);
      cache.set(cacheKey, renderResult.html);
    })();

    return res.send(cacheEntry.value);
  }

  // Fresh cache hit
  res.set('X-Cache-Status', 'HIT');
  res.set('X-Cache-TTL', Math.floor(cacheEntry.ttl).toString());
  return res.send(cacheEntry.value);
}

// Cache miss - render and cache
const renderResult = await browserManager.render(fullUrl);
cache.set(cacheKey, renderResult.html);
res.send(renderResult.html);
```

## Benefits

### For Search Engine Crawlers

| Scenario | Without SWR | With SWR |
|----------|-------------|----------|
| Fresh cache (TTL valid) | ⚡ Instant (< 10ms) | ⚡ Instant (< 10ms) |
| Expired cache | ⏱️ Wait 3-5 seconds | ⚡ Instant (< 10ms) |
| Timeout risk | ❌ High (3-5s wait) | ✅ None (instant) |
| Content freshness | 🆕 Always fresh | 🔄 Slightly stale, then fresh |

### Performance Metrics

- **Response Time**: < 10ms (even with expired cache)
- **Timeout Risk**: Eliminated (no blocking Puppeteer calls)
- **Crawl Efficiency**: Bots can crawl more pages per session
- **SEO Impact**: Better crawl budget utilization

### Real-World Example

**Scenario**: Googlebot visits `/product/smartphone-x` at 10:05 AM
- Cache was created at 9:00 AM (TTL: 1 hour)
- Cache expired at 10:00 AM
- Current time: 10:05 AM (5 minutes after expiration)

**Without SWR**:
1. Cache expired → Render with Puppeteer (3-5 seconds)
2. Risk: Googlebot might timeout
3. Response: Fresh HTML after 3-5 seconds

**With SWR**:
1. Cache expired → Serve stale HTML (< 10ms) ✅
2. Background: Start Puppeteer render
3. Next bot visit: Gets fresh HTML

**Result**: Googlebot gets instant response, cache stays fresh for subsequent requests.

## HTTP Headers

The SWR strategy adds special headers to help with debugging:

### Stale Content Response

```http
HTTP/1.1 200 OK
X-Cache-Status: STALE
X-SWR: true
X-Rendered-By: Puppeteer
Content-Type: text/html
```

### Fresh Cache Response

```http
HTTP/1.1 200 OK
X-Cache-Status: HIT
X-Cache-TTL: 2847
X-Rendered-By: Puppeteer
Content-Type: text/html
```

## Monitoring

### Logs

The cache system provides detailed logging:

```bash
# Stale cache served
⏰ Cache STALE: /product/123 (expired 300s ago)
🔄 SWR: Serving stale content for: /product/123
🔄 Background revalidation started for: /product/123
✅ Background revalidation completed for: /product/123

# Fresh cache hit
✅ Cache HIT: /product/456 (TTL: 2847s)
```

### Metrics

Check the admin dashboard for SWR statistics:

- **Total Requests**: All bot requests
- **Cache Hits**: Fresh cache responses
- **Cache Misses**: Render required
- **Stale Serves**: SWR strategy used

## Configuration

### Cache TTL

Adjust the cache TTL in your `.env` file:

```bash
# Cache duration (default: 3600 seconds = 1 hour)
CACHE_TTL=3600

# For more frequent updates (e.g., news sites)
CACHE_TTL=1800  # 30 minutes

# For static content
CACHE_TTL=7200  # 2 hours
```

### Max Cache Keys

The cache stores up to 1000 URLs by default. When the limit is reached, the least recently used entries are evicted.

```typescript
// src/cache.ts
this.cache = new NodeCache({
  maxKeys: 1000,  // Adjust based on your site size
});
```

## Edge Cases

### 1. Background Revalidation Failure

If background revalidation fails, the stale content remains in cache:

```bash
⚠️  Background revalidation failed for /product/123: Timeout
```

**Impact**: Next bot request will still get stale content (and retry revalidation).

**Solution**: Check Puppeteer logs and ensure target site is accessible.

### 2. Cache Disabled URLs

URLs matching cache bypass rules skip SWR entirely:

```javascript
// src/admin/cache-rules.ts
cacheRules.addRule({
  path: '/api/*',
  action: 'bypass',
  reason: 'API endpoints are dynamic',
});
```

### 3. First Request After Expiration

The first bot after cache expiration gets stale content. All subsequent bots get fresh content (assuming revalidation succeeded).

## Integration with Other Features

### Status Code Detection

SWR works seamlessly with status code detection:

```html
<!-- React 404 page -->
<meta name="prerender-status-code" content="404" />
```

- **Stale Response**: Returns stale HTML with HTTP 404
- **Background Revalidation**: Updates cache with new 404 HTML
- **Headers**: `X-Cache-Status: STALE` + `X-Prerender-Status-Code: 404`

### Cache Rules

SWR respects cache rules:

```javascript
// Only cache if HTML contains product data
cacheRules.addRule({
  path: '/product/*',
  action: 'cache_if_contains',
  pattern: '<div class="product">',
  reason: 'Cache only valid product pages',
});
```

If revalidation finds the pattern is missing, cache is updated accordingly.

## Testing

Run SWR tests:

```bash
npm test tests/unit/cache-swr.test.js
```

Test coverage:
- TTL information retrieval
- Stale detection after expiration
- Cache entry structure
- deleteOnExpire: false behavior
- Integration with regular get()

## Best Practices

1. **Set Appropriate TTL**: Balance freshness vs. render load
   - News sites: 15-30 minutes
   - E-commerce: 1 hour
   - Static content: 2-4 hours

2. **Monitor Background Revalidation**: Watch for failures
   ```bash
   grep "Background revalidation failed" logs/app.log
   ```

3. **Use Cache Rules Wisely**: Don't cache error pages
   ```javascript
   cacheRules.addRule({
     path: '/error',
     action: 'bypass',
     reason: 'Error pages should not be cached',
   });
   ```

4. **Test with Real Bots**: Use Google Search Console's URL Inspection tool

## Verification

### 1. Check Headers

```bash
curl -H "User-Agent: Googlebot" https://your-site.com/product/123 -I

# First request after expiration:
X-Cache-Status: STALE
X-SWR: true

# Second request (after revalidation):
X-Cache-Status: HIT
X-Cache-TTL: 3598
```

### 2. Check Logs

```bash
tail -f logs/app.log | grep -E "(STALE|SWR|Background revalidation)"
```

### 3. Admin Dashboard

Visit `/admin` and check:
- Cache hit rate
- Average response time
- Recent bot requests

## Performance Impact

### Before SWR

```
Cache TTL: 1 hour
Bot visits after 1.5 hours:

Request 1: MISS (render 3.5s)
Request 2: HIT  (instant)
...
Request 100: HIT (instant)
--- 1.5 hours later ---
Request 101: MISS (render 3.5s) ❌ Timeout risk
```

### After SWR

```
Cache TTL: 1 hour
Bot visits after 1.5 hours:

Request 1: MISS (render 3.5s)
Request 2: HIT  (instant)
...
Request 100: HIT (instant)
--- 1.5 hours later ---
Request 101: STALE (instant) ✅ No timeout risk
Request 102: HIT (instant, fresh cache)
```

## Conclusion

The SWR strategy eliminates timeout risks for expired cache entries while maintaining fresh content through background revalidation. This approach:

- ✅ Improves bot crawl efficiency
- ✅ Reduces timeout risks
- ✅ Maintains content freshness
- ✅ Requires no changes to your application code
- ✅ Works transparently with all features

**Result**: Better SEO performance through faster, more reliable bot responses.
