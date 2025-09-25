const UserModel = require("../models/userModel");
const Joi = require("joi");
const { formatErrorMessage } = require("../helpers/formatErrorMessage");
const bcrypt = require("bcrypt");
const { generateOrReuseToken } = require("../helpers/generateOrReuseToken");
const { getAssetUrl } = require("../helpers/getAssetUrl");
const { config } = require("../config/index");

const registerUser = async (req, res) => {
  const schema = Joi.object({
    first_name: Joi.string().trim().min(2).max(20).required(),
    last_name: Joi.string().trim().min(2).max(20).required(),
    mobile: Joi.string()
      .pattern(/^[0-9]{10}$/)
      .messages({
        "string.pattern.base": "Mobile number must be 10 digits",
      }),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(32).required(),
    role: Joi.string().hex().length(24).optional(),
    profile_picture: Joi.string().optional(),
  });

  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      status: false,
      response_code: 400,
      message: formatErrorMessage(error.details[0].message),
      data: null,
    });
  }

  try {
    let {
      first_name,
      last_name,
      mobile,
      email,
      password,
      role,
      profile_picture,
    } = req.body;

    // Default role -> User
    if (!role) {
      role = config.get("DEFAULT_USER_ROLE_ID");
    }

    const existingUser = await UserModel.findOneUserModel({ email });
    if (existingUser) {
      return res.status(409).json({
        status: false,
        response_code: 409,
        message: "Email already exists",
        data: null,
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await UserModel.createUserModel({
      first_name,
      last_name,
      email,
      mobile,
      password: hashedPassword,
      profile_picture,
      role,
    });

    const populatedUser = await UserModel.findOneUserModel({ _id: user._id });

    const responseData = {
      id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      mobile: user.mobile,
      role_id: populatedUser.role?._id,
      role: populatedUser.role?.name || null,
      profile_picture: user.profile_picture
        ? getAssetUrl(user.profile_picture)
        : null,
    };

    return res.status(201).json({
      status: true,
      response_code: 201,
      message: "User created successfully",
      data: responseData,
    });
  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.email) {
      return res.status(409).json({
        status: false,
        response_code: 409,
        message: "Email already exists",
        data: null,
      });
    }
    return res.status(500).json({
      status: false,
      response_code: 500,
      message: err.message,
      data: null,
    });
  }
};

const login = async (req, res) => {
  const loginValidation = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(32).required(),
  });

  const { error } = loginValidation.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      status: false,
      response_code: 400,
      message: formatErrorMessage(error.details[0].message),
      data: null,
    });
  }

  try {
    const { email, password } = req.body;
    const user = await UserModel.findOneUserModel({ email });

    if (!user) {
      return res.status(404).json({
        status: false,
        response_code: 404,
        message: "Invalid email or User not found",
        data: null,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        status: false,
        response_code: 401,
        message: "Invalid password",
        data: null,
      });
    }

    const { token } = await generateOrReuseToken(user);

    return res.status(200).json({
      status: true,
      response_code: 200,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user._id,
          first_name: user.first_name,
          last_name: user.last_name,
          mobile: user.mobile,
          email: user.email,
          role_id: user.role?.id || null,
          role: user.role?.name || null,
          profile_picture: user.profile_picture
            ? getAssetUrl(user.profile_picture)
            : null,
        },
      },
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      response_code: 500,
      message: err.message,
      data: null,
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role?.name !== "Admin") {
      filter = { _id: req.user._id };
    }
    const users = await UserModel.findAllUserModel(filter);

    if (!users || users.length === 0) {
      return res.status(404).json({
        status: false,
        response_code: 404,
        message: "No users found",
        data: [],
      });
    }

    const transformedData = users.map((item) => ({
      id: item._id,
      first_name: item.first_name,
      last_name: item.last_name,
      mobile: item.mobile,
      email: item.email,
      role_id: item.role?.id || null,
      role: item.role?.name || null,
      profile_picture: item.profile_picture
        ? getAssetUrl(item.profile_picture)
        : null,
    }));

    return res.status(200).json({
      status: true,
      response_code: 200,
      message: "Users fetched successfully",
      data: transformedData,
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      response_code: 500,
      message: err.message,
      data: null,
    });
  }
};

const getUserById = async (req, res) => {
  const schema = Joi.object({
    id: Joi.string().hex().length(24).required(),
  });

  const { error } = schema.validate(req.params, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      status: false,
      response_code: 400,
      message: formatErrorMessage(error.details[0].message),
      data: [],
    });
  }

  try {
    const user = await UserModel.findOneUserModel({ _id: req.params.id });

    if (!user) {
      return res.status(404).json({
        status: false,
        response_code: 404,
        message: "User not found",
        data: null,
      });
    }

    // ✅ Restrict access for non-admin
    if (
      req.user.role?.name !== "Admin" &&
      req.params.id !== req.user._id.toString()
    ) {
      return res.status(403).json({
        status: false,
        response_code: 403,
        message: "Forbidden: You can only access your own profile",
        data: null,
      });
    }

    const transformedData = {
      id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      mobile: user.mobile,
      role_id: user.role?._id || null,
      role: user.role?.name || null,
      profile_picture: user.profile_picture
        ? getAssetUrl(user.profile_picture)
        : null,
    };

    return res.status(200).json({
      status: true,
      response_code: 200,
      message: "User fetched successfully",
      data: transformedData,
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      response_code: 500,
      message: err.message,
      data: null,
    });
  }
};

const updateUser = async (req, res) => {
  const updateSchema = Joi.object({
    id: Joi.string().hex().length(24).required(),
    first_name: Joi.string().trim().min(2).max(20).optional(),
    last_name: Joi.string().trim().min(2).max(20).optional(),
    mobile: Joi.string()
      .pattern(/^[0-9]{10}$/)
      .messages({
        "string.pattern.base": "Mobile number must be 10 digits",
      })
      .optional(),
    email: Joi.string().email().optional(),
    password: Joi.string().min(6).max(32).optional(),
    role: Joi.string().hex().length(24).optional(),
    profile_picture: Joi.string().optional(),
  })
    .min(2)
    .unknown(false)
    .messages({
      "object.min":
        "At least one updatable field (besides id) must be provided",
    });

  const { error } = updateSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      status: false,
      response_code: 400,
      message: formatErrorMessage(error.details[0].message),
      data: [],
    });
  }

  const { id, first_name, last_name, mobile, email, profile_picture, role } =
    req.body;

  try {
    const user = await UserModel.findOneUserModel({
      _id: id,
      is_deleted: false,
    });
    if (!user) {
      return res.status(404).json({
        status: false,
        response_code: 404,
        message: "User not found or has been deleted",
        data: [],
      });
    }

    if (req.user.role?.name !== "Admin" && req.user._id.toString() !== id) {
      return res.status(403).json({
        status: false,
        response_code: 403,
        message: "You are not authorized to update this user",
        data: null,
      });
    }

    let updateFields = {
      first_name,
      last_name,
      email,
      mobile,
      profile_picture,
    };

    // ✅ Rule 2: Only Admin can update role
    if (req.user.role?.name === "Admin" && role) {
      updateFields.role = role;
    }

    if (
      !updateFields.profile_picture ||
      updateFields.profile_picture === getAssetUrl(user.profile_picture)
    ) {
      delete updateFields.profile_picture;
    }

    const updatedUser = await UserModel.updateUserModel(
      { _id: id },
      updateFields
    );

    const responseData = {
      id: updatedUser._id,
      first_name: updatedUser.first_name,
      last_name: updatedUser.last_name,
      mobile: updatedUser.mobile,
      email: updatedUser.email,
      role_id: updatedUser.role?._id,
      role: updatedUser.role?.name || null,
      profile_picture: updatedUser.profile_picture
        ? getAssetUrl(updatedUser.profile_picture)
        : null,
    };

    return res.status(200).json({
      status: true,
      response_code: 200,
      message: "User updated successfully",
      data: responseData,
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      response_code: 500,
      message: err.message,
      data: null,
    });
  }
};

const deleteUser = async (req, res) => {
  const schema = Joi.object({
    id: Joi.string().hex().length(24).required(),
  });

  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      status: false,
      response_code: 400,
      message: formatErrorMessage(error.details[0].message),
      data: [],
    });
  }

  const { id } = req.body;
  const userFilter = { _id: id, is_deleted: false };

  try {
    const user = await UserModel.findOneUserModel(userFilter);
    if (!user) {
      return res.status(404).json({
        status: false,
        response_code: 404,
        message: "User not found or already deleted",
        data: null,
      });
    }

    if (req.user.role?.name !== "Admin" && req.user._id.toString() !== id) {
      return res.status(403).json({
        status: false,
        response_code: 403,
        message: "You are not authorized to delete this user",
        data: null,
      });
    }

    await UserModel.deleteUserModel(userFilter);

    return res.status(200).json({
      status: true,
      response_code: 200,
      message: "User deleted successfully",
      data: null,
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      response_code: 500,
      message: err.message,
      data: null,
    });
  }
};

module.exports = {
  registerUser,
  login,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};
