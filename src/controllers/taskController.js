const TaskModel = require("../models/taskModel");
const StatusModel = require("../models/statusModel");
const Joi = require("joi");
const { formatErrorMessage } = require("../helpers/formatErrorMessage");
const { getAssetUrl } = require("../helpers/getAssetUrl");
const { getParams } = require("../helpers/paginationTaskList");

// Create Task
const createTask = async (req, res) => {
  const schema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().optional(),
    status: Joi.string().hex().length(24).required(),
    assignee: Joi.string().hex().length(24).optional(),
    dueDate: Joi.date().optional(),
    priority: Joi.string().valid("low", "medium", "high").default("medium"),
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
    const { title, description, status, assignee, dueDate, priority } =
      req.body;

    // check status valid
    const statusObj = await StatusModel.findOneStatus({ _id: status });
    if (!statusObj) {
      return res.status(404).json({
        status: false,
        response_code: 404,
        message: "Invalid status",
        data: null,
      });
    }

    // if user -> assign to self, if admin -> can assign
    let finalAssignee = req.user._id;
    if (req.user.role?.name === "Admin" && assignee) {
      finalAssignee = assignee;
    }

    const task = await TaskModel.createTask({
      title,
      description,
      status,
      assignee: finalAssignee,
      dueDate,
      priority,
    });

    const populatedTask = await TaskModel.findOneTask({ _id: task._id });

    const responseData = {
      id: populatedTask._id,
      title: populatedTask.title,
      description: populatedTask.description,
      dueDate: populatedTask.dueDate,
      priority: populatedTask.priority,
      status: populatedTask.status
        ? { id: populatedTask.status._id, name: populatedTask.status.name }
        : null,
      assignee: populatedTask.assignee
        ? {
            id: populatedTask.assignee._id,
            first_name: populatedTask.assignee.first_name,
            last_name: populatedTask.assignee.last_name,
            email: populatedTask.assignee.email,
          }
        : null,
    };

    return res.status(201).json({
      status: true,
      response_code: 201,
      message: "Task created successfully",
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
const taskPagination = async (req, res) => {
  try {
    const params = getParams(req);

    // Pagination
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const skip = (page - 1) * pageSize;

    // Base Filters
    let filter = { is_deleted: false };

    // User vs Admin filter
    if (req.user.role?.name !== "Admin") {
      filter.assignee = req.user._id;
    }

    if (params.filter && typeof params.filter === "object") {
      filter = { ...filter, ...params.filter };
    }

    // Search
    if (params.search) {
      const regex = new RegExp(params.search, "i");
      filter.$or = [
        { title: regex },
        { description: regex },
        { priority: regex },
      ];
    }

    // Sorting
    let sort = { createdAt: -1 };
    if (params.sort && typeof params.sort === "object") {
      sort = {};
      for (const k of Object.keys(params.sort)) {
        const val = params.sort[k];
        sort[k] = val === "asc" || val === 1 || val === "1" ? 1 : -1;
      }
    }

    // Fetch data & count
    const [totalRecords, tasks] = await Promise.all([
      TaskModel.countTask(filter),
      TaskModel.findAllTask(filter, { skip, limit: pageSize, sort }),
    ]);

    if (!tasks || tasks.length === 0) {
      return res.status(200).json({
        status: false,
        response_code: 200,
        message: "No tasks found",
        pagination: {
          page,
          pageSize,
          totalRecords: 0,
          totalPages: 0,
        },
        data: [],
      });
    }

    // Transform tasks
    const responseData = tasks.map((task) => ({
      id: task._id,
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      status: task.status
        ? { id: task.status._id, name: task.status.name }
        : null,
      assignee: task.assignee
        ? {
            id: task.assignee._id,
            first_name: task.assignee.first_name,
            last_name: task.assignee.last_name,
            email: task.assignee.email,
            profile_picture: task.assignee.profile_picture
              ? getAssetUrl(task.assignee.profile_picture)
              : null,
          }
        : null,
      priority: task.priority,
      isDeleted: task.is_deleted,
    }));

    return res.json({
      status: true,
      response_code: 200,
      message: "Tasks fetched successfully",
      pagination: {
        page,
        pageSize,
        totalRecords,
        totalPages: Math.ceil(totalRecords / pageSize),
      },
      data: responseData,
    });
  } catch (error) {
    console.error("Pagination error:", error);
    return res.status(500).json({
      status: false,
      response_code: 500,
      message: error.message,
      data: [],
    });
  }
};

// Get All Tasks (user = own tasks, admin = all)
const getAllTasks = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role?.name !== "Admin") {
      filter = { assignee: req.user._id };
    }
    const tasks = await TaskModel.findAllTask(filter);

    // if (!tasks || tasks.length === 0) {
    //   return res.status(404).json({
    //     status: false,
    //     response_code: 404,
    //     message: "No tasks found",
    //     data: [],
    //   });
    // }

    const transformedData = tasks.map((task) => ({
      id: task._id,
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      status: task.status
        ? { id: task.status._id, name: task.status.name }
        : null,
      assignee: task.assignee
        ? {
            id: task.assignee._id,
            first_name: task.assignee.first_name,
            last_name: task.assignee.last_name,
            email: task.assignee.email,
            profile_picture: task.assignee.profile_picture
              ? getAssetUrl(task.assignee.profile_picture)
              : null,
          }
        : null,
      priority: task.priority,
    }));

    return res.status(200).json({
      status: true,
      response_code: 200,
      message: "Tasks fetched successfully",
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

const getAll = async (req, res) => {
  try {
    const filter = {};
    const tasks = await TaskModel.findAllTask(filter);

    // if (!tasks || tasks.length === 0) {
    //   return res.status(404).json({
    //     status: false,
    //     response_code: 404,
    //     message: "No tasks found",
    //     data: [],
    //   });
    // }

    const transformedData = tasks.map((task) => ({
      id: task._id,
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      status: task.status
        ? { id: task.status._id, name: task.status.name }
        : null,
      assignee: task.assignee
        ? {
            id: task.assignee._id,
            first_name: task.assignee.first_name,
            last_name: task.assignee.last_name,
            email: task.assignee.email,
            profile_picture: task.assignee.profile_picture
              ? getAssetUrl(task.assignee.profile_picture)
              : null,
          }
        : null,
      priority: task.priority,
    }));

    return res.status(200).json({
      status: true,
      response_code: 200,
      message: "Tasks fetched successfully",
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

const getTaskById = async (req, res) => {
  const schema = Joi.object({
    id: Joi.string().hex().length(24).required(),
  });

  const { error } = schema.validate(req.params, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      status: false,
      response_code: 400,
      message: formatErrorMessage(error.details[0].message),
      data: null,
    });
  }

  try {
    const task = await TaskModel.findOneTask({ _id: req.params.id });

    if (!task) {
      return res.status(404).json({
        status: false,
        response_code: 404,
        message: "Task not found",
        data: null,
      });
    }

    // Role-based access
    if (
      req.user.role?.name !== "Admin" &&
      task.assignee &&
      task.assignee._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        status: false,
        response_code: 403,
        message: "Not authorized to view this task",
        data: null,
      });
    }

    const transformedData = {
      id: task._id,
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      priority: task.priority,
      status: task.status
        ? { id: task.status._id, name: task.status.name }
        : null,
      assignee: task.assignee
        ? {
            id: task.assignee._id,
            first_name: task.assignee.first_name,
            last_name: task.assignee.last_name,
            email: task.assignee.email,
            profile_picture: task.assignee.profile_picture
              ? getAssetUrl(task.assignee.profile_picture)
              : null,
          }
        : null,
    };

    return res.status(200).json({
      status: true,
      response_code: 200,
      message: "Task fetched successfully",
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

const updateTask = async (req, res) => {
  const schema = Joi.object({
    id: Joi.string().hex().length(24).required(),
    title: Joi.string().optional(),
    description: Joi.string().optional(),
    status: Joi.string().hex().length(24).optional(),
    assignee: Joi.string().hex().length(24).optional(),
    dueDate: Joi.date().optional(),
    priority: Joi.string().valid("low", "medium", "high").optional(),
  }).min(1);

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: false,
      response_code: 400,
      message: formatErrorMessage(error.details[0].message),
      data: null,
    });
  }

  try {
    const { id, title, description, status, assignee, dueDate, priority } =
      req.body;

    // Fetch the task
    const task = await TaskModel.findOneTask({ _id: id, is_deleted: false });
    if (!task) {
      return res.status(404).json({
        status: false,
        response_code: 404,
        message: "Task not found",
        data: null,
      });
    }

    const isAdmin = req.user.role?.name === "Admin";

    // Determine assignee ID correctly
    const assigneeId = task.assignee?._id ? task.assignee._id : task.assignee;

    // Normal user can update only their own task
    if (!isAdmin && assigneeId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: false,
        response_code: 403,
        message: "Not authorized to update this task",
        data: null,
      });
    }

    // Build update object dynamically
    const updatedData = {};
    if (title !== undefined) updatedData.title = title;
    if (description !== undefined) updatedData.description = description;
    if (status !== undefined) updatedData.status = status;
    if (dueDate !== undefined) updatedData.dueDate = dueDate;
    if (priority !== undefined) updatedData.priority = priority;

    // Only admin can reassign task
    if (isAdmin && assignee !== undefined) {
      updatedData.assignee = assignee;
    }

    // Update task
    const updatedTask = await TaskModel.updateTask({ _id: id }, updatedData);

    const responseData = {
      id: updatedTask._id,
      title: updatedTask.title,
      description: updatedTask.description,
      dueDate: updatedTask.dueDate,
      priority: updatedTask.priority,
      status: updatedTask.status
        ? { id: updatedTask.status._id, name: updatedTask.status.name }
        : null,
      assignee: updatedTask.assignee
        ? {
            id: updatedTask.assignee._id,
            first_name: updatedTask.assignee.first_name,
            last_name: updatedTask.assignee.last_name,
            email: updatedTask.assignee.email,
          }
        : null,
      createdAt: updatedTask.createdAt,
      updatedAt: updatedTask.updatedAt,
    };

    return res.status(200).json({
      status: true,
      response_code: 200,
      message: "Task updated successfully",
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

// Delete Task
const deleteTask = async (req, res) => {
  const schema = Joi.object({
    id: Joi.string().hex().length(24).required(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: false,
      response_code: 400,
      message: formatErrorMessage(error.details[0].message),
      data: null,
    });
  }

  try {
    const { id } = req.body;
    const taskFilter = { _id: id, is_deleted: false };

    const task = await TaskModel.findOneTask(taskFilter);
    if (!task) {
      return res.status(404).json({
        status: false,
        response_code: 404,
        message: "Task not found",
        data: null,
      });
    }

    const isAdmin = req.user.role?.name === "Admin";

    // Normalize assignee ID (handles populated object or just ID)
    const assigneeId = task.assignee?._id ? task.assignee._id : task.assignee;

    // Normal users can delete only their own tasks
    if (!isAdmin && assigneeId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: false,
        response_code: 403,
        message: "Not authorized to delete this task",
        data: null,
      });
    }

    await TaskModel.deleteTask(taskFilter);

    return res.status(200).json({
      status: true,
      response_code: 200,
      message: "Task deleted successfully",
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

const moveTaskStatus = async (req, res) => {
  const schema = Joi.object({
    id: Joi.string().hex().length(24).required(),
    status: Joi.string().hex().length(24).required(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: false,
      response_code: 400,
      message: formatErrorMessage(error.details[0].message),
      data: null,
    });
  }

  try {
    const { id, status } = req.body;

    const task = await TaskModel.findOneTask({ _id: id });
    if (!task) {
      return res.status(404).json({
        status: false,
        response_code: 404,
        message: "Task not found",
        data: null,
      });
    }

    // check if status is valid
    const statusObj = await StatusModel.findOneStatus({ _id: status });
    if (!statusObj) {
      return res.status(404).json({
        status: false,
        response_code: 404,
        message: "Invalid status",
        data: null,
      });
    }

    // role-based restriction
    if (
      req.user.role?.name !== "Admin" &&
      task.assignee &&
      task.assignee._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        status: false,
        response_code: 403,
        message: "Not authorized to move this task",
        data: null,
      });
    }

    const updatedTask = await TaskModel.updateTask({ _id: id }, { status });

    const responseData = {
      id: updatedTask._id,
      title: updatedTask.title,
      description: updatedTask.description,
      dueDate: updatedTask.dueDate,
      priority: updatedTask.priority,
      status: updatedTask.status
        ? { id: updatedTask.status._id, name: updatedTask.status.name }
        : null,
      assignee: updatedTask.assignee
        ? {
            id: updatedTask.assignee._id,
            first_name: updatedTask.assignee.first_name,
            last_name: updatedTask.assignee.last_name,
            email: updatedTask.assignee.email,
          }
        : null,
      updatedAt: updatedTask.updatedAt,
    };

    return res.status(200).json({
      status: true,
      response_code: 200,
      message: "Task moved successfully",
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

module.exports = {
  createTask,
  taskPagination,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  moveTaskStatus,
  getAll,
};
