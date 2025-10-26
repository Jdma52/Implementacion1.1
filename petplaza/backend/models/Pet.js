// backend/models/Pet.js
const mongoose = require("mongoose");

const petSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, "El nombre de la mascota es obligatorio"],
      trim: true,
    },
    especie: {
      type: String,
      required: [true, "La especie es obligatoria"],
      enum: [
        "Perro",
        "Gato",
        "Conejo",
        "Hamster",
        "Ave",
        "Tortuga",
        "Pez",
        "Exotico",
        "Otros",
      ],
    },
    raza: {
      type: String,
      trim: true,
      default: "",
    },
    nacimiento: {
      type: Date,
      default: null,
    },
    sexo: {
      type: String,
      enum: ["Macho", "Hembra"],
      required: [true, "El sexo es obligatorio"],
    },
    peso: {
      type: Number,
      min: [0, "El peso no puede ser negativo"],
      default: 0,
    },
    color: {
      type: String,
      trim: true,
      default: "",
    },
    // 🔹 Relación con Dueño
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      required: [true, "La mascota debe estar asociada a un dueño"],
    },
  },
  { timestamps: true }
);

// 🔹 Índices de búsqueda optimizados
petSchema.index({
  nombre: "text",
  especie: "text",
  raza: "text",
  color: "text",
});

module.exports = mongoose.model("Pet", petSchema);
