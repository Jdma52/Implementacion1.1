const express = require("express");
const { register, login, verify2FA } = require("../controllers/authController");
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/verify-2fa", verify2FA);

module.exports = router;