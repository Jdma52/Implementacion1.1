const Usuario = require("../models/Usuario");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendEmail = require("../util/sendEmail");

// 📌 Registrar usuario
const register = async (req, res) => {
  try {
    const { username, email, full_name, password, role } = req.body;

    if (!username || !email || !full_name || !password) {
      return res.status(400).json({ mensaje: "Todos los campos son requeridos" });
    }

    const existe = await Usuario.findOne({ username });
    if (existe) return res.status(400).json({ mensaje: "El nombre de usuario ya existe" });

    const existeEmail = await Usuario.findOne({ email });
    if (existeEmail) return res.status(400).json({ mensaje: "El correo ya está registrado" });

    const hash = await bcrypt.hash(password, 10);

    const nuevoUsuario = new Usuario({
      username,
      email,
      full_name,
      password: hash,
      role,
    });

    await nuevoUsuario.save();
    res.status(201).json({ mensaje: "Usuario registrado correctamente" });
  } catch (err) {
    console.error("❌ Error en register:", err);
    res.status(500).json({ mensaje: "Error en el servidor", error: err.message });
  }
};

// 📌 Login Paso 1: usuario + contraseña → enviar OTP
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ mensaje: "Usuario y contraseña son requeridos" });
    }

    const user = await Usuario.findOne({ username });
    if (!user) return res.status(400).json({ mensaje: "Usuario no encontrado" });
    if (!user.is_active) return res.status(403).json({ mensaje: "Usuario inactivo" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ mensaje: "Contraseña incorrecta" });

    if (user.is2FAEnabled) {
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      user.otpCode = otp;
      user.otpExpires = Date.now() + 2 * 60 * 1000; // 2 minutos
      await user.save();

      await sendEmail(user.email, "Código OTP - PetPlaza", `Tu código es: ${otp}`);

      const provisionalToken = jwt.sign(
        { id: user._id, provisional: true },
        process.env.JWT_SECRET,
        { expiresIn: "5m" }
      );

      return res.json({
        step: "2FA_REQUIRED",
        provisionalToken,
        mensaje: "OTP enviado al correo",
      });
    } else {
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );
      return res.json({ token, role: user.role, username: user.username });
    }
  } catch (err) {
    console.error("❌ Error en login:", err);
    res.status(500).json({ mensaje: "Error en el servidor", error: err.message });
  }
};

// 📌 Paso 2: verificar OTP
const verify2FA = async (req, res) => {
  try {
    const { username, otpCode } = req.body;
    const user = await Usuario.findOne({ username });
    if (!user) return res.status(400).json({ mensaje: "Usuario no encontrado" });

    if (!user.otpCode || user.otpExpires < Date.now()) {
      return res.status(400).json({ mensaje: "OTP inválido o expirado" });
    }

    if (user.otpCode !== otpCode) {
      return res.status(400).json({ mensaje: "Código incorrecto" });
    }

    user.otpCode = null;
    user.otpExpires = null;
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({ token, role: user.role, username: user.username });
  } catch (err) {
    console.error("❌ Error en verify2FA:", err);
    res.status(500).json({ mensaje: "Error en verificación", error: err.message });
  }
};

module.exports = { register, login, verify2FA };