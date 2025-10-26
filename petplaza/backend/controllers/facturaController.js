// ==========================================================
// 📘 facturaController.js — Controlador funcional y validado
// ==========================================================

const Factura = require("../models/Factura");
const Owner = require("../models/Owner");
const Pet = require("../models/Pet");
const Product = require("../models/Product");
const Servicio = require("../models/Servicio");

// 🧾 Crear nueva factura
exports.createFactura = async (req, res) => {
  try {
    const {
      cliente,
      mascota,
      servicios = [],
      productos = [],
      subtotal,
      impuesto,
      total,
      estado,
      metodoPago,
    } = req.body;

    // Validaciones básicas
    if (!cliente?.ownerId || !mascota?.petId) {
      return res.status(400).json({
        mensaje: "Datos incompletos: cliente y mascota son requeridos",
      });
    }

    // Validar propietario
    const owner = await Owner.findById(cliente.ownerId);
    if (!owner) return res.status(404).json({ mensaje: "Cliente no encontrado" });

    // Validar mascota
    const pet = await Pet.findById(mascota.petId);
    if (!pet) return res.status(404).json({ mensaje: "Mascota no encontrada" });

    // Validar servicios
    const serviciosValidados = await Promise.all(
      servicios.map(async (s) => {
        const serv = await Servicio.findById(s.servicioId).catch(() => null);
        if (!serv) return null;

        const cantidad = s.cantidad || 1;
        const precio = serv.precio || 0;

        return {
          servicioId: serv._id,
          nombre: serv.nombre,
          precio,
          cantidad,
          subtotal: precio * cantidad,
        };
      })
    );

    // Validar productos
    const productosValidados = await Promise.all(
      productos.map(async (p) => {
        const prod = await Product.findById(p.productId).catch(() => null);
        if (!prod) return null;

        const cantidad = p.cantidad || 1;
        const precio = prod.price || 0;

        return {
          productId: prod._id,
          nombre: prod.name,
          precio,
          cantidad,
          subtotal: precio * cantidad,
        };
      })
    );

    // Crear factura
    const nuevaFactura = new Factura({
      cliente: {
        ownerId: owner._id,
        nombre: owner.full_name,
        rtn: cliente.rtn || "",
        email: owner.email,
        telefono: owner.phone,
      },
      mascota: {
        petId: pet._id,
        nombre: pet.nombre,
        especie: pet.especie,
        raza: pet.raza,
      },
      servicios: serviciosValidados.filter(Boolean),
      productos: productosValidados.filter(Boolean),
      subtotal: subtotal || 0,
      impuesto: impuesto || 0,
      total: total || 0,
      estado: estado || "Pendiente",
      metodoPago: metodoPago || "Efectivo",
    });

    await nuevaFactura.save();

    res.status(201).json({
      mensaje: "Factura creada exitosamente",
      factura: nuevaFactura,
    });
  } catch (error) {
    console.error("❌ Error creando factura:", error);
    res.status(500).json({
      mensaje: "Error interno del servidor al crear factura",
      error: error.message,
    });
  }
};

// ==========================================================
// 📋 Obtener todas las facturas
// ==========================================================
exports.getFacturas = async (req, res) => {
  try {
    const facturas = await Factura.find()
      .populate("cliente.ownerId", "full_name phone email")
      .populate("mascota.petId", "nombre especie raza")
      .populate("servicios.servicioId", "nombre precio")
      .populate("productos.productId", "name price category");

    res.json(facturas);
  } catch (error) {
    console.error("❌ Error obteniendo facturas:", error);
    res.status(500).json({
      mensaje: "Error al obtener facturas",
      error: error.message,
    });
  }
};

// ==========================================================
// 🔍 Obtener factura por ID
// ==========================================================
exports.getFacturaById = async (req, res) => {
  try {
    const factura = await Factura.findById(req.params.id)
      .populate("cliente.ownerId", "full_name phone email")
      .populate("mascota.petId", "nombre especie raza")
      .populate("servicios.servicioId", "nombre precio")
      .populate("productos.productId", "name price category");

    if (!factura) return res.status(404).json({ mensaje: "Factura no encontrada" });

    res.json(factura);
  } catch (error) {
    console.error("❌ Error obteniendo factura:", error);
    res.status(500).json({
      mensaje: "Error al obtener la factura",
      error: error.message,
    });
  }
};

// ==========================================================
// 🗑️ Eliminar factura
// ==========================================================
exports.deleteFactura = async (req, res) => {
  try {
    const factura = await Factura.findByIdAndDelete(req.params.id);
    if (!factura) return res.status(404).json({ mensaje: "Factura no encontrada" });

    res.json({ mensaje: "Factura eliminada exitosamente" });
  } catch (error) {
    console.error("❌ Error eliminando factura:", error);
    res.status(500).json({
      mensaje: "Error al eliminar la factura",
      error: error.message,
    });
  }
};


exports.updateEstadoFactura = async (req,res)=>{
  const { id } = req.params;
  const { estado } = req.body;
  const f = await Factura.findByIdAndUpdate(id, { estado }, { new:true });
  if(!f) return res.status(404).json({ mensaje:'Factura no encontrada' });
  res.json(f);
};

exports.updateEstadoFactura = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const factura = await Factura.findByIdAndUpdate(id, { estado }, { new: true });
    if (!factura) return res.status(404).json({ mensaje: "Factura no encontrada" });
    res.json(factura);
  } catch (error) {
    console.error("❌ Error actualizando estado:", error);
    res.status(500).json({
      mensaje: "Error al actualizar el estado de la factura",
      error: error.message,
    });
  }
};
