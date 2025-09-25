const mongoose = require("mongoose");
const { config } = require("../config");

const connectDB = async () => {
  try {
    await mongoose.connect(config.get("DATABASE_KEY"));
    console.log("Database is connected");
  } catch (err) {
    console.error("Error database connection", err);
    process.exit(1); // optional, to exit process on DB connection failure
  }
};
const db = mongoose.connection;

db.on("error", (error) => {
  console.error("Mongoose connection error:", error);
});

db.once("open", () => {
  console.log("Mongoose connected to the database");
});

db.on("disconnected", () => {
  console.log("Mongoose connection is disconnected");
});

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("Mongoose connection disconnected through app termination");
  process.exit(0);
});

module.exports = connectDB;
