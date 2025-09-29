// backend/server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB conectado'))
.catch((err) => console.error('❌ Error conectando a MongoDB:', err));

// Ruta de prueba
app.get('/api', (req, res) => {
    res.json({ ok: true, msg: 'Backend funcionando correctamente' });
});

// Rutas API
app.get('/api', (req, res) => {
  res.json({ ok: true, msg: 'Backend funcionando correctamente' });
});
app.use('/api/auth', authRoutes);
const userRoutes = require("./routes/users");
app.use("/api/users", userRoutes);

/* 
// NO BORRAR ESTO SIRVE PARA EL DESPLIEGUE -DEPLOYD EN RENDER
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

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});