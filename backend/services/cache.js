const NodeCache = require('node-cache');

// Shared in-memory cache, 5-min default TTL
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

module.exports = cache;
