const mongoose = require("mongoose");

// ======================================================
// 📘 ESQUEMA UNIFICADO: CITAS + DASHBOARD
// ======================================================
const appointmentSchema = new mongoose.Schema(
  {
    // =============================
    // 🔹 SECCIÓN: DATOS DE CITA
    // =============================
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
    },
    petId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pet",
    },
    vetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
    },
    motivo: {
      type: String,
      trim: true,
    },
    fecha: {
      type: String, // formato YYYY-MM-DD
    },
    hora: {
      type: String, // formato HH:mm
      match: /^\d{2}:\d{2}$/,
    },
    estado: {
      type: String,
      enum: ["programada", "completada", "cancelada"],
      default: "programada",
    },

    // =============================
    // 🔹 SECCIÓN: DATOS DE DASHBOARD
    // =============================

    // Contadores generales
    ownersCount: { type: Number, default: 0 },
    petsCount: { type: Number, default: 0 },
    appointmentsCount: { type: Number, default: 0 },

    // Productos con stock bajo
    lowStock: { type: Number, default: 0 },
    lowStockItems: [
      {
        nombre: { type: String, trim: true },
        categoria: { type: String, trim: true },
        cantidad: { type: Number, default: 0 },
        precio: { type: Number, default: 0 },
        proveedor: { type: String, trim: true },
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
      },
    ],

    // Citas recientes (resumen)
    recentAppointments: [
      {
        ownerId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Owner",
        },
        petId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Pet",
        },
        vetId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Usuario",
        },
        motivo: { type: String, trim: true },
        fecha: { type: Date },
        fechaLocal: { type: String },
        estado: {
          type: String,
          enum: ["programada", "completada", "cancelada"],
          default: "programada",
        },
      },
    ],

    // Fecha de generación (para dashboard)
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// ======================================================
// 🔸 ÍNDICES Y CONFIGURACIONES
// ======================================================

// índice único para evitar duplicación de citas
appointmentSchema.index({ vetId: 1, fecha: 1, hora: 1 }, { unique: false });

// índice para buscar dashboards recientes
appointmentSchema.index({ generatedAt: -1 });

// ======================================================
// 📦 EXPORTACIÓN DEL MODELO UNIFICADO
// ======================================================
module.exports = mongoose.model("Appointment", appointmentSchema);
