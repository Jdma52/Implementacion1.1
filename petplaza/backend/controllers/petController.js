// backend/controllers/petController.js
const Pet = require("../models/Pet");
const Owner = require("../models/Owner");

/* =====================================================
   📦 GET /pets
   Listar todas las mascotas (con filtro opcional)
===================================================== */
exports.getPets = async (req, res) => {
  try {
    const { filter } = req.query;
    let query = {};

    if (filter) {
      const regex = new RegExp(filter, "i");
      query = {
        $or: [
          { nombre: regex },
          { especie: regex },
          { raza: regex },
          { color: regex },
        ],
      };
    }

    const pets = await Pet.find(query)
      .populate("ownerId", "full_name email phone dni address")
      .sort({ createdAt: -1 });

    res.json(pets);
  } catch (err) {
    res.status(500).json({
      mensaje: "Error obteniendo mascotas",
      error: err.message,
    });
  }
};

/* =====================================================
   📦 GET /pets/by-owner/:id
   Listar mascotas asociadas a un dueño específico
===================================================== */
exports.getPetsByOwner = async (req, res) => {
  try {
    const { id } = req.params;
    const owner = await Owner.findById(id);

    if (!owner)
      return res.status(404).json({ mensaje: "Dueño no encontrado" });

    const pets = await Pet.find({ ownerId: id }).populate(
      "ownerId",
      "full_name email phone dni address"
    );

    res.json(pets);
  } catch (err) {
    res.status(500).json({
      mensaje: "Error obteniendo mascotas del dueño",
      error: err.message,
    });
  }
};

/* =====================================================
   🐾 POST /pets
   Registrar nueva mascota asociada a un dueño
===================================================== */
exports.createPet = async (req, res) => {
  try {
    const { nombre, especie, raza, nacimiento, sexo, peso, color, ownerId } =
      req.body;

    // 🔹 Validar existencia del dueño
    const owner = await Owner.findById(ownerId);
    if (!owner)
      return res.status(400).json({ mensaje: "Dueño no encontrado" });

    // 🔹 Normalizar fecha de nacimiento
    let fechaNacimiento = nacimiento ? new Date(nacimiento) : null;
    if (fechaNacimiento) fechaNacimiento.setUTCHours(0, 0, 0, 0);

    const nuevaMascota = new Pet({
      nombre,
      especie,
      raza,
      nacimiento: fechaNacimiento,
      sexo,
      peso,
      color,
      ownerId,
    });

    await nuevaMascota.save();

    const mascotaConDueño = await Pet.findById(nuevaMascota._id).populate(
      "ownerId",
      "full_name email phone dni address"
    );

    res.status(201).json({
      mensaje: "Mascota registrada correctamente",
      mascota: mascotaConDueño,
    });
  } catch (err) {
    res.status(500).json({
      mensaje: "Error registrando mascota",
      error: err.message,
    });
  }
};

/* =====================================================
   ✏️ PUT /pets/:id
   Editar información de una mascota
===================================================== */
exports.updatePet = async (req, res) => {
  try {
    const { id } = req.params;
    const { ownerId, nacimiento } = req.body;

    // 🔹 Validar nuevo dueño si cambia
    if (ownerId) {
      const owner = await Owner.findById(ownerId);
      if (!owner)
        return res.status(400).json({ mensaje: "Dueño no encontrado" });
    }

    // 🔹 Normalizar fecha
    if (nacimiento) {
      const fecha = new Date(nacimiento);
      fecha.setUTCHours(0, 0, 0, 0);
      req.body.nacimiento = fecha;
    }

    const pet = await Pet.findByIdAndUpdate(id, req.body, { new: true }).populate(
      "ownerId",
      "full_name email phone dni address"
    );

    if (!pet)
      return res.status(404).json({ mensaje: "Mascota no encontrada" });

    res.json({ mensaje: "Mascota actualizada correctamente", pet });
  } catch (err) {
    res.status(500).json({
      mensaje: "Error actualizando mascota",
      error: err.message,
    });
  }
};

/* =====================================================
   🗑️ DELETE /pets/:id
   Eliminar una mascota
===================================================== */
exports.deletePet = async (req, res) => {
  try {
    const { id } = req.params;
    const pet = await Pet.findByIdAndDelete(id);

    if (!pet)
      return res.status(404).json({ mensaje: "Mascota no encontrada" });

    res.json({ mensaje: "Mascota eliminada correctamente" });
  } catch (err) {
    res.status(500).json({
      mensaje: "Error eliminando mascota",
      error: err.message,
    });
  }
};
