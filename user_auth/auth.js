const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodeMailer = require("nodemailer");
const { usertokenGenerator } = require("./tokenissuer");
const { createUserValidator, LoginUserValidator } = require("./inputValidator");

const {
  authorizedToRegister,
  validateEmailMiddleWare,
} = require("./createValidator");

router.post("/create", authorizedToRegister, async (req, res) => {
  //validate user input
  const { error } = createUserValidator(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }
  //Find Existing Email
  const emailExist = await User.findOne({ email: req.body.email });
  if (emailExist) {
    return res.status(400).send("Email Already Exist");
  }

  //Find Existing username
  const usernameExist = await User.findOne({ username: req.body.username });
  if (usernameExist) {
    return res
      .status(400)
      .send("Username already exist, please choose another username");
  }

  const transporter = nodeMailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,

    auth: {
      user: "asahitoyotae@gmail.com",
      pass: "c g c b x e e i z p e y i u z a",
    },
  });

  try {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(req.body.password, salt);

    const user = new User({
      username: req.body.username,
      email: req.body.email,
      password: hash,
    });
    const savedUser = await user.save();
    if (!savedUser) {
      return res.status(500).send("network error! user not saved");
    }

    const mq = "MQ";
    const validationToken = jwt.sign(
      { username: req.body.username, id: savedUser.id, email: req.body.email },
      process.env.SECRET_VALIDATION_KEY
    );
    const mailOptions = {
      from: "asahitoyotae@gmail.com",
      to: req.body.email,
      subject: "Email Verifaction for Kanding",
      html: `
        <html>
          <body>
            <div style=" padding: 3rem; width: 50%; margin: 50px auto; border: 1px solid black; border-radius: 15px;">
              <h1 style="text-align: center">Kanding</h1>
              <p style="text-align: center; color: gray; font-size: 1.2rem; font-weight: bold">
                You recieve this email because you are trying to register to
                kanding.com to verify your account please click the button
                bellow
              </p>
              <a
                style="background-color: #4CAF50; color: white; padding: 10px 50px; border: none; border-radius: 4px; text-decoration: none; font-weight: bold; font-size: 2rem; margin: 2rem auto;"
                href=http://localhost:3000/validate/${validationToken}
              >
                Verify
              </a>
              <p style="color: gray; text-align: center;">
                If you did not make this request, simplr ignore this message and
                never click on the verfiy button
              </p>
            </div>
          </body>
        </html>`,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.log(err);
        return res
          .status(500)
          .send("registration not confirmed please try again later");
      } else {
        return res.status(200).send({
          success: true,
          new_user: { email: savedUser.email, username: savedUser.username },
          message: info,
        });
      }
    });
  } catch (error) {
    res.status(400).send({ error: error, message: "not confirmed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(403).send("Access Denied! wrong credentials");
    }
    const toValidate = `${user._id}-${user.username}-${req.body.email}`;
    const validatedToken = bcrypt.compareSync(toValidate, user.is_valid_user);
    if (!validatedToken) {
      return res.status(403).send("Access Denied! Unverfied Account");
    }
    // validate password
    const hash = user.password;
    const isValidPassword = bcrypt.compareSync(req.body.password, hash);
    if (!isValidPassword) {
      return res.status(403).send("Access Denied! wrong credentials");
    }
    const payload = {
      id: user.id,
      username: user.username,
    };

    const access = jwt.sign(payload, process.env.ACCESS_PRIVATE_KEY, {
      expiresIn: "300000",
    });
    const refresh = jwt.sign(payload, process.env.REFRESH_SECRET_KEY, {
      expiresIn: "1d",
    });
    const salt = bcrypt.genSaltSync(10);
    const hashRefresh = bcrypt.hashSync(refresh, salt);
    user.refresh = hashRefresh;
    await user.save();

    return res.send({
      success: true,
      user: { email: user.email, username: user.username },
      tokens: { access: access, refresh: refresh },
      prev_chats: user.prev_chats,
    });
  } catch (error) {
    return res.send("Network  Error! Please try again later");
  }

  //res.status(400).send("error");
});

const refreshTokenValidator = require("./newAccessValidator");
router.post("/newaccess", refreshTokenValidator, async (req, res) => {
  const user = await User.findOne({
    _id: req.user.id,
    username: req.user.username,
  });
  if (!user) {
    return res
      .status(403)
      .send({ error: "you are not allowed to get new access_key" });
  }
  try {
    const newAccessToken = jwt.sign(
      { id: req.user.id, username: req.user.username },
      process.env.ACCESS_PRIVATE_KEY,
      { expiresIn: "300000" }
    );
    return res.send({ success: true, access: newAccessToken });
  } catch (error) {
    return res.status(503).send(error);
  }
});

router.post("/logout", async (req, res) => {
  const access = req.header("auth-token").split(" ")[1];
  if (!access) {
    return res.send({
      error: "error",
      message: "your don't have access to this website",
    });
  }
  jwt.verify(access, process.env.ACCESS_PRIVATE_KEY, async (err, decoded) => {
    if (err)
      return res.status(403).send({
        error: err,
        message: "an error has occured please try again later",
      });
    try {
      const user = await User.findOne({ _id: decoded.id });
      if (!user)
        return res.send({
          error: err,
          message: "an error has occured please try again later",
        });

      user.refresh = null;
      await user.save();
      return res.send({ success: true, message: "successfully logout" });
    } catch (error) {
      return res.status(403).send({ success: false, error: error });
    }
  });
});

router.post("/validate", validateEmailMiddleWare, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.user.id });
    if (!user) {
      return res.status(403).send("invalid action");
    }
    console.log(req.user);
    const salt = bcrypt.genSaltSync(10);
    const userValidation = `${user.id}-${user.username}-${user.email}`;
    const hashedValidation = bcrypt.hashSync(userValidation, salt);
    user.is_valid_user = hashedValidation;
    user.markModified("is_valid_user");
    await user.save();
    return res.status(200).send({ success: true, message: "user validated" });
  } catch (error) {
    return res.status(500).send("Validation Error! Network Error");
  }
});

module.exports = router;
