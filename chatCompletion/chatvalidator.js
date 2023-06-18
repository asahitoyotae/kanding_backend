const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async function (req, res, next) {
  const token = req.header("auth-token");
  if (!token) {
    return res.status(403).send("no token provided");
  }

  jwt.verify(token, process.env.ACCESS_PRIVATE_KEY, async (err, dec) => {
    if (err) {
      console.log("err", err);
      return res.status(403).send(err);
    } else {
      const user = await User.findOne({ _id: dec.id });
      if (!user) {
        console.log("no user");
        return res.status(403).send("invalid token");
      }
      req.user = dec;
      next();
    }
  });
};
