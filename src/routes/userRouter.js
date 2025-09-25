const router = require("express").Router();
const userController = require("../controllers/userController");
const authenticate = require("../middlewares/authMiddlewares");
const {
  base64ToFileMiddleware,
} = require("../middlewares/base64ToFileMiddleware");

router.post(
  "/register",
  base64ToFileMiddleware(["profile_picture"], "users"),
  userController.registerUser
);
router.post("/login", userController.login);
router.get("/getall", authenticate, userController.getAllUsers);
router.get("/get/:id", authenticate, userController.getUserById);
router.put(
  "/update",
  base64ToFileMiddleware(["profile_picture"], "users"),
  authenticate,
  userController.updateUser
);
router.delete("/delete", authenticate, userController.deleteUser);

module.exports = router;
