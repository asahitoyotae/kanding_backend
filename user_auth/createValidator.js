const jwt = require("jsonwebtoken");

const authorizedToRegister = (req, res, next) => {
  const auth_keys = req.header("auth-key");
  if (!auth_keys) {
    return res.status(403).send("Please Ask Admin for kanding code!");
  }

  if (auth_keys === process.env.CREATE_VALIDATION_KEY) {
    next();
  } else {
    res.status(403).send("Please Ask Admin for kanding code!");
  }
};

const validateEmailMiddleWare = (req, res, next) => {
  const token = req.header("auth-token");
  console.log(token);
  if (!token) {
    return res.status(403).send("Validation Failed");
  }

  jwt.verify(token, process.env.SECRET_VALIDATION_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).send("Validation Failed");
    } else {
      req.user = decoded;
      next();
    }
  });
};

module.exports.authorizedToRegister = authorizedToRegister;
module.exports.validateEmailMiddleWare = validateEmailMiddleWare;
