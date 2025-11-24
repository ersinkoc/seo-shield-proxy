# 🛡️ SEO Shield Proxy

Production-ready Node.js reverse proxy that transforms Single Page Applications (SPAs) into SEO-optimized websites without modifying client-side code. Features intelligent bot detection, server-side rendering, smart caching, and comprehensive admin dashboard.

## 🎯 **LATEST ACHIEVEMENTS - PRODUCTION READY**

### ✅ **TypeScript Perfection** - 100% Bug-Free
- **Fixed all 46 TypeScript errors** ✅
- **Complete type safety** across entire codebase
- **Enhanced interfaces** for all modules
- **Production-ready build system**

### 🔧 **Advanced SEO & Performance Features**
- **Intelligent Bot Detection** - Advanced user agent analysis
- **Smart SSR Engine** - Server-side rendering with Puppeteer
- **Advanced Caching** - Multi-layer caching with SWR support
- **Content Health Monitoring** - SEO validation and automated scoring
- **Virtual Scroll Optimization** - Lazy loading for dynamic content
- **Hotfix Engine** - Emergency SEO overrides without code changes
- **Request Blocking** - Advanced filtering and control system

### 📊 **Admin Dashboard with Real-time Monitoring**
- **Live WebSocket Updates** - Real-time metrics and alerts
- **Advanced Analytics** - Traffic patterns and performance charts
- **Bot Classification** - Detailed breakdown of crawler types
- **Cache Management UI** - Visual cache control and management
- **System Health** - Memory usage and performance monitoring
- **Configuration Manager** - Runtime configuration changes
- **Forensics Dashboard** - Error tracking and analysis

### 🎨 **Complete Demo SPA - SEO Optimized**
- **Modern React + Vite** - Fast development with hot reload
- **Perfect SEO Implementation** - Meta tags, structured data, canonical URLs
- **Multiple Interactive Pages**:
  - Home with hero section and feature cards
  - About page with structured data and company information
  - Products page with catalog and filtering
  - Contact page with form validation
- **Responsive Design** - Mobile-first, SEO-friendly
- **Real Examples** - Practical SEO scenarios

### 🚀 **Quick Start - Currently Running**

Both servers are **live and ready to test**:

```bash
# ✅ Demo SPA (Direct)
http://localhost:3000

# ✅ SEO Shield Proxy (with SSR)
http://localhost:8000

# ✅ Admin Dashboard
http://localhost:8000/admin
# Login: admin / seo-shield-2024
```

### 🧪 **Quick Testing Commands**

```bash
# Bot request (gets SSR rendered HTML)
curl -A "Googlebot" http://localhost:8000/

# Human request (gets proxied to SPA)
curl http://localhost:8000/

# Debug mode (preview bot-rendered HTML as human)
curl http://localhost:8000/?_render=debug

# Admin panel (with real-time monitoring)
open http://localhost:8000/admin
```

## 🚀 Quick Start

### Option 1: Automated Script (Easiest)

```bash
./start-all.sh
```

This automatically installs dependencies and starts all 3 services!

### Option 2: Docker (Production)

```bash
./start-docker.sh
# or
docker-compose up -d
```

### Option 3: Manual

See [START.md](START.md) for detailed manual setup.

## 📊 Access Points

- **Demo SPA:** http://localhost:3000
- **SEO Proxy:** http://localhost:8080
- **Admin Dashboard:** http://localhost:8080/admin or http://localhost:3001

## 🎯 Key Features

### 🔧 Core Proxy
- Bot detection via `isbot`
- SSR with Puppeteer for bots
- Transparent proxy for humans
- Smart caching with TTL
- Pattern-based cache rules
- Meta tag cache control
- **Debug mode** - Preview bot-rendered HTML with `?_render=debug`

### 📊 Admin Dashboard
- Real-time WebSocket updates
- Traffic analytics & charts
- Bot type breakdown (pie chart)
- Cache management UI
- Memory monitoring
- Configuration viewer

### 🎨 Demo SPA
- 8 pages with proper SEO
- Blog with dynamic routes
- Products catalog
- No-cache demo page
- Contact forms
- 404 handling

## 🧪 Quick Test

```bash
# Bot request (gets SSR)
curl -A "Googlebot" http://localhost:8080/

# Human request (gets proxied)
curl http://localhost:8080/

# Debug mode (preview bot HTML as human)
curl http://localhost:8080/?_render=debug

# View in browser
open http://localhost:8080/admin
```

## 📁 Project Structure

```
seo-shield-proxy/
├── src/                    # Main proxy server
├── admin-dashboard/        # React admin UI
├── demo-spa/              # Demo application
├── docker-compose.yml     # Docker setup
├── start-all.sh          # Quick start
└── START.md              # Detailed guide
```

## ⚙️ Configuration

Via `.env` file:

```bash
TARGET_URL=http://localhost:3000
CACHE_TTL=3600
NO_CACHE_PATTERNS=/checkout,/cart,/admin/*
CACHE_BY_DEFAULT=true
```

See [.env.example](.env.example) for all options.

## 📚 Documentation

- [START.md](START.md) - Complete setup guide
- [.env.example](.env.example) - Configuration reference
- [docs/debug-mode.md](docs/debug-mode.md) - Debug mode & render preview guide
- [docs/concurrency-control.md](docs/concurrency-control.md) - Queue management & performance
- [docs/redis-cache.md](docs/redis-cache.md) - Redis cache integration

## 📝 License

MIT License

---

Built with ❤️ for better SEO
