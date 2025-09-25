const express = require("express");
const router = express.Router();
const roleController = require("../controllers/roleController");
const authenticate = require("../middlewares/authMiddlewares");

router.post("/create", authenticate, roleController.createRole);
router.get("/getall", authenticate, roleController.getAllRoles);
router.get("/get/:id", authenticate, roleController.getRoleById);
router.put("/update", authenticate, roleController.updateRole);
router.delete("/delete", authenticate, roleController.deleteRole);

module.exports = router;
