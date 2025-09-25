const StatusModel = require("../models/statusModel");
const Joi = require("joi");
const { formatErrorMessage } = require("../helpers/formatErrorMessage");

// Create Status (Admin only)
const createStatus = async (req, res) => {
  if (req.user.role?.name !== "Admin") {
    return res.status(403).json({
      status: false,
      response_code: 403,
      message: "Only admin can create statuses",
      data: null,
    });
  }

  const schema = Joi.object({
    name: Joi.string().trim().required(),
    order: Joi.number().optional(),
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
    const { name, order } = req.body;

    const existing = await StatusModel.findOneStatus({
      name: new RegExp(`^${name}$`, "i"),
    });
    if (existing) {
      return res.status(409).json({
        status: false,
        response_code: 409,
        message: "Status already exists",
        data: null,
      });
    }
    const existingStatus = await StatusModel.findOneStatus({ order });
    if (existingStatus) {
      return res.status(409).json({
        status: false,
        response_code: 409,
        message: "Status order number is already exists",
        data: null,
      });
    }

    const status = await StatusModel.createStatus({ name, order });
    const responseData = {
      id: status._id,
      name: status.name,
      order: status.order,
    };

    return res.status(201).json({
      status: true,
      response_code: 201,
      message: "Status created successfully",
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

// Get All Statuses
const getAllStatuses = async (req, res) => {
  try {
    const statuses = await StatusModel.findAllStatus(req.query);

    if (!statuses || statuses.length === 0) {
      return res.status(404).json({
        status: false,
        response_code: 404,
        message: "No statuses found",
        data: [],
      });
    }

    const transformedData = statuses.map((item) => ({
      id: item._id,
      name: item.name,
      order: item.order,
    }));
    return res.status(200).json({
      status: true,
      response_code: 200,
      message: "Statuses fetched successfully",
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

const getStatusById = async (req, res) => {
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
    const status = await StatusModel.findOneStatus({ _id: req.params.id });

    if (!status) {
      return res.status(404).json({
        status: false,
        response_code: 404,
        message: "Status not found",
        data: null,
      });
    }

    const transformedData = {
      id: status._id,
      name: status.name,
      order: status.order,
    };

    return res.status(200).json({
      status: true,
      response_code: 200,
      message: "Status fetched successfully",
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

// Update Status (Admin only)
const updateStatus = async (req, res) => {
  if (req.user.role?.name !== "Admin") {
    return res.status(403).json({
      status: false,
      response_code: 403,
      message: "Only admin can update statuses",
      data: null,
    });
  }

  const schema = Joi.object({
    id: Joi.string().hex().length(24).required(),
    name: Joi.string().required(),
    order: Joi.number().optional(),
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
  const { id, name, order } = req.body;

  try {
    const status = await StatusModel.findOneStatus({
      _id: id,
      is_deleted: false,
    });
    if (!status) {
      return res.status(404).json({
        status: false,
        response_code: 404,
        message: "status not found or has been deleted",
        data: [],
      });
    }
    const updated = await StatusModel.updateStatus(
      { _id: id },
      { name, order }
    );

    if (!updated) {
      return res.status(404).json({
        status: false,
        response_code: 404,
        message: "Status not found",
        data: null,
      });
    }

    const responseData = {
      id: updated._id,
      name: updated.name,
      order: updated.order,
    };

    return res.status(200).json({
      status: true,
      response_code: 200,
      message: "Status updated successfully",
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

const deleteStatus = async (req, res) => {
  if (req.user.role?.name !== "Admin") {
    return res.status(403).json({
      status: false,
      response_code: 403,
      message: "Only admin can delete statuses",
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
  const statusFilter = { _id: id, is_deleted: false };
  try {
    const status = await StatusModel.findOneStatus(statusFilter);
    if (!status) {
      return res.status(404).json({
        status: false,
        response_code: 404,
        message: "status not found or already deleted",
        data: null,
      });
    }

    await StatusModel.deleteStatus(statusFilter);

    return res.status(200).json({
      status: true,
      response_code: 200,
      message: "Status deleted successfully",
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
  createStatus,
  getAllStatuses,
  getStatusById,
  updateStatus,
  deleteStatus,
};
