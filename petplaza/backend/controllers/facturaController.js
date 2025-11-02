// backend/controllers/facturaController.js
const mongoose = require("mongoose");
const Factura = require("../models/Factura");
const Owner = require("../models/Owner");
const Pet = require("../models/Pet");
const Servicio = require("../models/Servicio");
const Product = require("../models/Product");
const LoteFactura = require("../models/LoteFactura");

/* ======================================================
   Helpers
====================================================== */
const toNumber = (v, d = 0) => Number.isFinite(Number(v)) ? Number(v) : d;

/**
 * Valida disponibilidad de stock para una lista de renglones de productos.
 * Devuelve { ok: boolean, faltantes: [{productId, nombre, solicitado, disponible}] }
 */
async function validarStock(productos = []) {
  const faltantes = [];
  for (const p of productos) {
    const prod = await Product.findById(p.productId).lean();
    const solicitado = toNumber(p.cantidad, 1);
    const disponible = toNumber(prod?.quantity, 0);
    if (!prod || solicitado <= 0 || disponible < solicitado) {
      faltantes.push({
        productId: p.productId,
        nombre: prod?.name || prod?.nombre || p.nombre || "Producto",
        solicitado,
        disponible: Math.max(0, disponible),
      });
    }
  }
  return { ok: faltantes.length === 0, faltantes };
}

/**
 * Aplica delta de stock a productos [{ productId, cantidad }] con $inc atómico.
 * delta < 0 descuenta, delta > 0 repone.
 */
async function aplicarDeltaStock(items = [], deltaSign = -1) {
  for (const item of items) {
    const qty = toNumber(item.cantidad, 0) * deltaSign;
    if (!item.productId || qty === 0) continue;
    await Product.findOneAndUpdate(
      { _id: item.productId },
      { $inc: { quantity: qty } },
      { new: false }
    ).catch(() => {});
  }
}

/* ======================================================
   📦 Crear nueva factura
====================================================== */
exports.crearFactura = async (req, res) => {
  const session = await mongoose.startSession();
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
    if (!owner || !pet) {
      return res.status(400).json({ mensaje: "Cliente o mascota no válidos" });
    }

    // === Buscar lote activo ===
    const loteActivo = await LoteFactura.findOne({ activo: true });
    if (!loteActivo) {
      return res
        .status(400)
        .json({ mensaje: "No hay lote CAI activo. No se puede generar factura." });
    }

    // === Calcular correlativo (y validar rango) ===
    const correlativo = toNumber(loteActivo.correlativoActual, 0) + 1;
    const finRango = parseInt(String(loteActivo.rangoHasta).split("-").pop(), 10);
    if (!Number.isFinite(finRango) || correlativo > finRango) {
      return res.status(400).json({ mensaje: "El rango del CAI activo ha sido agotado." });
    }

    /* ======================================================
       Validar y procesar servicios
    ====================================================== */
    const serviciosProcesados = await Promise.all(
      (servicios || []).map(async (s) => {
        try {
          const serv = s.servicioId ? await Servicio.findById(s.servicioId) : null;
          const cantidad = toNumber(s.cantidad, 1);
          const precio = toNumber(serv?.precio ?? s.precio, 0);
          return {
            servicioId: serv?._id || s.servicioId || null,
            nombre: serv?.nombre || s.nombre || "Servicio",
            precio,
            cantidad,
            subtotal: +(precio * cantidad).toFixed(2),
          };
        } catch {
          const cantidad = toNumber(s.cantidad, 1);
          const precio = toNumber(s.precio, 0);
          return {
            servicioId: s.servicioId || null,
            nombre: s.nombre || "Servicio",
            precio,
            cantidad,
            subtotal: +(precio * cantidad).toFixed(2),
          };
        }
      })
    );

    /* ======================================================
       Validar y procesar productos (con control de stock)
    ====================================================== */
    const productosSolicitados = await Promise.all(
      (productos || []).map(async (p) => {
        const prod = p.productId ? await Product.findById(p.productId) : null;
        const cantidad = toNumber(p.cantidad, 1);
        const precio = toNumber(prod?.price ?? prod?.precio ?? p.precio, 0);
        return {
          productId: prod?._id || p.productId || null,
          nombre: prod?.name || prod?.nombre || p.nombre || "Producto",
          precio,
          cantidad,
          subtotal: +(precio * cantidad).toFixed(2),
        };
      })
    );

    // — No permitir vender sin stock
    const { ok, faltantes } = await validarStock(productosSolicitados);
    if (!ok) {
      return res.status(409).json({
        mensaje:
          "Hay productos sin stock suficiente. Ajusta cantidades o retira los productos.",
        faltantes,
      });
    }

    /* ======================================================
       Totales
    ====================================================== */
    const subtotalServicios = serviciosProcesados.reduce((a, s) => a + (s.subtotal || 0), 0);
    const subtotalProductos = productosSolicitados.reduce((a, p) => a + (p.subtotal || 0), 0);
    const subtotal = +(subtotalServicios + subtotalProductos).toFixed(2);

    const valDesc = toNumber(descuentoValor, 0);
    const descuentoTotal =
      descuentoTipo === "porcentaje"
        ? +Math.min(subtotal * (valDesc / 100), subtotal).toFixed(2)
        : +Math.min(valDesc, subtotal).toFixed(2);

    const baseImponible = +Math.max(subtotal - descuentoTotal, 0).toFixed(2);
    const impuesto = +((baseImponible * 0.15).toFixed(2));
    const total = +(baseImponible + impuesto).toFixed(2);

    /* ======================================================
       Transacción: crear factura + mover correlativo + descontar stock
    ====================================================== */
    await session.withTransaction(async () => {
      const nuevaFactura = await Factura.create(
        [
          {
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
            productos: productosSolicitados,
            subtotal,
            descuentoTipo,
            descuentoValor: valDesc,
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
          },
        ],
        { session }
      );

      // Avanza correlativo del lote activo
      await LoteFactura.findByIdAndUpdate(
        loteActivo._id,
        { correlativoActual: correlativo },
        { session }
      );

      // Descontar stock (ya validado)
      for (const item of productosSolicitados) {
        if (!item.productId || !item.cantidad) continue;
        await Product.findOneAndUpdate(
          { _id: item.productId, quantity: { $gte: item.cantidad } },
          { $inc: { quantity: -item.cantidad } },
          { session }
        );
      }

      // Respuesta
      res.status(201).json({
        mensaje: "Factura creada correctamente",
        factura: nuevaFactura[0],
      });
    });
  } catch (error) {
    console.error("❌ Error creando factura:", error);
    return res.status(500).json({
      mensaje: "Error interno del servidor al crear factura",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

/* ======================================================
   Obtener todas las facturas
====================================================== */
exports.obtenerFacturas = async (req, res) => {
  try {
    const facturas = await Factura.find().sort({ createdAt: -1 });
    res.status(200).json(Array.isArray(facturas) ? facturas : []);
  } catch (error) {
    console.error("❌ Error obteniendo facturas:", error);
    res.status(500).json({
      mensaje: "Error al obtener facturas",
      facturas: [],
      error: error.message,
    });
  }
};

/* ======================================================
   Actualizar factura (recalcula totales y ajusta stock)
   Estrategia segura: revertimos stock de productos viejos y
   validamos/aplicamos stock para los nuevos.
====================================================== */
exports.actualizarFactura = async (req, res) => {
  const session = await mongoose.startSession();
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
    if (!factura) return res.status(404).json({ mensaje: "Factura no encontrada" });

    // === Validar cliente / mascota ===
    const owner = await Owner.findById(cliente?.ownerId);
    const pet = await Pet.findById(mascota?.petId);
    if (!owner || !pet) {
      return res.status(400).json({ mensaje: "Cliente o mascota no válidos para la factura." });
    }

    // 1) Revertimos stock de productos actuales (si los hay)
    const productosViejos = (factura.productos || []).map((p) => ({
      productId: p.productId,
      cantidad: toNumber(p.cantidad, 0),
    }));

    // 2) Preparamos/validamos los nuevos servicios y productos
    const serviciosValidados = await Promise.all(
      (servicios || []).map(async (s) => {
        const serv = s.servicioId ? await Servicio.findById(s.servicioId).catch(() => null) : null;
        const cantidad = toNumber(s.cantidad, 1);
        const precio = toNumber(serv?.precio ?? s.precio, 0);
        return {
          servicioId: serv?._id || s.servicioId || null,
          nombre: serv?.nombre || s.nombre || "Servicio",
          precio,
          cantidad,
          subtotal: +(precio * cantidad).toFixed(2),
        };
      })
    );

    const productosNuevos = await Promise.all(
      (productos || []).map(async (p) => {
        const prod = p.productId ? await Product.findById(p.productId).catch(() => null) : null;
        if (!prod) return null;
        const cantidad = toNumber(p.cantidad, 1);
        const precio = toNumber(prod.price ?? prod.precio ?? p.precio, 0);
        return {
          productId: prod._id,
          nombre: prod.name || prod.nombre,
          precio,
          cantidad,
          subtotal: +(precio * cantidad).toFixed(2),
        };
      })
    );
    const productosNuevosValidos = productosNuevos.filter(Boolean);

    // Validar stock de nuevos (después de devolver lo anterior)
    await session.withTransaction(async () => {
      // Reponer lo viejo
      if (productosViejos.length) await aplicarDeltaStock(productosViejos, +1);

      // Validar stock para los nuevos
      const { ok, faltantes } = await validarStock(productosNuevosValidos);
      if (!ok) {
        // Deshacer la reposición (volver al estado original)
        if (productosViejos.length) await aplicarDeltaStock(productosViejos, -1);
        return res.status(409).json({
          mensaje:
            "No hay stock suficiente para actualizar la factura. Ajusta las cantidades.",
          faltantes,
        });
      }

      // Totales
      const subtotalCalc =
        serviciosValidados.reduce((a, s) => a + s.subtotal, 0) +
        productosNuevosValidos.reduce((a, p) => a + p.subtotal, 0);

      const valDesc = toNumber(descuentoValor, 0);
      const descuentoTotal =
        descuentoTipo === "porcentaje"
          ? +Math.min(subtotalCalc * (valDesc / 100), subtotalCalc).toFixed(2)
          : +Math.min(valDesc, subtotalCalc).toFixed(2);

      const baseImponible = +Math.max(subtotalCalc - descuentoTotal, 0).toFixed(2);
      const impuesto = +((baseImponible * 0.15).toFixed(2));
      const total = +(baseImponible + impuesto).toFixed(2);

      // Guardar factura
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
      factura.servicios = serviciosValidados;
      factura.productos = productosNuevosValidos;
      factura.subtotal = subtotalCalc;
      factura.descuentoTipo = descuentoTipo;
      factura.descuentoValor = valDesc;
      factura.descuentoTotal = descuentoTotal;
      factura.baseImponible = baseImponible;
      factura.impuesto = impuesto;
      factura.total = total;
      factura.metodoPago = metodoPago || factura.metodoPago;

      await factura.save({ session });

      // Descontar stock de los nuevos
      if (productosNuevosValidos.length) await aplicarDeltaStock(productosNuevosValidos, -1);

      res.json({ mensaje: "Factura actualizada correctamente", factura });
    });
  } catch (error) {
    console.error("❌ Error actualizando factura:", error);
    res.status(500).json({
      mensaje: "Error interno del servidor al actualizar factura",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

/* ======================================================
   Eliminar factura (revertir stock)
====================================================== */
exports.eliminarFactura = async (req, res) => {
  try {
    const { id } = req.params;
    const eliminado = await Factura.findByIdAndDelete(id);
    if (!eliminado) return res.status(404).json({ mensaje: "Factura no encontrada" });

    // Revertir stock de productos facturados
    const items = (eliminado.productos || []).map((p) => ({
      productId: p.productId,
      cantidad: toNumber(p.cantidad, 0),
    }));
    if (items.length) await aplicarDeltaStock(items, +1);

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
