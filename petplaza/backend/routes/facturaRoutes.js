// backend/routes/facturaRoutes.js
const express = require("express");
const router = express.Router();
const facturaController = require("../controllers/facturaController");

router.get("/", facturaController.obtenerFacturas);
router.post("/", facturaController.crearFactura);
router.put("/:id", facturaController.actualizarFactura);
router.put("/:id/estado", facturaController.actualizarEstadoFactura);
router.delete("/:id", facturaController.eliminarFactura);
router.get("/loteActivo", facturaController.estadoLoteActivo);

module.exports = router;
