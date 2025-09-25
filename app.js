const express = require("express");
require("dotenv").config();
const cors = require("cors");
const { config } = require("./src/config");
const connectDB = require("./src/config/db");
const path = require("path");
const userRouter = require("./src/routes/userRouter");
const statusRouter = require("./src/routes/statusRouter");
const taskRouter = require("./src/routes/taskRouter");
const roleRouter = require("./src/routes/roleRouter");

const app = express();

// default Next.js dev port

const allowedOrigin =
  process.env.ALLOWED_ORIGIN ||
  (process.env.NODE_ENV === "production"
    ? "https://kanban-task-management-app-frontend.vercel.app"
    : "http://localhost:3000");
app.use(
  cors({
    origin: allowedOrigin,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
// app.use(
//   "/uploads",
//   express.static(path.join(__dirname, "../Kanbanbackend/public/uploads"))
// );

// Serve uploads depending on environment
if (process.env.NODE_ENV === "production") {
  // On Render, serve uploads from project root public folder
  app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));
} else {
  // Local development
  app.use(
    "/uploads",
    express.static(path.join(__dirname, "../Kanbanbackend/public/uploads"))
  );
}
console.log(
  "STATIC FOLDER:",
  path.join(__dirname, "../Kanbanbackend/public/uploads")
);

connectDB();

app.get("/", (req, res) => {
  res.send("Server is running...");
});

app.use("/role", roleRouter);
app.use("/user", userRouter);
app.use("/status", statusRouter);
app.use("/task", taskRouter);

const PORT = process.env.PORT || config.get("PORT");

app.listen(PORT, () => {
  console.log(
    `Server running in ${config.get("NODE_ENV")} mode on port ${PORT}`
  );
});

module.exports = app;
