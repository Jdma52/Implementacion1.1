const Owner = require("../models/Owner");
const Pet = require("../models/Pet");
const Appointment = require("../models/Appointment");
const Product = require("../models/Product");
const { formatInTimeZone } = require("date-fns-tz");

exports.getDashboardData = async (req, res) => {
  try {
    // Contadores generales
    const ownersCount = await Owner.countDocuments();
    const petsCount = await Pet.countDocuments();
    const appointmentsCount = await Appointment.countDocuments();

    // 🔹 Productos con stock bajo (quantity < minStock)
    const lowStockItems = await Product.find({
      $expr: { $lt: ["$quantity", "$minStock"] },
    })
      .sort({ quantity: 1 })
      .limit(10) 
      .lean();

    // 🔹 Citas recientes con conversión de zona horaria
    const timeZone = "America/Tegucigalpa";
    const recentAppointments = await Appointment.find()
      .populate("ownerId petId", "full_name nombre")
      .sort({ fecha: -1 })
      .limit(5)
      .lean();

    // 🔹 Convertir cada fecha a hora local de Honduras
    const recentAppointmentsLocal = recentAppointments.map((a) => ({
      ...a,
      fechaLocal: formatInTimeZone(a.fecha, timeZone, "yyyy-MM-dd HH:mm:ss"),
    }));

    // 🔹 Respuesta final del dashboard
    res.json({
      success: true,
      ownersCount,
      petsCount,
      appointmentsCount,
      lowStock: lowStockItems.length,
      lowStockItems,
      recentAppointments: recentAppointmentsLocal,
    });
  } catch (error) {
    console.error("Error al obtener datos del dashboard:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener datos del dashboard",
    });
  }
};
