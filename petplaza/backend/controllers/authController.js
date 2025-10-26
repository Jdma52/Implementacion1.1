const Usuario = require("../models/Usuario");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../util/sendEmail");

/* =====================================================
   🧩 Registrar usuario
   ===================================================== */
const register = async (req, res) => {
  try {
    const { username, email, full_name, password, role, phones } = req.body;
    if (!username || !email || !full_name || !password)
      return res.status(400).json({ mensaje: "Todos los campos son requeridos" });

    const existe = await Usuario.findOne({ $or: [{ username }, { email }] });
    if (existe) return res.status(400).json({ mensaje: "Usuario o correo ya existen" });

    const hash = await bcrypt.hash(password, 10);
    const nuevoUsuario = new Usuario({
      username,
      email,
      full_name,
      password: hash,
      role,
      phones: phones?.map((t) => t.replace(/\D/g, "")) || [],
    });

    await nuevoUsuario.save();
    res.status(201).json({ mensaje: "Usuario registrado correctamente" });
  } catch (err) {
    console.error("❌ Error en register:", err);
    res.status(500).json({ mensaje: "Error en el servidor", error: err.message });
  }
};

/* =====================================================
   🔐 LOGIN (con bloqueo e intentos)
   ===================================================== */
const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password)
      return res.status(400).json({ mensaje: "Usuario, correo o teléfono y contraseña son requeridos" });

    const cleaned = identifier.trim().replace(/\D/g, "");
    const user = await Usuario.findOne({
      $or: [
        { username: identifier.trim() },
        { email: identifier.trim() },
        { phones: { $in: [cleaned] } },
      ],
    });

    if (!user) return res.status(404).json({ mensaje: "Usuario no encontrado" });

    // Bloqueo temporal
    if (user.blocked_until && user.blocked_until > new Date()) {
      const minutosRestantes = Math.ceil((user.blocked_until - new Date()) / 60000);
      return res.status(403).json({
        mensaje: `Cuenta bloqueada. Intenta nuevamente en ${minutosRestantes} minutos.`,
      });
    }

    if (!user.is_active || user.status === "blocked")
      return res.status(403).json({ mensaje: "Usuario inactivo o bloqueado." });

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      user.failed_attempts += 1;

      if (user.failed_attempts >= 7) {
        user.status = "blocked";
        user.is_active = false;
        user.blocked_until = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
        await user.save();
        return res.status(403).json({
          mensaje: "Demasiados intentos fallidos. Usuario bloqueado por 1 hora.",
        });
      }

      await user.save();
      return res.status(400).json({
        mensaje: `Contraseña incorrecta. Intentos fallidos: ${user.failed_attempts}/7`,
      });
    }

    // Reiniciar contador
    user.failed_attempts = 0;
    user.blocked_until = null;

    // 2FA
    if (user.is2FAEnabled) {
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      user.otpCode = otp;
      user.otpExpires = Date.now() + 5 * 60 * 1000;
      await user.save();

      await sendEmail(user.email, "Código OTP - PetPlaza", `Tu código es: ${otp}`);
      return res.json({ step: "2FA_REQUIRED", mensaje: "OTP enviado al correo" });
    }

    await user.save();
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({
      token,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
    });
  } catch (err) {
    console.error("❌ Error en login:", err);
    res.status(500).json({ mensaje: "Error en el servidor", error: err.message });
  }
};

/* =====================================================
   🔢 Verificar OTP (2FA)
   ===================================================== */
const verify2FA = async (req, res) => {
  try {
    const { identifier, otpCode } = req.body;
    const cleaned = identifier.trim().replace(/\D/g, "");
    const user = await Usuario.findOne({
      $or: [
        { username: identifier.trim() },
        { email: identifier.trim() },
        { phones: { $in: [cleaned] } },
      ],
    });

    if (!user) return res.status(404).json({ mensaje: "Usuario no encontrado" });
    if (!user.otpCode || user.otpExpires < Date.now())
      return res.status(400).json({ mensaje: "OTP inválido o expirado" });
    if (user.otpCode !== otpCode)
      return res.status(400).json({ mensaje: "Código incorrecto" });

    user.otpCode = null;
    user.otpExpires = null;
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({
      token,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
    });
  } catch (err) {
    console.error("❌ Error en verify2FA:", err);
    res.status(500).json({ mensaje: "Error en verificación", error: err.message });
  }
};

/* =====================================================
   🔁 Recuperación de contraseña por código OTP
   ===================================================== */
const requestPasswordReset = async (req, res) => {
  try {
    const { identifier } = req.body;
    const cleaned = identifier.trim().replace(/\D/g, "");
    const user = await Usuario.findOne({
      $or: [
        { username: identifier.trim() },
        { email: identifier.trim() },
        { phones: { $in: [cleaned] } },
      ],
    });

    if (!user) return res.status(404).json({ mensaje: "Usuario no encontrado." });

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    user.otpCode = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendEmail(user.email, "Restablecer contraseña - PetPlaza", `Tu código es: ${otp}`);
    res.json({ mensaje: "Código enviado al correo." });
  } catch (err) {
    console.error("❌ Error en requestPasswordReset:", err);
    res.status(500).json({ mensaje: "Error en el servidor" });
  }
};

const resendOtp = async (req, res) => {
  try {
    const { identifier } = req.body;
    const cleaned = identifier.trim().replace(/\D/g, "");
    const user = await Usuario.findOne({
      $or: [
        { username: identifier.trim() },
        { email: identifier.trim() },
        { phones: { $in: [cleaned] } },
      ],
    });

    if (!user) return res.status(404).json({ mensaje: "Usuario no encontrado." });

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    user.otpCode = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendEmail(user.email, "Nuevo código OTP - PetPlaza", `Tu nuevo código es: ${otp}`);
    res.json({ mensaje: "Código reenviado." });
  } catch (err) {
    console.error("❌ Error en resendOtp:", err);
    res.status(500).json({ mensaje: "Error en el servidor" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { identifier, newPassword, otpCode } = req.body;
    const cleaned = identifier.trim().replace(/\D/g, "");
    const user = await Usuario.findOne({
      $or: [
        { username: identifier.trim() },
        { email: identifier.trim() },
        { phones: { $in: [cleaned] } },
      ],
    });

    if (!user) return res.status(404).json({ mensaje: "Usuario no encontrado." });
    if (!user.otpCode || user.otpExpires < Date.now())
      return res.status(400).json({ mensaje: "OTP inválido o expirado." });
    if (user.otpCode !== otpCode)
      return res.status(400).json({ mensaje: "Código incorrecto." });

    user.password = await bcrypt.hash(newPassword, 10);
    user.otpCode = null;
    user.otpExpires = null;
    await user.save();

    res.json({ mensaje: "Contraseña actualizada correctamente." });
  } catch (err) {
    console.error("❌ Error en resetPassword:", err);
    res.status(500).json({ mensaje: "Error en el servidor" });
  }
};

/* =====================================================
   📩 Recuperación por enlace seguro
   ===================================================== */
const sendRecoveryLink = async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier)
      return res.status(400).json({ mensaje: "Debe ingresar usuario, correo o teléfono" });

    const cleaned = identifier.trim().replace(/\D/g, "");
    const user = await Usuario.findOne({
      $or: [
        { username: identifier.trim() },
        { email: identifier.trim() },
        { phones: { $in: [cleaned] } },
      ],
    });

    if (!user) return res.status(404).json({ mensaje: "Usuario no encontrado" });

    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetTokenExpires = Date.now() + 60 * 60 * 1000;
    await user.save();

    const link = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await sendEmail(
      user.email,
      "Restablecer tu contraseña - PetPlaza",
      `
        <h2>Hola ${user.full_name}</h2>
        <p>Has solicitado restablecer tu contraseña.</p>
        <p><a href="${link}" 
             style="background:#10b981;color:white;padding:10px 20px;text-decoration:none;border-radius:6px;">Restablecer Contraseña</a></p>
        <p>Este enlace expirará en 1 hora.</p>
      `
    );

    res.json({ mensaje: "Enlace de recuperación enviado al correo." });
  } catch (err) {
    console.error("❌ Error en sendRecoveryLink:", err);
    res.status(500).json({ mensaje: "Error al enviar enlace", error: err.message });
  }
};

const resetPasswordByLink = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const user = await Usuario.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ mensaje: "Token inválido o expirado." });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    await user.save();

    res.json({ mensaje: "Contraseña restablecida correctamente." });
  } catch (err) {
    console.error("❌ Error en resetPasswordByLink:", err);
    res.status(500).json({ mensaje: "Error en el servidor" });
  }
};

module.exports = {
  register,
  login,
  verify2FA,
  requestPasswordReset,
  resendOtp,
  resetPassword,
  sendRecoveryLink,
  resetPasswordByLink,
};
