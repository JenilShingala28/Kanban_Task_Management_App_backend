const Task = require("../schemas/taskSchema");

const createTask = (data) => {
  return new Promise((resolve, reject) => {
    const newTask = new Task(data);
    newTask
      .save()
      .then((result) => resolve(result))
      .catch((err) => reject(err));
  });
};

const findOneTask = (filter = {}, options = {}) => {
  return new Promise((resolve, reject) => {
    Task.findOne({ ...filter, is_deleted: false }, null, options)
      .populate("status")
      .populate("assignee")
      .setOptions(options)
      .then((result) => resolve(result))
      .catch((err) => reject(err));
  });
};

const findAllTask = (filter = {}, options = {}) => {
  return new Promise((resolve, reject) => {
    Task.find({ ...filter, is_deleted: false }, null, options)
      .populate("status")
      .populate("assignee")
      .setOptions(options)
      .then((result) => resolve(result || []))
      .catch((err) => reject(err));
  });
};
const countTask = (filter = {}) => {
  return Task.countDocuments(filter);
};

const updateTask = (filter, updateData) => {
  return new Promise((resolve, reject) => {
    Task.findOneAndUpdate(
      { ...filter, is_deleted: false },
      { $set: updateData },
      { new: true }
    )
      .populate("status")
      .populate("assignee")
      .then((updated) => resolve(updated))
      .catch((err) => reject(err));
  });
};

const deleteTask = (filter) => {
  return new Promise((resolve, reject) => {
    Task.findOneAndUpdate(
      { ...filter, is_deleted: false },
      { $set: { is_deleted: true } },
      { new: true }
    )
      .then((deleted) => resolve(deleted))
      .catch((err) => reject(err));
  });
};

module.exports = {
  createTask,
  findOneTask,
  findAllTask,
  countTask,
  updateTask,
  deleteTask,
};
