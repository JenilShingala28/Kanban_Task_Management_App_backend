const User = require("../schemas/userSchema");

const createUserModel = (data) => {
  return new Promise((resolve, reject) => {
    const userdata = new User(data);
    userdata
      .save()
      .then((result) => {
        resolve(result);
      })
      .catch((err) => reject(err));
  });
};

const findOneUserModel = (filter = {}, options = {}) => {
  return new Promise((resolve, reject) => {
    User.findOne({ ...filter, is_deleted: false }, null, options)
      .setOptions(options)
      .populate("role", "name")
      .then((result) => {
        resolve(result);
      })
      .catch((err) => reject(err));
  });
};

const findAllUserModel = (filter = {}, options = {}) => {
  return new Promise((resolve, reject) => {
    User.find({ ...filter, is_deleted: false }, null, options)
      .setOptions(options)
      .populate("role", "name")
      .then((result) => {
        resolve(result || []);
      })
      .catch((err) => reject(err));
  });
};

const updateUserModel = (filter, updateData) => {
  return new Promise((resolve, reject) => {
    User.findOneAndUpdate(
      { ...filter, is_deleted: false },
      { $set: updateData },
      { new: true }
    )
      .populate("role", "name")
      .then((updateUserModel) => {
        resolve(updateUserModel);
      })
      .catch((err) => reject(err));
  });
};

const deleteUserModel = (filter) => {
  return new Promise((resolve, reject) => {
    User.findOneAndUpdate(
      { ...filter, is_deleted: false },
      { $set: { is_deleted: true } },
      { new: true }
    )
      .then((result) => {
        resolve(result);
      })
      .catch((err) => reject(err));
  });
};

module.exports = {
  createUserModel,
  findOneUserModel,
  findAllUserModel,
  updateUserModel,
  deleteUserModel,
};
