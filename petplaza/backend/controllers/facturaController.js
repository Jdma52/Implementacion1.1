// backend/controllers/facturaController.js
const Factura = require("../models/Factura");
const Owner = require("../models/Owner");
const Pet = require("../models/Pet");
const Servicio = require("../models/Servicio");
const Product = require("../models/Product");
const LoteFactura = require("../models/LoteFactura");


/* ======================================================
    Crear nueva factura
====================================================== */
exports.crearFactura = async (req, res) => {
  try {
    const {
      cliente,
      mascota,
      servicios = [],
      productos = [],
      descuentoTipo = "monto",
      descuentoValor = 0,
      metodoPago,
      estado,
    } = req.body;


    // === Validar cliente y mascota ===
    const owner = await Owner.findById(cliente?.ownerId);
    const pet = await Pet.findById(mascota?.petId);


    if (!owner || !pet)
      return res.status(400).json({ mensaje: "Cliente o mascota no válidos" });


    // === Buscar lote activo ===
    const loteActivo = await LoteFactura.findOne({ activo: true });
    if (!loteActivo)
      return res.status(400).json({
        mensaje: "No hay lote CAI activo. No se puede generar factura.",
      });


    // === Calcular correlativo ===
    const correlativo = (loteActivo.correlativoActual || 0) + 1;
if (correlativo > parseInt(loteActivo.rangoHasta.split("-").pop())) {
      return res
        .status(400)
        .json({ mensaje: "El rango del CAI activo ha sido agotado." });
    }


    /* ======================================================
       Validar y procesar servicios
    ====================================================== */
    const serviciosProcesados = await Promise.all(
      servicios.map(async (s) => {
        try {
          const serv = await Servicio.findById(s.servicioId);
          const cantidad = Number(s.cantidad || 1);
          const precio = Number(serv?.precio ?? s.precio ?? 0);
          return {
            servicioId: serv?._id || s.servicioId,
            nombre: serv?.nombre || s.nombre || "Servicio",
            precio,
            cantidad,
            subtotal: precio * cantidad,
          };
        } catch {
          // Si el servicio no se encuentra, igual se incluye
          const cantidad = Number(s.cantidad || 1);
          const precio = Number(s.precio ?? 0);
          return {
            servicioId: s.servicioId || null,
            nombre: s.nombre || "Servicio",
            precio,
            cantidad,
            subtotal: precio * cantidad,
          };
        }
      })
    );


    /* ======================================================
       Validar y procesar productos
    ====================================================== */
    const productosProcesados = await Promise.all(
      productos.map(async (p) => {
        try {
          const prod = await Product.findById(p.productId);
          const cantidad = Number(p.cantidad || 1);
          const precio = Number(prod?.price ?? prod?.precio ?? p.precio ?? 0);
          return {
            productId: prod?._id || p.productId,
            nombre: prod?.name || prod?.nombre || p.nombre || "Producto",
            precio,
            cantidad,
            subtotal: precio * cantidad,
          };
        } catch {
          const cantidad = Number(p.cantidad || 1);
          const precio = Number(p.precio ?? 0);
          return {
            productId: p.productId || null,
            nombre: p.nombre || "Producto",
            precio,
            cantidad,
            subtotal: precio * cantidad,
          };
        }
      })
    );
    /* ======================================================
       Calcular totales
    ====================================================== */
    const subtotalServicios = serviciosProcesados.reduce(
      (a, s) => a + (s.subtotal || 0),
      0
    );
    const subtotalProductos = productosProcesados.reduce(
      (a, p) => a + (p.subtotal || 0),
      0
    );
    const subtotal = subtotalServicios + subtotalProductos;


    const valor = Number(descuentoValor) || 0;
    const descuentoTotal =
      descuentoTipo === "porcentaje"
      ? Math.min(subtotal * (valor / 100), subtotal)
        : Math.min(valor, subtotal);


    const baseImponible = Math.max(subtotal - descuentoTotal, 0);
    const impuesto = +(baseImponible * 0.15).toFixed(2);
    const total = +(baseImponible + impuesto).toFixed(2);


    /* ======================================================
       Crear factura
    ====================================================== */
    const nuevaFactura = new Factura({
      cliente: {
        ownerId: owner._id,
        nombre: owner.full_name || owner.nombre,
        rtn: cliente?.rtn || "",
        email: owner.email,
        telefono: owner.phone,
      },
      mascota: {
        petId: pet._id,
        nombre: pet.nombre,
        especie: pet.especie,
        raza: pet.raza,
      },
      servicios: serviciosProcesados,
      productos: productosProcesados,
      subtotal,
      descuentoTipo,
      descuentoValor,
      descuentoTotal,
      baseImponible,
      impuesto,
      total,
      estado: estado || "Pendiente",
      metodoPago,
      numero: correlativo,
      cai: loteActivo.cai,
      caiRangoDesde: loteActivo.rangoDesde,
      caiRangoHasta: loteActivo.rangoHasta,
      caiFechaLimite: loteActivo.fechaLimite,
    });

    await nuevaFactura.save();

    loteActivo.correlativoActual = correlativo;
    await loteActivo.save();

    // ==================== ACTUALIZAR STOCK DE INVENTARIO ====================
for (const item of nuevaFactura.productos) {
  try {
    const productId = item.productId || item._id; 
    const product = await Product.findById(productId);

    if (product) {
      const cantidadAnterior = Number(product.quantity || 0);
      const nuevaCantidad = Math.max(cantidadAnterior - Number(item.cantidad || 0), 0);

      await Product.findByIdAndUpdate(productId, { quantity: nuevaCantidad });

      // Notificación en consola si está bajo mínimo
      if (nuevaCantidad <= (product.minStock || 0)) {
        console.log(
          `⚠️ Stock bajo: ${product.name} — ${nuevaCantidad} unidades restantes (mínimo ${product.minStock}).`
        );
      }
    } else {
      console.warn(`⚠️ Producto no encontrado: ${productId}`);
    }
  } catch (err) {
    console.error(`❌ Error actualizando stock del producto: ${err.message}`);
  }
}
    return res.status(201).json({
      mensaje: "Factura creada correctamente",
      factura: nuevaFactura,
    });
  } catch (error) {
    console.error("❌ Error creando factura:", error);
    return res.status(500).json({
      mensaje: "Error interno del servidor al crear factura",
      error: error.message,
    });
  }
};
/* ======================================================
   Obtener todas las facturas
====================================================== */
exports.obtenerFacturas = async (req, res) => {
try {
    const facturas = await Factura.find().sort({ createdAt: -1 });
    res.json(facturas);
  } catch (error) {
    console.error("❌ Error obteniendo facturas:", error);
    res.status(500).json({
      mensaje: "Error al obtener facturas",
      error: error.message,
    });
  }
};


// ======================================================
//  Actualizar factura existente (sin alterar stock)
// ======================================================
exports.actualizarFactura = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      cliente,
      mascota,
      servicios = [],
      productos = [],
      descuentoTipo = "monto",
      descuentoValor = 0,
      metodoPago,
    } = req.body;


    const factura = await Factura.findById(id);
    if (!factura)
      return res.status(404).json({ mensaje: "Factura no encontrada" });


    // === Validar cliente / mascota ===
    const owner = await Owner.findById(cliente?.ownerId);
    const pet = await Pet.findById(mascota?.petId);
    if (!owner || !pet)
      return res
        .status(400)
        .json({ mensaje: "Cliente o mascota no válidos para la factura." });


    // === Recalcular servicios y productos ===
const serviciosValidados = await Promise.all(
  servicios.map(async (s) => {
    try {
      const serv = s.servicioId ? await Servicio.findById(s.servicioId) : null;
      const cantidad = Number(s.cantidad || 1);
      const precio = Number(serv?.precio ?? serv?.price ?? s.precio ?? 0);
      return {
        servicioId: serv?._id || s.servicioId || null,
        nombre: serv?.nombre || s.nombre || "Servicio",
        precio,
        cantidad,
        subtotal: precio * cantidad,
      };
    } catch {
      // si falla la búsqueda o no hay ID, se conserva igual
      const cantidad = Number(s.cantidad || 1);
      const precio = Number(s.precio ?? 0);
      return {
        servicioId: s.servicioId || null,
        nombre: s.nombre || "Servicio",
        precio,
        cantidad,
        subtotal: precio * cantidad,
      };
    }
  })
);
    const productosValidados = await Promise.all(
      productos.map(async (p) => {
        const prod = await Product.findById(p.productId).catch(() => null);
        if (!prod) return null;
        const cantidad = p.cantidad || 1;
        const precio = prod.price || prod.precio || 0;
        return {
          productId: prod._id,
          nombre: prod.name || prod.nombre,
          precio,
          cantidad,
          subtotal: precio * cantidad,
        };
      })
    );


    const subtotalCalc =
      serviciosValidados.filter(Boolean).reduce((a, s) => a + s.subtotal, 0) +
      productosValidados.filter(Boolean).reduce((a, p) => a + p.subtotal, 0);


    const valor = Number(descuentoValor) || 0;
    let descuentoTotal = 0;
    if (descuentoTipo === "porcentaje") {
      descuentoTotal = Math.min(subtotalCalc * (valor / 100), subtotalCalc);
    } else {
      descuentoTotal = Math.min(valor, subtotalCalc);
    }


    const baseImponible = Math.max(subtotalCalc - descuentoTotal, 0);
    const impuesto = baseImponible * 0.15;
    const total = baseImponible + impuesto;


    factura.cliente = {
      ownerId: owner._id,
      nombre: owner.full_name || owner.nombre,
      rtn: cliente?.rtn || "",
      email: owner.email,
      telefono: owner.phone,
    };
    factura.mascota = {
      petId: pet._id,
      nombre: pet.nombre,
      especie: pet.especie,
      raza: pet.raza,
    };
    factura.servicios = serviciosValidados.filter(Boolean);
    factura.productos = productosValidados.filter(Boolean);
    factura.subtotal = subtotalCalc;
    factura.descuentoTipo = descuentoTipo;
    factura.descuentoValor = valor;
    factura.descuentoTotal = descuentoTotal;
    factura.baseImponible = baseImponible;
    factura.impuesto = impuesto;
    factura.total = total;
    factura.metodoPago = metodoPago || factura.metodoPago;


    await factura.save();


    res.json({
      mensaje: "Factura actualizada correctamente",
      factura,
    });
  } catch (error) {
    console.error("❌ Error actualizando factura:", error);
     res.status(500).json({
      mensaje: "Error interno del servidor al actualizar factura",
      error: error.message,
    });
  }
};


// ======================================================
// Eliminar factura (revertir stock)
// ======================================================
exports.eliminarFactura = async (req, res) => {
  try {
    const { id } = req.params;
    const eliminado = await Factura.findByIdAndDelete(id);
    if (!eliminado)
      return res.status(404).json({ mensaje: "Factura no encontrada" });


    // ======================================================
    // Revertir stock de productos eliminados
    // ======================================================
    for (const item of eliminado.productos) {
      const product = await Product.findById(item.productId);
      if (product) {
        await Product.findByIdAndUpdate(product._id, {
          $inc: { quantity: item.cantidad },
        });
      }
    }


    res.json({ mensaje: "Factura eliminada correctamente" });
  } catch (error) {
    console.error("❌ Error eliminando factura:", error);
    res.status(500).json({
      mensaje: "Error interno del servidor al eliminar factura",
      error: error.message,
    });
  }
};


// ======================================================
// Actualizar solo el estado de la factura
// ======================================================
exports.actualizarEstadoFactura = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;


    const factura = await Factura.findById(id);
    if (!factura)
      return res.status(404).json({ mensaje: "Factura no encontrada" });


    factura.estado = estado || factura.estado;
    await factura.save();


    res.json({ mensaje: "Estado actualizado correctamente", factura });
  } catch (error) {
    console.error("❌ Error actualizando estado:", error);
    res.status(500).json({
      mensaje: "Error interno del servidor al actualizar estado",
      error: error.message,
    });
  }
};
// ======================================================
// Estado del Lote CAI activo (para Navbar y alertas)
// ======================================================
exports.estadoLoteActivo = async (req, res) => {
  try {
    const lote = await LoteFactura.findOne({ activo: true });


    if (!lote) {
      return res.json({
        activo: false,
        mensaje: "No hay lote CAI activo",
      });
    }


    // Rango
    const desde = parseInt(lote.rangoDesde.split("-").pop(), 10);
    const hasta = parseInt(lote.rangoHasta.split("-").pop(), 10);
    const totalRango = hasta - desde + 1;


    // Uso
    const usados = Number(lote.correlativoActual || 0);
const restantes = Math.max(totalRango - usados, 0);


    // Días restantes
    const hoy = new Date();
    const fin = new Date(lote.fechaLimite);
    const diasRestantes = Math.ceil((fin - hoy) / (1000 * 60 * 60 * 24));


    // === Determinar estado ===
    let alerta = "ok";
    if (restantes <= totalRango * 0.25 || diasRestantes <= 45) alerta = "warning";
    if (restantes <= 0 || diasRestantes <= 15) alerta = "expired";


    res.json({
      activo: true,
      cai: lote.cai,
      rangoDesde: lote.rangoDesde,
      rangoHasta: lote.rangoHasta,
      correlativoActual: usados,
      restantes,
      fechaLimite: lote.fechaLimite,
      diasRestantes,
      alerta, 
    });
  } catch (error) {
    console.error("❌ Error consultando lote CAI:", error);
    res.status(500).json({
      mensaje: "Error interno al consultar estado del lote CAI",
      error: error.message,
    });
  }
};
