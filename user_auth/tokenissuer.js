const jwt = require("jsonwebtoken");

const usertokenGenerator = (payload, signOptions) => {
  return jwt.sign(payload, process.env.PRIVATE_KEY);
};

const tokenVerifier = (token, verifyOptions) => {
  try {
    return jwt.verify(token, process.env.PRIVATE_KEY);
  } catch (error) {
    return false;
  }
};

module.exports.usertokenGenerator = usertokenGenerator;
module.exports.tokenVerifier = tokenVerifier;
