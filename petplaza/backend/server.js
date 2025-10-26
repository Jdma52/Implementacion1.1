// backend/server.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

// 📦 Rutas
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const ownerRoutes = require("./routes/owners");
const petRoutes = require("./routes/pets"); // 👈 RUTA ACTUALIZADA
const appointmentRoutes = require("./routes/appointments");
const dashboardRoutes = require("./routes/dashboard");
const servicioRoutes = require("./routes/servicioRoutes");
const facturaRoutes = require("./routes/facturaRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

/* =====================================================
   🌐 Middleware global
===================================================== */
app.use(cors());
app.use(express.json());

/* =====================================================
   💾 Conexión a MongoDB
===================================================== */
mongoose.set("strictQuery", true); // 🔹 Recomendado para versiones recientes
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB conectado correctamente"))
  .catch((err) =>
    console.error("❌ Error conectando a MongoDB:", err.message)
  );

/* =====================================================
   🚦 Rutas principales
===================================================== */
app.get("/api", (req, res) => {
  res.json({ ok: true, msg: "Backend funcionando correctamente" });
});

// 🔹 Rutas API
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/owners", ownerRoutes);
app.use("/api/pets", petRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/servicios", servicioRoutes);
app.use("/api/facturas", facturaRoutes);


/* 
// NO BORRAR ESTO SIRVE PARA EL DESPLIEGUE -DEPLOY EN RENDER
// ======= Servir FRONTEND (CRA) en PRODUCCIÓN =======
if (process.env.NODE_ENV === 'production') {
  const FE_DIR = path.join(__dirname, 'build'); // CRA
  app.use(express.static(FE_DIR));

  // Fallback para SPA (Express 5 compatible)
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(FE_DIR, 'index.html'));
  });
}
*/

require("dotenv").config();
console.log("🌍 FRONTEND_URL:", process.env.FRONTEND_URL);

/* =====================================================
   🚀 Iniciar servidor
===================================================== */
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
