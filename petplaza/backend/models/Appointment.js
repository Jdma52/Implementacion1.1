const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
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
      required: true,
      trim: true,
    },
    fecha: {
      
      type: String, 
      required: true,
    },
    hora: {
      type: String, 
      required: true,
      match: /^\d{2}:\d{2}$/,
    },
    estado: {
      type: String,
      enum: ["programada", "completada", "cancelada"],
      default: "programada",
    },
  },
  { timestamps: true }
);


appointmentSchema.index({ vetId: 1, fecha: 1, hora: 1 }, { unique: true });

module.exports = mongoose.model("Appointment", appointmentSchema);
