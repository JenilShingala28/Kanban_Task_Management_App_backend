const express = require("express");
const router = express.Router();
const TaskController = require("../controllers/taskController");
const authMiddleware = require("../middlewares/authMiddlewares");

router.post("/create", authMiddleware, TaskController.createTask);

router.post("/pagination", authMiddleware, TaskController.taskPagination);

router.get("/getall", authMiddleware, TaskController.getAllTasks);
router.get("/get/:id", authMiddleware, TaskController.getTaskById);
router.put("/update", authMiddleware, TaskController.updateTask);
router.delete("/delete", authMiddleware, TaskController.deleteTask);
router.put("/move", authMiddleware, TaskController.moveTaskStatus);
router.get("/get", TaskController.getAll);

module.exports = router;
