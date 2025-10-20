const Owner = require("../models/Owner");
const Pet = require("../models/Pet");
const Appointment = require("../models/Appointment");
const Product = require("../models/Product");

exports.getDashboardData = async (req, res) => {
  try {
    
    const ownersCount = await Owner.countDocuments();
    const petsCount = await Pet.countDocuments();
    const appointmentsCount = await Appointment.countDocuments();

    
    const lowStockItems = await Product.find({ cantidad: { $lt: 5 } })
      .sort({ cantidad: 1 })
      .limit(5);

    
    const recentAppointments = await Appointment.find()
      .populate("ownerId petId", "full_name nombre")
      .sort({ fecha: -1 })
      .limit(5);

    res.json({
      success: true,
      ownersCount,
      petsCount,
      appointmentsCount,
      lowStock: lowStockItems.length,
      lowStockItems,
      recentAppointments,
    });
  } catch (error) {
    console.error("Error al obtener datos del dashboard:", error);
    res.status(500).json({ success: false, message: "Error al obtener datos del dashboard" });
  }
};
