const mongoose = require("mongoose");
const Owner = require("./Owner");
const Pet = require("./Pet");

//  ESQUEMA UNIFICADO: CITAS + DASHBOARD

const appointmentSchema = new mongoose.Schema(
  {
     // DATOS DE CITA
  
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      required: true,
    },
    petId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pet",
      required: true,
    },
    vetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    motivo: {
      type: String,
      trim: true,
    },
    fecha: {
      type: String, // formato YYYY-MM-DD
      required: true,
    },
    hora: {
      type: String, // formato HH:mm
      match: /^\d{2}:\d{2}$/,
      required: true,
    },
    estado: {
      type: String,
      enum: ["programada", "completada", "cancelada"],
      default: "programada",
    },

    // =============================
    //  DATOS PARA DASHBOARD
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

    // Citas recientes 
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
//  ÍNDICES Y CONFIGURACIONES
// ======================================================
appointmentSchema.index({ vetId: 1, fecha: 1, hora: 1 }, { unique: false });
appointmentSchema.index({ generatedAt: -1 });


   // FUNCIÓN DE LIMPIEZA DE CITAS HUÉRFANAS

async function limpiarCitasHuerfanas() {
  try {
    const Appointment = mongoose.model("Appointment");

    // Obtener IDs válidos
    const owners = await Owner.find({}, "_id");
    const pets = await Pet.find({}, "_id");

    const ownerIds = owners.map((o) => o._id.toString());
    const petIds = pets.map((p) => p._id.toString());

    const citas = await Appointment.find({});
    let eliminadas = 0;

    for (const cita of citas) {
      const ownerOk = ownerIds.includes(cita.ownerId?.toString());
      const petOk = petIds.includes(cita.petId?.toString());

      if (!ownerOk || !petOk) {
        await Appointment.findByIdAndDelete(cita._id);
        eliminadas++;
      }
    }

    if (eliminadas > 0) {
      console.log(`🧹 ${eliminadas} citas huérfanas eliminadas automáticamente.`);
    }
  } catch (err) {
    console.error("❌ Error limpiando citas huérfanas:", err.message);
  }
}

// ======================================================
//  Hook global: limpieza automática al iniciar el servidor
// ======================================================
mongoose.connection.once("open", () => {
  limpiarCitasHuerfanas(); // Limpieza inicial
  // Ejecuta cada 2 minutos para mantener la BD limpia
  setInterval(limpiarCitasHuerfanas, 120000);
});

// ======================================================
//  EXPORTACIÓN DEL MODELO UNIFICADO
// ======================================================
module.exports = mongoose.model("Appointment", appointmentSchema);
