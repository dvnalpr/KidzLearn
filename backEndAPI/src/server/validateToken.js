const jwt = require('../utils/jwt');

const validateToken = (request, h) => {
  const token = request.headers.authorization?.split(' ')[1];

  if (!token) {
    return h.response({ error: 'Token missing' }).code(401).takeover();
  }

  try {
    const decoded = jwt.verifyToken(token);
    request.user = decoded; // Attach user info to the request
    return h.continue;
  } catch (error) {
    return h.response({ error: 'Invalid token' }).code(401).takeover();
  }
};

module.exports = validateToken;
