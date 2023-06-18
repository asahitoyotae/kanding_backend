const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

module.exports = async function (req, res, next) {
  const refresh = req.header("auth-refresh");

  if (!refresh) {
    return res
      .status(403)
      .send({ error: "error", message: "access denied! no token provided" });
  }

  jwt.verify(refresh, process.env.REFRESH_SECRET_KEY, async (err, decoded) => {
    if (err) {
      return res.status(403).send(err);
    } else {
      try {
        const user = await User.findOne({ _id: decoded.id });
        if (!user)
          return res.status(403).send({ error: "no valid user found" });
        const verified = bcrypt.compareSync(refresh, user.refresh);
        if (verified) {
          req.user = decoded;
          next();
        } else {
          return res.status(403).send({
            error: "error",
            message: "access denied token is not yours",
          });
        }
      } catch (error) {
        return res
          .status(403)
          .send({ error: "error", message: "network error" });
      }
    }
  });
};
