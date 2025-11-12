/**
 * LAYER 1: FIREWALL - DDoS Protection, IP Blocking, Advanced Rate Limiting
 * 
 * This is the first line of defense in our 4-layer security system.
 * It protects against:
 * - DDoS attacks
 * - Brute force attempts
 * - IP-based threats
 * - Request flooding
 * - Suspicious patterns
 */

const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

// IP blacklist (in production, use Redis or database)
const blacklistedIPs = new Set();
const suspiciousIPs = new Map(); // IP -> { count, firstSeen, lastSeen }

// Attack pattern detection
const attackPatterns = {
  sqlInjection: /('|(\-\-)|(;)|(\|\|)|(\*)|(<)|(>)|(\^)|(\[)|(\])|(\{)|(\})|(%)|(\$))/i,
  xss: /(<script[^>]*>.*?<\/script>)|(<iframe)|(<object)|(<embed)|(javascript:)|(onerror=)|(onload=)/gi,
  pathTraversal: /(\.\.[\\\/])|(%2e%2e[\\\/])/gi,
  commandInjection: /(;|\||&|`|\$\(|\$\{)/g
};

/**
 * Main firewall middleware
 */
const firewall = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const timestamp = Date.now();

  // 1. Check IP blacklist
  if (blacklistedIPs.has(clientIP)) {
    console.log(`[FIREWALL] Blocked blacklisted IP: ${clientIP}`);
    return res.status(403).json({ 
      message: 'Access denied',
      code: 'IP_BLACKLISTED'
    });
  }

  // 2. Track suspicious IPs
  if (!suspiciousIPs.has(clientIP)) {
    suspiciousIPs.set(clientIP, {
      count: 0,
      firstSeen: timestamp,
      lastSeen: timestamp,
      violations: []
    });
  }

  const ipData = suspiciousIPs.get(clientIP);
  ipData.count++;
  ipData.lastSeen = timestamp;

  // 3. Detect attack patterns in URL and body
  const urlToCheck = req.url + JSON.stringify(req.body || {}) + JSON.stringify(req.query || {});
  
  for (const [attackType, pattern] of Object.entries(attackPatterns)) {
    if (pattern.test(urlToCheck)) {
      ipData.violations.push({ type: attackType, timestamp });
      console.log(`[FIREWALL] ${attackType} detected from IP: ${clientIP}`);
      
      // Auto-block after 3 violations
      if (ipData.violations.length >= 3) {
        blacklistedIPs.add(clientIP);
        console.log(`[FIREWALL] IP auto-blacklisted: ${clientIP}`);
        return res.status(403).json({ 
          message: 'Security violation detected',
          code: 'AUTO_BLACKLISTED'
        });
      }
      
      return res.status(400).json({ 
        message: 'Invalid request detected',
        code: 'SECURITY_VIOLATION'
      });
    }
  }

  // 4. Check request frequency (DDoS detection)
  const requestWindow = 10000; // 10 seconds
  const maxRequests = 100; // Max 100 requests per 10 seconds per IP
  
  if (ipData.count > maxRequests && (timestamp - ipData.firstSeen) < requestWindow) {
    blacklistedIPs.add(clientIP);
    console.log(`[FIREWALL] DDoS detected and blocked: ${clientIP}`);
    return res.status(429).json({ 
      message: 'Too many requests',
      code: 'DDOS_DETECTED'
    });
  }

  // 5. Reset counter after time window
  if (timestamp - ipData.firstSeen > requestWindow) {
    ipData.count = 1;
    ipData.firstSeen = timestamp;
    ipData.violations = ipData.violations.filter(v => timestamp - v.timestamp < 3600000); // Keep last hour
  }

  // 6. Check for common attack headers
  const suspiciousHeaders = ['x-forwarded-for', 'x-real-ip', 'x-originating-ip'];
  for (const header of suspiciousHeaders) {
    if (req.headers[header]) {
      const headerValue = req.headers[header];
      if (headerValue.includes(',') || headerValue.split('.').length !== 4) {
        console.log(`[FIREWALL] Suspicious header detected: ${header} = ${headerValue}`);
        // Log but don't block (could be legitimate proxy)
      }
    }
  }

  next();
};

/**
 * Advanced rate limiter - Layer 1B
 */
const advancedRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    message: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests
  skip: (req, res) => res.statusCode < 400,
  // Custom key generator
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress;
  },
  // Handler for when limit is reached
  handler: (req, res) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    suspiciousIPs.get(clientIP)?.violations.push({ 
      type: 'rate_limit_exceeded', 
      timestamp: Date.now() 
    });
    res.status(429).json({
      message: 'Rate limit exceeded',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

/**
 * Speed limiter - Slow down repeated requests
 */
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per 15 minutes at full speed
  delayMs: 500, // Add 500ms delay per request after delayAfter
  maxDelayMs: 20000, // Max delay of 20 seconds
});

/**
 * Strict rate limiter for authentication endpoints
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 login attempts per 15 minutes
  skipSuccessfulRequests: true,
  message: {
    message: 'Too many login attempts, please try again later.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  }
});

/**
 * API key validation middleware
 */
const validateAPIKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ 
      message: 'API key required',
      code: 'API_KEY_MISSING'
    });
  }

  // In production, validate against database
  // For now, check environment variable
  if (apiKey !== process.env.API_KEY) {
    const clientIP = req.ip || req.connection.remoteAddress;
    console.log(`[FIREWALL] Invalid API key from IP: ${clientIP}`);
    return res.status(403).json({ 
      message: 'Invalid API key',
      code: 'API_KEY_INVALID'
    });
  }

  next();
};

/**
 * CORS protection with whitelist
 */
const corsWhitelist = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:5173'
];

const corsProtection = (req, res, next) => {
  const origin = req.headers.origin;
  
  if (origin && !corsWhitelist.includes(origin)) {
    console.log(`[FIREWALL] CORS blocked from origin: ${origin}`);
    return res.status(403).json({ 
      message: 'CORS policy violation',
      code: 'CORS_BLOCKED'
    });
  }

  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-API-Key');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
};

/**
 * Admin function to manually blacklist IP
 */
const blacklistIP = (ip) => {
  blacklistedIPs.add(ip);
  console.log(`[FIREWALL] Manually blacklisted IP: ${ip}`);
};

/**
 * Admin function to whitelist/unblock IP
 */
const whitelistIP = (ip) => {
  blacklistedIPs.delete(ip);
  suspiciousIPs.delete(ip);
  console.log(`[FIREWALL] Whitelisted IP: ${ip}`);
};

/**
 * Get firewall statistics
 */
const getFirewallStats = () => {
  return {
    blacklistedIPs: Array.from(blacklistedIPs),
    suspiciousIPCount: suspiciousIPs.size,
    totalViolations: Array.from(suspiciousIPs.values())
      .reduce((acc, data) => acc + data.violations.length, 0)
  };
};

module.exports = {
  firewall,
  advancedRateLimiter,
  speedLimiter,
  authRateLimiter,
  validateAPIKey,
  corsProtection,
  blacklistIP,
  whitelistIP,
  getFirewallStats
};
