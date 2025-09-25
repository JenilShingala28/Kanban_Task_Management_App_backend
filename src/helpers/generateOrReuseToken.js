const jwt = require("jsonwebtoken");
const { config } = require("../config");
const UserModel = require("../models/userModel");

const generateOrReuseToken = async (user) => {
  const now = new Date();

  if (user.token && user.token_expires_at && user.token_expires_at > now) {
    return {
      token: user.token,
      token_expires_at: user.token_expires_at,
    };
  }

  const expiresIn = config.get("JWT_EXPIRES_IN");
  const token = jwt.sign(
    { id: user._id, role: user.role?.name },
    config.get("JWT_SECRET"),
    {
      expiresIn,
    }
  );

  const decoded = jwt.decode(token);
  const token_expires_at = new Date(decoded.exp * 1000);

  await UserModel.updateUserModel(
    { _id: user._id },
    {
      token,
      token_expires_at,
    }
  );

  return { token, token_expires_at };
};

module.exports = { generateOrReuseToken };
