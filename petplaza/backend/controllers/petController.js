const Pet = require("../models/Pet");
const Owner = require("../models/Owner");

// 📌 GET /pets (listar mascotas con filtro opcional ?filter=)
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

// 📌 POST /pets (registrar nueva mascota)
exports.createPet = async (req, res) => {
  try {
    const { nombre, especie, raza, nacimiento, sexo, peso, color, ownerId } = req.body;

    // Validar dueño
    const owner = await Owner.findById(ownerId);
    if (!owner) {
      return res.status(400).json({ mensaje: "Dueño no encontrado" });
    }

    // 🔹 Ajustar fecha para evitar desfase horario
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

    // Devolver mascota con info del dueño
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

// 📌 PUT /pets/:id (editar mascota)
exports.updatePet = async (req, res) => {
  try {
    const { id } = req.params;
    const { ownerId, nacimiento } = req.body;

    // Validar nuevo dueño si se cambia
    if (ownerId) {
      const owner = await Owner.findById(ownerId);
      if (!owner) {
        return res.status(400).json({ mensaje: "Dueño no encontrado" });
      }
    }

    // 🔹 Normalizar fecha si viene en la petición
    if (nacimiento) {
      const fechaNacimiento = new Date(nacimiento);
      fechaNacimiento.setUTCHours(0, 0, 0, 0);
      req.body.nacimiento = fechaNacimiento;
    }

    const pet = await Pet.findByIdAndUpdate(id, req.body, { new: true }).populate(
      "ownerId",
      "full_name email phone dni address"
    );

    if (!pet) return res.status(404).json({ mensaje: "Mascota no encontrada" });

    res.json({ mensaje: "Mascota actualizada correctamente", pet });
  } catch (err) {
    res.status(500).json({
      mensaje: "Error actualizando mascota",
      error: err.message,
    });
  }
};

// 📌 DELETE /pets/:id (eliminar mascota)
exports.deletePet = async (req, res) => {
  try {
    const { id } = req.params;
    const pet = await Pet.findByIdAndDelete(id);

    if (!pet) return res.status(404).json({ mensaje: "Mascota no encontrada" });

    res.json({ mensaje: "Mascota eliminada correctamente" });
  } catch (err) {
    res.status(500).json({
      mensaje: "Error eliminando mascota",
      error: err.message,
    });
  }
};
