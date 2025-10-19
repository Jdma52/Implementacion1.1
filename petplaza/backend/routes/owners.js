// backend/routes/owners.js
const express = require("express");
const {
  getOwners,
  createOwner,
  updateOwner,
  deleteOwner,
} = require("../controllers/ownerController");

const router = express.Router();

/* =====================================================
   👤 RUTAS DE DUEÑOS (OWNERS)
   Base: /api/owners
===================================================== */

// 📋 Obtener todos los dueños (con filtro opcional ?filter=)
router.get("/", getOwners);

// ➕ Registrar nuevo dueño
router.post("/", createOwner);

// ✏️ Actualizar dueño existente
router.put("/:id", updateOwner);

// 🗑️ Eliminar dueño (y sus mascotas asociadas)
router.delete("/:id", deleteOwner);

module.exports = router;
