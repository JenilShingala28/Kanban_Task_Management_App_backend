const router = require("express").Router();
const statusController = require("../controllers/statusController");
const authenticate = require("../middlewares/authMiddlewares");

router.post("/create", authenticate, statusController.createStatus);
router.get("/getall", authenticate, statusController.getAllStatuses);
router.get("/get/:id", authenticate, statusController.getStatusById);
router.put("/update", authenticate, statusController.updateStatus);
router.delete("/delete", authenticate, statusController.deleteStatus);

module.exports = router;
