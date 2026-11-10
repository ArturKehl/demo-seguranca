const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const securityHeaders = helmet({ contentSecurityPolicy: false });
const apiLimiter = rateLimit({ windowMs: 60000, max: 100 });
const loginLimiter = rateLimit({ windowMs: 900000, max: 5, skipSuccessfulRequests: true, message: { erro: "Muitas tentativas" } });
module.exports = { securityHeaders, apiLimiter, loginLimiter };
