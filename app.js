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

app.use(
  cors({
    origin: "*", //
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../Kanbanbackend/public/uploads"))
);
console.log(
  "STATIC FOLDER:",
  path.join(__dirname, "../Kanbanbackend/public/uploads")
);

connectDB();

app.use("/role", roleRouter);
app.use("/user", userRouter);
app.use("/status", statusRouter);
app.use("/task", taskRouter);

app.listen(config.get("PORT"), () => {
  console.log(`server is run ${config.get("PORT")}`);
});

module.exports = app;
