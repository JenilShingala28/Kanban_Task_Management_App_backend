const Role = require("../schemas/roleSchema");

const createRole = (data) => {
  return new Promise((resolve, reject) => {
    const newRole = new Role(data);
    newRole
      .save()
      .then((result) => resolve(result))
      .catch((err) => reject(err));
  });
};

const findOneRole = (filter = {}, options = {}) => {
  return new Promise((resolve, reject) => {
    Role.findOne({ ...filter, is_deleted: false }, null, options)
      .setOptions(options)
      .then((result) => resolve(result))
      .catch((err) => reject(err));
  });
};

const findAllRole = (filter = {}, options = {}) => {
  return new Promise((resolve, reject) => {
    Role.find({ ...filter, is_deleted: false }, null, options)
      .setOptions(options)
      .then((result) => resolve(result || []))
      .catch((err) => reject(err));
  });
};

const updateRole = (filter, updateData) => {
  return new Promise((resolve, reject) => {
    Role.findOneAndUpdate(
      { ...filter, is_deleted: false },
      { $set: updateData },
      { new: true }
    )
      .then((updated) => resolve(updated))
      .catch((err) => reject(err));
  });
};

const deleteRole = (filter) => {
  return new Promise((resolve, reject) => {
    Role.findOneAndUpdate(
      { ...filter, is_deleted: false },
      { $set: { is_deleted: true } },
      { new: true }
    )
      .then((deleted) => resolve(deleted))
      .catch((err) => reject(err));
  });
};

module.exports = {
  createRole,
  deleteRole,
  findOneRole,
  findAllRole,
  updateRole,
};
