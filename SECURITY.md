# MonDefense Security Implementation

This document outlines the comprehensive security measures implemented in the MonDefense backend to protect against various attack vectors and ensure robust defense against automated traffic and malicious activities.

## 🛡️ Security Features Overview

### 1. Request Fingerprinting & Bot Detection
- **File**: `backend/middleware/fingerprinting.js`
- **Purpose**: Detect and block automated traffic, bots, and suspicious requests
- **Features**:
  - Browser fingerprinting based on headers, timing, and patterns
  - Behavioral analysis for bot detection
  - Suspicious pattern recognition
  - Automated blocking of high-risk requests

### 2. CSRF Protection
- **Files**: `backend/middleware/csrf.js`, `lib/csrf.ts`
- **Purpose**: Prevent Cross-Site Request Forgery attacks
- **Features**:
  - Dynamic CSRF token generation
  - Token validation middleware
  - Frontend CSRF utility with React hooks
  - Wallet-specific CSRF protection

### 3. Content Security Policy (CSP)
- **File**: `backend/middleware/csp.js`
- **Purpose**: Mitigate XSS attacks and control resource loading
- **Features**:
  - Comprehensive CSP headers
  - Environment-specific policies (dev/prod)
  - XSS protection middleware
  - CSP violation reporting

### 4. Security Monitoring & Analytics
- **File**: `backend/middleware/monitoring.js`
- **Purpose**: Real-time security monitoring and threat detection
- **Features**:
  - Request metrics collection
  - Anomaly detection
  - Security alerts system
  - Redis-based data storage

### 5. Redis Clustering & Session Management
- **File**: `backend/config/redis-cluster.js`
- **Purpose**: Distributed caching and secure session management
- **Features**:
  - Redis cluster support
  - Distributed session storage
  - Rate limiting with Redis
  - Pub/Sub messaging

### 6. Load Balancing & Horizontal Scaling
- **Files**: `backend/config/load-balancer.js`, `backend/cluster.js`
- **Purpose**: Handle high traffic loads and ensure availability
- **Features**:
  - Multi-worker cluster setup
  - Round-robin load balancing
  - Health checks and auto-recovery
  - Sticky sessions support

## 🚀 Deployment Options

### Single Instance (Development)
```bash
# Start single server instance
npm start

# Development with auto-reload
npm run dev
```

### Clustered Deployment (Production)
```bash
# Start load-balanced cluster
npm run cluster

# Development cluster with auto-reload
npm run dev:cluster
```

## 🔧 Configuration

### Environment Variables

```env
# Server Configuration
PORT=3001
NODE_ENV=production
WORKERS=4

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Redis Cluster (Production)
REDIS_HOST_1=redis-node-1
REDIS_PORT_1=7000
REDIS_HOST_2=redis-node-2
REDIS_PORT_2=7001
REDIS_HOST_3=redis-node-3
REDIS_PORT_3=7002

# Security
SESSION_SECRET=your-super-secret-session-key
CSRF_SECRET=your-csrf-secret-key

# Monitoring
ALERT_WEBHOOK_URL=https://your-alert-webhook.com
METRICS_RETENTION_HOURS=24
```

### Security Headers Applied

```http
# Content Security Policy
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'...

# XSS Protection
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block

# Additional Security
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

## 📊 Monitoring Endpoints

### Health Checks
- `GET /health` - Server health status
- `GET /api/redis/health` - Redis cluster health
- `GET /lb/health` - Load balancer health (cluster mode)

### Security Metrics
- `GET /api/security/metrics` - Security analytics
- `GET /api/security/alerts` - Security alerts
- `GET /lb/stats` - Load balancer statistics (cluster mode)

### CSP Violation Reporting
- `POST /api/security/csp-violation` - CSP violation reports

## 🔍 Security Monitoring

### Metrics Collected
- Request rates and patterns
- Failed authentication attempts
- Suspicious IP addresses
- Bot detection scores
- CSRF token validation failures
- CSP violations

### Alert Triggers
- High request rates (>1000 req/min)
- Multiple failed authentications
- Suspicious bot activity
- CSP violations
- Redis connection issues
- Worker process failures

## 🛠️ Rate Limiting

### API Rate Limits
- **General API**: 100 requests per 15 minutes
- **Authentication**: 10 requests per 5 minutes
- **Wallet Operations**: Custom limits per endpoint

### Implementation
```javascript
// Redis-based rate limiting
app.use('/api/', createRateLimiter(15 * 60 * 1000, 100));
app.use('/auth/', createRateLimiter(5 * 60 * 1000, 10));
```

## 🔐 Session Security

### Session Configuration
```javascript
{
  store: RedisStore, // Distributed session storage
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true, // HTTPS only in production
    httpOnly: true, // Prevent XSS
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict' // CSRF protection
  }
}
```

## 🚨 Incident Response

### Automated Responses
1. **High Bot Activity**: Temporary IP blocking
2. **CSRF Attacks**: Token regeneration and logging
3. **Rate Limit Exceeded**: Request throttling
4. **CSP Violations**: Logging and alerting
5. **Worker Failures**: Automatic restart

### Manual Investigation
1. Check security metrics: `GET /api/security/metrics`
2. Review alerts: `GET /api/security/alerts`
3. Analyze Redis logs for patterns
4. Review CSP violation reports

## 📈 Performance Impact

### Middleware Overhead
- **Fingerprinting**: ~2-5ms per request
- **CSRF Validation**: ~1-2ms per request
- **CSP Headers**: ~0.5ms per request
- **Monitoring**: ~1-3ms per request
- **Total Overhead**: ~5-11ms per request

### Memory Usage
- **Single Instance**: ~50-100MB base + request data
- **Clustered**: ~50-100MB per worker
- **Redis**: ~10-50MB for session/cache data

## 🔄 Maintenance

### Regular Tasks
1. **Monitor Redis Memory**: Check memory usage and cleanup
2. **Review Security Logs**: Analyze patterns and threats
3. **Update Dependencies**: Keep security packages current
4. **Test Failover**: Verify cluster recovery mechanisms
5. **Backup Configuration**: Store security configurations

### Health Monitoring
```bash
# Check all health endpoints
curl http://localhost:3001/health
curl http://localhost:3001/api/redis/health
curl http://localhost:3001/lb/health  # Cluster mode only
```

## 🔧 Troubleshooting

### Common Issues

#### Redis Connection Failed
```bash
# Check Redis status
redis-cli ping

# Verify configuration
echo $REDIS_HOST $REDIS_PORT
```

#### CSRF Token Errors
```javascript
// Frontend: Ensure CSRF token is included
const { csrfToken } = useCSRF();

// Backend: Check middleware order
app.use(generateCSRFMiddleware);
app.use('/api/protected', validateCSRFMiddleware);
```

#### High Memory Usage
```bash
# Monitor Redis memory
redis-cli info memory

# Clear old sessions
redis-cli FLUSHDB
```

#### Worker Process Issues
```bash
# Check worker status
curl http://localhost:3001/lb/stats

# Restart cluster
npm run cluster
```

## 📚 Additional Resources

- [OWASP Security Guidelines](https://owasp.org/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Redis Security](https://redis.io/topics/security)
- [Express.js Security](https://expressjs.com/en/advanced/best-practice-security.html)

---

**Note**: This security implementation provides comprehensive protection against common web application vulnerabilities. Regular security audits and updates are recommended to maintain optimal protection levels.