const jwt = require("jsonwebtoken");
const UserModel = require("../models/userModel"); // adjust path as needed
const { config } = require("../config");

const authenticate = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({
      status: false,
      response_code: 401,
      message: "Access denied. No token provided.",
      data: null,
    });
  }

  try {
    const decoded = jwt.verify(token, config.get("JWT_SECRET"));

    // Find the user and verify token is still valid
    const user = await UserModel.findOneUserModel({
      _id: decoded.id,
      is_deleted: false,
      token,
    });

    if (!user) {
      return res.status(403).json({
        status: false,
        response_code: 403,
        message: "User not found or token is invalid.",
        data: null,
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        status: false,
        response_code: 401,
        message: "Token has expired.",
        data: null,
      });
    }
    return res.status(401).json({
      status: false,
      response_code: 401,
      message: "Invalid or expired token.",
      data: null,
    });
  }
};

module.exports = authenticate;
