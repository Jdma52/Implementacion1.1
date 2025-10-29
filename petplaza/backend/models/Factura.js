const mongoose = require("mongoose");

const facturaSchema = new mongoose.Schema(
  {
    cliente: {
      ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Owner",
        required: true,
      },
      nombre: { type: String, required: true, trim: true },
      rtn: { type: String, default: "" },
      email: { type: String, default: "" },
      telefono: { type: String, default: "" },
    },

    mascota: {
      petId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Pet",
        required: true,
      },
      nombre: { type: String, required: true, trim: true },
      especie: { type: String, default: "" },
      raza: { type: String, default: "" },
    },

servicios: [
  {
    servicioId: { type: mongoose.Schema.Types.ObjectId, ref: "Servicio" },
    nombre: String,
    precio: Number,
    cantidad: { type: Number, default: 1 },
    subtotal: Number,
  },
],
    productos: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        nombre: String,
        precio: Number,
        cantidad: Number,
        subtotal: Number,
      },
    ],
    // === NUEVOS CAMPOS DE DESCUENTO ===
    descuentoTipo: {
      type: String,
      enum: ["monto", "porcentaje"],
      default: "monto",
    },
    descuentoValor: { type: Number, default: 0 }, // valor ingresado 
    descuentoTotal: { type: Number, default: 0 }, // monto calculado
    baseImponible: { type: Number, default: 0 },  // subtotal - descuentoTotal

    // === CAMPOS FISCALES (HONDURAS) ===
    cai: { type: String, default: "" },
    caiRangoDesde: { type: String, default: "" },
    caiRangoHasta: { type: String, default: "" },
    caiFechaLimite: { type: Date },

    // === CAMPOS TOTALES ===
    subtotal: { type: Number, required: true },
    impuesto: { type: Number, required: true },
    total: { type: Number, required: true },

    estado: { type: String, default: "Pendiente" },
    metodoPago: { type: String, default: "Efectivo" },
    numero: { type: Number, required: true },
    fecha: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// ======== CÁLCULO AUTOMÁTICO OPCIONAL ========
facturaSchema.pre("save", function (next) {
  const subtotal = this.subtotal || 0;
  const valor = this.descuentoValor || 0;
  let descuentoTotal = 0;

  if (this.descuentoTipo === "porcentaje") {
    descuentoTotal = Math.min(subtotal * (valor / 100), subtotal);
  } else {
    descuentoTotal = Math.min(valor, subtotal);
  }

  this.descuentoTotal = descuentoTotal;
  this.baseImponible = subtotal - descuentoTotal;
  this.impuesto = this.baseImponible * 0.15;
  this.total = this.baseImponible + this.impuesto;

  next();
});

module.exports = mongoose.model("Factura", facturaSchema);
