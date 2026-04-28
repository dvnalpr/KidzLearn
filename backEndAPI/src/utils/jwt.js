const jwt = require('jsonwebtoken');
const { loadSecrets } = require('../utils/secretManager');

let jwtSecret;

const initializeSecrets = async () => {
  try {
    const secrets = await loadSecrets();
    jwtSecret = secrets.jwtSecret;
    console.log("Secrets loaded successfully.");
  } catch (error) {
    console.error("Failed to load secrets:", error.message);
  }
};

initializeSecrets();

const generateToken = (payload) => {
  return jwt.sign(payload, jwtSecret, { expiresIn: '1h' });
};

const verifyToken = (token) => {
  return jwt.verify(token, jwtSecret);
};

module.exports = { generateToken, verifyToken };

