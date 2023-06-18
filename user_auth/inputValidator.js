const joi = require("joi");

const createUserValidator = (data) => {
  const schema = joi.object({
    username: joi.string().max(100).required(),
    email: joi.string().email().max(100).required(),
    password: joi.string().min(12).max(100).required(),
  });

  return schema.validate(data);
};
const LoginUserValidator = (data) => {
  const schema = joi.object({
    email: joi.string().email().max(100).required(),
    password: joi.string().min(12).max(100).required(),
  });

  return schema.validate(data);
};

module.exports.createUserValidator = createUserValidator;
module.exports.LoginUserValidator = LoginUserValidator;
