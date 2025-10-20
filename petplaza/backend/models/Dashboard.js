const mongoose = require('mongoose');

const DashboardSchema = new mongoose.Schema({
  date: { type: Date, required: true, default: Date.now },
  petsCount: { type: Number, default: 0 },
  ownersCount: { type: Number, default: 0 },
  appointmentsCount: { type: Number, default: 0 },
  lowStockCount: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Dashboard', DashboardSchema);
