const mongoose = require("mongoose");

const usuarioSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  full_name: { type: String, required: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ["admin", "veterinario", "laboratorio", "farmacia", "recepcion"], 
    default: "veterinario" 
  },
  is_active: { type: Boolean, default: true },

  // 🔐 Campos para 2FA
  is2FAEnabled: { type: Boolean, default: true },
  otpCode: { type: String },
  otpExpires: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model("Usuario", usuarioSchema);