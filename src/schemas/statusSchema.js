// models/Status.js
const mongoose = require("mongoose");

const statusSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
      unique: true,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Status", statusSchema);
