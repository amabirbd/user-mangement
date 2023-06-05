const express = require("express");
const router = express.Router();
const {
  createUser,
  getAllUsers,
  getSingleUser,
  updateUser,
  deleteUser,
  signUp,
  signIn,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const csurf = require("csurf");

const csrfProtection = csurf({
  cookie: {
    key: "XSRF-TOKEN",
    httpOnly: true,
    sameSite: "strict",
    secure: true,
  },
});

router.post("/create_user", protect, csrfProtection, createUser);
router.get("/get_users", protect, csrfProtection, getAllUsers);
router.get("/user/:id", protect, csrfProtection, getSingleUser);
router.put("/update/:id", protect, csrfProtection, updateUser);
router.delete("/user/:id", protect, csrfProtection, deleteUser);

router.post("/signup", csrfProtection, signUp);
router.post("/signin", csrfProtection, signIn);

module.exports = router;
