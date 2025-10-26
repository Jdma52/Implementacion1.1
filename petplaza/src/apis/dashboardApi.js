const express = require("express");
const router = express.Router();
const Pet = require("../models/Pet");
const Owner = require("../models/Owner");
const Appointment = require("../models/Appointment");
const Product = require("../models/Product"); 


router.get("/", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    
    const petsToday = await Pet.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow },
    });

    const ownersToday = await Owner.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow },
    });

    const appointmentsToday = await Appointment.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow },
    });

    
    const lowStockProducts = await Product.find({ stock: { $lt: 10 } })
      .sort({ stock: 1 })
      .limit(5);

    
    const recentAppointments = await Appointment.find()
      .populate("petId ownerId", "nombre full_name")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        petsToday,
        ownersToday,
        appointmentsToday,
        lowStockProducts,
        recentAppointments,
      },
    });
  } catch (err) {
    console.error("Error cargando dashboard:", err);
    res.status(500).json({ success: false, message: "Error cargando dashboard", error: err.message });
  }
});

module.exports = router;
