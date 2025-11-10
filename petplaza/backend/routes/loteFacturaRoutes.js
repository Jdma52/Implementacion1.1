// routes/loteFacturaRoutes.js
const express = require("express");
const router = express.Router();
const LoteFactura = require("../models/LoteFactura");

// ======================================================
//  OBTENER TODOS LOS LOTES REGISTRADOS
// ======================================================
router.get("/", async (req, res) => {
  try {
    const lotes = await LoteFactura.find().sort({ createdAt: -1 });
    res.status(200).json(lotes);
  } catch (error) {
    console.error("❌ Error obteniendo lotes:", error);
    res.status(500).json({ mensaje: "Error obteniendo lotes" });
  }
});

// ======================================================
//  CREAR NUEVO LOTE CAI (ADMIN)
// ======================================================
router.post("/", async (req, res) => {
  try {
    const { cai, rangoDesde, rangoHasta } = req.body;

    // Validaciones básicas
    if (!cai || !rangoDesde || !rangoHasta) {
      return res.status(400).json({ mensaje: "Campos requeridos faltantes." });
    }

    const regexCAI = /^[A-Z0-9-]{10,40}$/;
    const regexRango = /^\d{3}-\d{3}-\d{2}-\d{8}$/;

    if (!regexCAI.test(cai))
      return res
        .status(400)
        .json({ mensaje: "Formato de CAI inválido. Use letras, números y guiones (10 a 40 caracteres)." });

    if (!regexRango.test(rangoDesde) || !regexRango.test(rangoHasta))
      return res
        .status(400)
        .json({ mensaje: "Formato de rango inválido. Use 000-001-01-00000001" });

    // Fecha límite = 10 meses desde hoy (SAR)
    const fechaAutorizacion = new Date();
    const fechaLimite = new Date();
    fechaLimite.setMonth(fechaAutorizacion.getMonth() + 10);

    // Desactivar todos los lotes actuales primero
    await LoteFactura.updateMany({}, { $set: { activo: false } });

    // Crear nuevo lote
    const nuevoLote = new LoteFactura({
      cai,
      rangoDesde,
      rangoHasta,
      correlativoActual: 0,
      fechaAutorizacion,
      fechaLimite,
      activo: true,
    });

    await nuevoLote.save();

    res.status(201).json({
      mensaje: "✅ Lote creado y activado correctamente",
      lote: nuevoLote,
    });
  } catch (error) {
    console.error("❌ Error creando lote:", error);
    res.status(500).json({ mensaje: "Error creando lote" });
  }
});

// ======================================================
// ACTIVAR UN LOTE EXISTENTE (ADMIN)
// ======================================================
router.put("/:id/activar", async (req, res) => {
  try {
    const { id } = req.params;

    // Desactivar todos los lotes
    await LoteFactura.updateMany({}, { $set: { activo: false } });

    // Activar el lote solicitado
    const lote = await LoteFactura.findByIdAndUpdate(
      id,
      { activo: true },
      { new: true }
    );

    if (!lote) return res.status(404).json({ mensaje: "Lote no encontrado" });

    res.status(200).json({
      mensaje: "✅ Lote activado correctamente",
      lote,
    });
  } catch (error) {
    console.error("❌ Error activando lote:", error);
    res.status(500).json({ mensaje: "Error activando lote" });
  }
});

// ======================================================
//  (OPCIONAL) ELIMINAR LOTE - SOLO PARA DESARROLLO
// ======================================================
//  No debe usarse en producción. Solo para limpiar base de pruebas.
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const eliminado = await LoteFactura.findByIdAndDelete(id);
    if (!eliminado) return res.status(404).json({ mensaje: "Lote no encontrado" });
    res.status(200).json({ mensaje: "🗑️ Lote eliminado (solo uso técnico)" });
  } catch (error) {
    console.error("❌ Error eliminando lote:", error);
    res.status(500).json({ mensaje: "Error eliminando lote" });
  }
});

module.exports = router;
