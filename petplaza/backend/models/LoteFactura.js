// models/LoteFactura.js
const mongoose = require("mongoose");

/**
 * Representa un rango autorizado de facturas (CAI) del SAR Honduras.
 * Cada factura emitida incrementa correlativoActual de este lote.
 */
const loteFacturaSchema = new mongoose.Schema(
  {
    cai: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 20,
      maxlength: 40,
    },

    rangoDesde: {
      type: String,
      required: true,
      match: /^\d{3}-\d{3}-\d{2}-\d{8}$/,
    },

    rangoHasta: {
      type: String,
      required: true,
      match: /^\d{3}-\d{3}-\d{2}-\d{8}$/,
    },

    correlativoActual: {
      type: Number,
      default: 0,
      min: 0,
    },

    fechaAutorizacion: {
      type: Date,
      default: Date.now,
    },

    fechaLimite: {
      type: Date,
      required: true,
    },

    activo: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

/**
 * 🔄 Método: obtenerSiguienteNumero()
 * Devuelve el siguiente número correlativo del lote,
 * validando rango y desactivando si se excede.
 */
loteFacturaSchema.methods.obtenerSiguienteNumero = function () {
  const inicio = parseInt(this.rangoDesde.split("-").pop());
  const fin = parseInt(this.rangoHasta.split("-").pop());

  // Calcular correlativo real (sumar +1 para iniciar en rangoDesde + 1)
  const correlativoReal = inicio + this.correlativoActual + 1;

  // Validar límite de rango
  if (correlativoReal > fin) {
    this.activo = false;
    throw new Error("Se alcanzó el límite del rango CAI autorizado.");
  }

  // Incrementar correlativo y devolver número formateado
  this.correlativoActual += 1;

  const correlativoTexto = `000-001-01-${String(correlativoReal).padStart(8, "0")}`;
  return { numero: this.correlativoActual, correlativoTexto };
};

module.exports = mongoose.model("LoteFactura", loteFacturaSchema);
