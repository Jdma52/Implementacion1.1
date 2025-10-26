// backend/controllers/ownerController.js
const Owner = require("../models/Owner");

/* =====================================================
   📋 GET /owners
   Listar dueños con filtro opcional (?filter=)
===================================================== */
exports.getOwners = async (req, res) => {
  try {
    const filter = req.query.filter;
    let owners;

    if (filter) {
      const regex = new RegExp(filter, "i");
      owners = await Owner.find({
        $or: [
          { full_name: regex },
          { email: regex },
          { phone: regex },
          { dni: regex },
          { address: regex },
        ],
      }).sort({ full_name: 1 });
    } else {
      owners = await Owner.find().sort({ full_name: 1 });
    }

    res.json(owners);
  } catch (err) {
    res.status(500).json({
      mensaje: "Error obteniendo dueños",
      error: err.message,
    });
  }
};

/* =====================================================
   ➕ POST /owners
   Registrar un nuevo dueño
===================================================== */
exports.createOwner = async (req, res) => {
  try {
    const { full_name, phone, email, dni, address } = req.body;

    // Validación básica (las validaciones de formato se harán en el frontend)
    if (!full_name || !phone || !dni || !address) {
      return res
        .status(400)
        .json({ mensaje: "Campos obligatorios faltantes" });
    }

    // Verificar duplicados
    if (email) {
      const existeEmail = await Owner.findOne({ email });
      if (existeEmail)
        return res
          .status(400)
          .json({ mensaje: "El correo ya está registrado" });
    }

    const existeDni = await Owner.findOne({ dni });
    if (existeDni)
      return res.status(400).json({ mensaje: "El DNI ya está registrado" });

    const newOwner = new Owner({ full_name, phone, email, dni, address });
    await newOwner.save();

    res
      .status(201)
      .json({ mensaje: "Dueño registrado correctamente", owner: newOwner });
  } catch (err) {
    res.status(500).json({
      mensaje: "Error creando dueño",
      error: err.message,
    });
  }
};

/* =====================================================
   ✏️ PUT /owners/:id
   Actualizar los datos de un dueño existente
===================================================== */
exports.updateOwner = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Owner.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updated)
      return res.status(404).json({ mensaje: "Dueño no encontrado" });

    res.json({ mensaje: "Dueño actualizado correctamente", owner: updated });
  } catch (err) {
    res.status(500).json({
      mensaje: "Error actualizando dueño",
      error: err.message,
    });
  }
};

/* =====================================================
   🗑️ DELETE /owners/:id
   Eliminar dueño (y sus mascotas asociadas)
===================================================== */
exports.deleteOwner = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Owner.findOneAndDelete({ _id: id });

    if (!deleted)
      return res.status(404).json({ mensaje: "Dueño no encontrado" });

    // 🐾 Las mascotas asociadas se eliminan automáticamente (middleware en Owner.js)
    res.json({
      mensaje: `Dueño "${deleted.full_name}" eliminado correctamente junto con sus mascotas asociadas.`,
    });
  } catch (err) {
    res.status(500).json({
      mensaje: "Error eliminando dueño",
      error: err.message,
    });
  }
};
