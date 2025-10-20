const express = require("express");
const {
  register,
  login,
  verify2FA,
  requestPasswordReset,
  resendOtp,
  resetPassword,
  sendRecoveryLink,
  resetPasswordByLink,
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/verify-2fa", verify2FA);

router.post("/request-reset", requestPasswordReset);
router.post("/resend-otp", resendOtp);
router.post("/reset-password", resetPassword);

// ✅ Nuevas rutas por enlace
router.post("/send-recovery-link", sendRecoveryLink);
router.post("/reset-password-link", resetPasswordByLink);

module.exports = router;
