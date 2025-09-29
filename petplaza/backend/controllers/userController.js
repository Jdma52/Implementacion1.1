const Usuario = require("../models/Usuario");
const bcrypt = require("bcryptjs");

// GET /users
exports.getUsers = async (req, res) => {
  try {
    const users = await Usuario.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ mensaje: "Error obteniendo usuarios", error: err.message });
  }
};

// POST /users (registrar nuevo usuario)
exports.createUser = async (req, res) => {
  try {
    const { username, email, full_name, password, role } = req.body;

    // Validaciones básicas
    if (!username || !email || !full_name || !password) {
      return res.status(400).json({ mensaje: "Todos los campos son requeridos" });
    }

    // ¿Existe usuario con mismo username?
    const existe = await Usuario.findOne({ username });
    if (existe) {
      return res.status(400).json({ mensaje: "El nombre de usuario ya existe" });
    }

    // ¿Existe usuario con mismo email?
    const existeEmail = await Usuario.findOne({ email });
    if (existeEmail) {
      return res.status(400).json({ mensaje: "El correo ya está registrado" });
    }

    // Hashear contraseña
    const hash = await bcrypt.hash(password, 10);

    // Crear nuevo usuario
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
    console.error("❌ Error en createUser:", err);
    res.status(500).json({ mensaje: "Error en el servidor", error: err.message });
  }
};

// PUT /users/:id
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, full_name, role, is_active } = req.body;

    const user = await Usuario.findByIdAndUpdate(
      id,
      { email, full_name, role, is_active },
      { new: true }
    );
    res.json(user);
  } catch (err) {
    res.status(500).json({ mensaje: "Error actualizando usuario", error: err.message });
  }
};

// PATCH /users/:id/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { nuevaContrasena } = req.body;

    const hash = await bcrypt.hash(nuevaContrasena, 10);
    await Usuario.findByIdAndUpdate(id, { password: hash });
    res.json({ mensaje: "Contraseña restablecida" });
  } catch (err) {
    res.status(500).json({ mensaje: "Error reseteando contraseña", error: err.message });
  }
};

// DELETE /users/:id
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await Usuario.findByIdAndDelete(id);
    res.json({ mensaje: "Usuario eliminado" });
  } catch (err) {
    res.status(500).json({ mensaje: "Error eliminando usuario", error: err.message });
  }
};

// PATCH /users/:id/toggle-status
exports.toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await Usuario.findById(id);

    if (!user) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    user.is_active = !user.is_active;
    await user.save();

    res.json({
      mensaje: "Estado actualizado",
      id: user._id,
      is_active: user.is_active,
    });
  } catch (err) {
    res.status(500).json({ mensaje: "Error cambiando estado", error: err.message });
  }
};