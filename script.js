const crypto = require('crypto');

const generateJWTSecret = () => {
  const buf = crypto.randomBytes(32);
  return buf.toString('hex');
};

console.log(generateJWTSecret());
