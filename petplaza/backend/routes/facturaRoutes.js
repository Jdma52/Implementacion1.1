// facturaRoutes.js 
const express = require("express");
const router = express.Router();
const facturaController = require("../controllers/facturaController");

router.post("/", facturaController.createFactura);
router.get("/", facturaController.getFacturas);
router.get("/:id", facturaController.getFacturaById);
router.delete("/:id", facturaController.deleteFactura);


router.put("/:id/estado", facturaController.updateEstadoFactura);

module.exports = router;

