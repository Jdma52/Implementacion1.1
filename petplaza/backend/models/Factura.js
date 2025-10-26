const mongoose = require("mongoose");

// Contador autoincremental para número de factura
const counterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
});
const Counter = mongoose.model("Counter", counterSchema);

// Esquema principal de Factura
const facturaSchema = new mongoose.Schema(
  {
    numero: { type: Number, unique: true },
    fecha: { type: Date, default: Date.now },
    cliente: {
      ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "Owner", required: true },
      nombre: { type: String, required: true },
      rtn: { type: String, default: "" },
      email: { type: String, default: "" },
      telefono: { type: String, default: "" },
    },
    mascota: {
      petId: { type: mongoose.Schema.Types.ObjectId, ref: "Pet", required: true },
      nombre: { type: String, required: true },
      especie: { type: String },
      raza: { type: String },
    },
    servicios: [
      {
        servicioId: { type: mongoose.Schema.Types.ObjectId, ref: "Servicio", required: true },
        nombre: String,
        precio: Number,
        cantidad: Number,
        subtotal: Number,
      },
    ],
    productos: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        nombre: String,
        precio: Number,
        cantidad: Number,
        subtotal: Number,
      },
    ],
    subtotal: Number,
    impuesto: Number,
    total: Number,
    estado: {
      type: String,
      enum: ["Pagado", "Pendiente"],
      default: "Pendiente",
    },
    metodoPago: {
      type: String,
      enum: ["Efectivo", "Tarjeta", "Transferencia"],
      required: true,
    },
  },
  { timestamps: true }
);

//  Middleware autoincremental del número de factura
facturaSchema.pre("save", async function (next) {
  if (this.isNew) {
    const counter = await Counter.findOneAndUpdate(
      { name: "factura" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.numero = counter.seq;
  }
  next();
});

module.exports = mongoose.model("Factura", facturaSchema);
