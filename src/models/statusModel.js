const Status = require("../schemas/statusSchema");

const createStatus = (data) => {
  return new Promise((resolve, reject) => {
    const newStatus = new Status(data);
    newStatus
      .save()
      .then((result) => resolve(result))
      .catch((err) => reject(err));
  });
};

const findOneStatus = (filter = {}, options = {}) => {
  return new Promise((resolve, reject) => {
    Status.findOne({ ...filter, is_deleted: false }, null, options)
      .setOptions(options)
      .then((result) => resolve(result))
      .catch((err) => reject(err));
  });
};

const findAllStatus = (filter = {}, options = {}) => {
  return new Promise((resolve, reject) => {
    Status.find({ ...filter, is_deleted: false }, null, options)
      .setOptions(options)
      .then((result) => resolve(result || []))
      .catch((err) => reject(err));
  });
};

const updateStatus = (filter, updateData) => {
  return new Promise((resolve, reject) => {
    Status.findOneAndUpdate(
      { ...filter, is_deleted: false },
      { $set: updateData },
      { new: true }
    )
      .then((updated) => resolve(updated))
      .catch((err) => reject(err));
  });
};

const deleteStatus = (filter) => {
  return new Promise((resolve, reject) => {
    Status.findOneAndUpdate(
      { ...filter, is_deleted: false },
      { $set: { is_deleted: true } },
      { new: true }
    )
      .then((deleted) => resolve(deleted))
      .catch((err) => reject(err));
  });
};

module.exports = {
  createStatus,
  findOneStatus,
  findAllStatus,
  updateStatus,
  deleteStatus,
};
