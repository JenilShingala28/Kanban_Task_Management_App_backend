const RoleModel = require("../models/roleModel");
const Joi = require("joi");
const { formatErrorMessage } = require("../helpers/formatErrorMessage");

// Create Role (Admin only)
const createRole = async (req, res) => {
  if (req.user.role?.name !== "Admin") {
    return res.status(403).json({
      status: false,
      response_code: 403,
      message: "Only admin can create roles",
      data: null,
    });
  }

  const schema = Joi.object({
    name: Joi.string().trim().required(),
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
    const { name } = req.body;

    const existing = await RoleModel.findOneRole({ name });
    if (existing) {
      return res.status(409).json({
        status: false,
        response_code: 409,
        message: "Role already exists",
        data: null,
      });
    }

    const role = await RoleModel.createRole({ name });
    const responseData = {
      id: role._id,
      name: role.name,
    };

    return res.status(201).json({
      status: true,
      response_code: 201,
      message: "Role created successfully",
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

// Get All Roles
const getAllRoles = async (req, res) => {
  try {
    const roles = await RoleModel.findAllRole(req.query);

    if (!roles || roles.length === 0) {
      return res.status(404).json({
        status: false,
        response_code: 404,
        message: "No roles found",
        data: [],
      });
    }

    const transformedData = roles.map((item) => ({
      id: item._id,
      name: item.name,
    }));

    return res.status(200).json({
      status: true,
      response_code: 200,
      message: "Roles fetched successfully",
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

// Get Role By ID
const getRoleById = async (req, res) => {
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
    const role = await RoleModel.findOneRole({ _id: req.params.id });

    if (!role) {
      return res.status(404).json({
        status: false,
        response_code: 404,
        message: "Role not found",
        data: null,
      });
    }

    const transformedData = {
      id: role._id,
      name: role.name,
    };

    return res.status(200).json({
      status: true,
      response_code: 200,
      message: "Role fetched successfully",
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

// Update Role (Admin only)
const updateRole = async (req, res) => {
  if (req.user.role?.name !== "Admin") {
    return res.status(403).json({
      status: false,
      response_code: 403,
      message: "Only admin can update roles",
      data: null,
    });
  }

  const schema = Joi.object({
    id: Joi.string().hex().length(24).required(),
    name: Joi.string().optional(),
  }).min(1);

  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      status: false,
      response_code: 400,
      message: formatErrorMessage(error.details[0].message),
      data: null,
    });
  }

  const { id, name } = req.body;

  try {
    const role = await RoleModel.findOneRole({ _id: id });
    if (!role) {
      return res.status(404).json({
        status: false,
        response_code: 404,
        message: "Role not found or has been deleted",
        data: [],
      });
    }

    const updated = await RoleModel.updateRole({ _id: id }, { name });

    if (!updated) {
      return res.status(404).json({
        status: false,
        response_code: 404,
        message: "Role not found",
        data: null,
      });
    }

    const responseData = {
      id: updated._id,
      name: updated.name,
    };

    return res.status(200).json({
      status: true,
      response_code: 200,
      message: "Role updated successfully",
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

// Delete Role (Admin only)
const deleteRole = async (req, res) => {
  if (req.user.role?.name !== "Admin") {
    return res.status(403).json({
      status: false,
      response_code: 403,
      message: "Only admin can delete roles",
      data: null,
    });
  }

  const schema = Joi.object({
    id: Joi.string().hex().length(24).required(),
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

  const { id } = req.body;
  const roleFilter = { _id: id, is_deleted: false };

  try {
    const role = await RoleModel.findOneRole(roleFilter);
    if (!role) {
      return res.status(404).json({
        status: false,
        response_code: 404,
        message: "Role not found or already deleted",
        data: null,
      });
    }

    await RoleModel.deleteRole(roleFilter);

    return res.status(200).json({
      status: true,
      response_code: 200,
      message: "Role deleted successfully",
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
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
};
