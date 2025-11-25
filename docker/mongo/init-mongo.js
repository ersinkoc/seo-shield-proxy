// MongoDB Initialization Script for SEO Shield Proxy
// This script runs when MongoDB starts for the first time

// Switch to the SEO Shield database
db = db.getSiblingDB('seo_shield_proxy');

// Create collections and indexes for traffic metrics
db.createCollection('traffic_metrics', {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["timestamp", "method", "path", "ip", "userAgent", "isBot"],
      properties: {
        timestamp: { bsonType: "long" },
        method: { bsonType: "string" },
        path: { bsonType: "string" },
        ip: { bsonType: "string" },
        userAgent: { bsonType: "string" },
        referer: { bsonType: "string" },
        isBot: { bsonType: "bool" },
        botType: { bsonType: "string" },
        botConfidence: { bsonType: "double" },
        botRulesMatched: { bsonType: "array" },
        statusCode: { bsonType: "int" },
        responseTime: { bsonType: "long" },
        responseSize: { bsonType: "long" }
      }
    }
  }
});

// Create indexes for traffic metrics
db.traffic_metrics.createIndex({ "timestamp": -1 });
db.traffic_metrics.createIndex({ "path": 1, "timestamp": -1 });
db.traffic_metrics.createIndex({ "ip": 1, "timestamp": -1 });
db.traffic_metrics.createIndex({ "isBot": 1, "timestamp": -1 });
db.traffic_metrics.createIndex({ "botType": 1, "timestamp": -1 });

// Create TTL index to automatically delete old traffic data (30 days)
db.traffic_metrics.createIndex({ "timestamp": 1 }, { expireAfterSeconds: 2592000 });

// Create collections and indexes for configurations
db.createCollection('configurations', {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["key", "value", "createdAt"],
      properties: {
        key: { bsonType: "string" },
        value: { bsonType: "object" },
        description: { bsonType: "string" },
        isActive: { bsonType: "bool" },
        version: { bsonType: "int" },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" },
        userId: { bsonType: "string" }
      }
    }
  }
});

db.configurations.createIndex({ "key": 1 }, { unique: true });
db.configurations.createIndex({ "createdAt": -1 });
db.configurations.createIndex({ "isActive": 1, "updatedAt": -1 });

// Create collections and indexes for audit logs
db.createCollection('audit_logs', {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["action", "timestamp", "category", "severity", "userId"],
      properties: {
        action: { bsonType: "string" },
        details: { bsonType: "string" },
        category: { bsonType: "string" },
        severity: { bsonType: "string" },
        userId: { bsonType: "string" },
        ipAddress: { bsonType: "string" },
        userAgent: { bsonType: "string" },
        sessionId: { bsonType: "string" },
        timestamp: { bsonType: "date" }
      }
    }
  }
});

db.audit_logs.createIndex({ "timestamp": -1 });
db.audit_logs.createIndex({ "action": 1, "timestamp": -1 });
db.audit_logs.createIndex({ "userId": 1, "timestamp": -1 });
db.audit_logs.createIndex({ "category": 1, "timestamp": -1 });

// Create TTL index to automatically delete old audit logs (90 days)
db.audit_logs.createIndex({ "timestamp": 1 }, { expireAfterSeconds: 7776000 });

// Create collections and indexes for error logs
db.createCollection('error_logs', {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["message", "timestamp", "category", "severity"],
      properties: {
        message: { bsonType: "string" },
        stack: { bsonType: "string" },
        category: { bsonType: "string" },
        severity: { bsonType: "string" },
        url: { bsonType: "string" },
        userAgent: { bsonType: "string" },
        ipAddress: { bsonType: "string" },
        context: { bsonType: "object" },
        timestamp: { bsonType: "date" }
      }
    }
  }
});

db.error_logs.createIndex({ "timestamp": -1 });
db.error_logs.createIndex({ "severity": 1, "timestamp": -1 });
db.error_logs.createIndex({ "category": 1, "timestamp": -1 });
db.error_logs.createIndex({ "url": 1, "timestamp": -1 });

// Create TTL index to automatically delete old error logs (30 days)
db.error_logs.createIndex({ "timestamp": 1 }, { expireAfterSeconds: 2592000 });

// Create collections for bot detection rules
db.createCollection('bot_rules', {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["id", "name", "enabled", "pattern", "type", "action", "priority", "createdAt"],
      properties: {
        id: { bsonType: "string" },
        name: { bsonType: "string" },
        enabled: { bsonType: "bool" },
        pattern: { bsonType: "string" },
        type: { bsonType: "string" },
        action: { bsonType: "string" },
        priority: { bsonType: "int" },
        botType: { bsonType: "string" },
        description: { bsonType: "string" },
        tags: { bsonType: "array" },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" },
        createdUser: { bsonType: "string" }
      }
    }
  }
});

db.bot_rules.createIndex({ "id": 1 }, { unique: true });
db.bot_rules.createIndex({ "enabled": 1, "priority": -1 });
db.bot_rules.createIndex({ "type": 1, "enabled": 1 });

// Create collections for IP reputation
db.createCollection('ip_reputation', {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["ip", "reputation", "category", "lastSeen", "requestCount", "blockedCount"],
      properties: {
        ip: { bsonType: "string" },
        reputation: { bsonType: "string" },
        category: { bsonType: "string" },
        lastSeen: { bsonType: "date" },
        requestCount: { bsonType: "long" },
        blockedCount: { bsonType: "long" },
        source: { bsonType: "string" },
        metadata: { bsonType: "object" }
      }
    }
  }
});

db.ip_reputation.createIndex({ "ip": 1 }, { unique: true });
db.ip_reputation.createIndex({ "reputation": 1, "lastSeen": -1 });
db.ip_reputation.createIndex({ "category": 1, "lastSeen": -1 });

// Create TTL index to automatically delete old IP reputation data (7 days)
db.ip_reputation.createIndex({ "lastSeen": 1 }, { expireAfterSeconds: 604800 });

// Insert default configuration
db.configurations.insertOne({
  key: "runtime_config",
  value: {
    seoProtocols: {
      contentHealthCheck: {
        enabled: true,
        criticalSelectors: [
          { selector: "title", required: true, description: "Page title is required" },
          { selector: "meta[name='description']", required: true, description: "Meta description is required" },
          { selector: "h1", required: true, description: "H1 tag is required" },
          { selector: "body", required: false, description: "Body content should exist" }
        ],
        minBodyLength: 100,
        minTitleLength: 30,
        metaDescriptionRequired: true,
        h1Required: true,
        failOnMissingCritical: false
      },
      virtualScroll: {
        enabled: true,
        scrollSteps: 10,
        scrollInterval: 1000,
        maxScrollHeight: 10000,
        waitAfterScroll: 500,
        scrollSelectors: ["main", ".content", "#app"],
        infiniteScrollSelectors: [".load-more", ".infinite-scroll"],
        lazyImageSelectors: ["img[data-src]", "img[loading='lazy']"],
        triggerIntersectionObserver: true,
        maxScrollTime: 30000,
        scrollSettleTime: 2000
      },
      etagStrategy: {
        enabled: true,
        hashAlgorithm: "md5",
        enable304Responses: true,
        checkContentChanges: true,
        ignoredElements: ["script", "style"],
        significantChanges: true
      },
      clusterMode: {
        enabled: false,
        useRedisQueue: true,
        maxWorkers: 4,
        jobTimeout: 60000,
        retryAttempts: 3,
        retryDelay: 5000,
        browser: {
          headless: true,
          args: ["--no-sandbox", "--disable-setuid-sandbox"]
        }
      },
      shadowDom: {
        enabled: false,
        deepSerialization: true,
        includeShadowContent: true,
        flattenShadowTrees: false,
        customElements: [],
        preserveShadowBoundaries: true,
        extractCSSVariables: true,
        extractComputedStyles: false
      },
      circuitBreaker: {
        enabled: true,
        errorThreshold: 5,
        resetTimeout: 30000,
        monitoringPeriod: 60000,
        fallbackToStale: true,
        halfOpenMaxCalls: 3,
        failureThreshold: 5,
        successThreshold: 2,
        timeoutThreshold: 30000
      }
    },
    cacheWarmer: {
      sitemapUrl: "",
      warmupSchedule: "0 2 * * *",
      maxConcurrentWarmups: 3
    },
    snapshotService: {
      diffThreshold: 0.1
    },
    userAgent: "Mozilla/5.0 (compatible; SEOShieldProxy/1.0; +https://github.com/seoshield/seo-shield-proxy)"
  },
  description: "Default runtime configuration for SEO Shield Proxy",
  isActive: true,
  version: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  userId: "system"
});

// Insert default bot detection rules
const defaultBotRules = [
  {
    id: "googlebot-search",
    name: "Googlebot Search",
    enabled: true,
    pattern: "googlebot",
    type: "userAgent",
    action: "render",
    priority: 100,
    botType: "search_engine",
    description: "Google search engine crawler",
    tags: ["google", "search", "crawler"],
    createdAt: new Date(),
    updatedAt: new Date(),
    createdUser: "system"
  },
  {
    id: "bingbot-search",
    name: "Bingbot",
    enabled: true,
    pattern: "bingbot",
    type: "userAgent",
    action: "render",
    priority: 100,
    botType: "search_engine",
    description: "Microsoft Bing search engine crawler",
    tags: ["bing", "search", "crawler"],
    createdAt: new Date(),
    updatedAt: new Date(),
    createdUser: "system"
  },
  {
    id: "facebook-external",
    name: "Facebook External Hit",
    enabled: true,
    pattern: "facebookexternalhit",
    type: "userAgent",
    action: "render",
    priority: 90,
    botType: "social",
    description: "Facebook crawler for link previews",
    tags: ["facebook", "social", "preview"],
    createdAt: new Date(),
    updatedAt: new Date(),
    createdUser: "system"
  },
  {
    id: "twitter-bot",
    name: "Twitter Bot",
    enabled: true,
    pattern: "twitterbot",
    type: "userAgent",
    action: "render",
    priority: 90,
    botType: "social",
    description: "Twitter crawler for link previews",
    tags: ["twitter", "social", "preview"],
    createdAt: new Date(),
    updatedAt: new Date(),
    createdUser: "system"
  }
];

db.bot_rules.insertMany(defaultBotRules);

// Create a read-only user for the application
db.createUser({
  user: "seo_shield_user",
  pwd: "seo_shield_password",
  roles: [
    {
      role: "readWrite",
      db: "seo_shield_proxy"
    }
  ]
});

print("MongoDB initialization completed successfully!");
print("Collections created with indexes and default data.");
print("User 'seo_shield_user' created with readWrite permissions.");