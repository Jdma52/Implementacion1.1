import React, { useEffect, useMemo, useState } from "react";
import "../CSS/Facturacion.css";
import {
  FileText,
  CheckCircle,
  Clock,
  Calculator,
  Eye,
  Trash2,
  Plus,
  X,
  MoreVertical,
  Edit3,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo1 from "../assets/logo1.png"; 

import {
  getFacturas,
  createFactura,
  updateFacturaEstado,
  deleteFactura,
} from "../apis/facturasApi";
import { getOwners } from "../apis/ownersApi";
import { getPets } from "../apis/petsApi";
import { getServicios } from "../apis/serviciosApi";
import { getProducts } from "../apis/productsApi";

export default function Facturacion() {
  const user = JSON.parse(localStorage.getItem("user"));

  // ==================== ESTADOS BASE ====================
  const [facturas, setFacturas] = useState([]);
  const [owners, setOwners] = useState([]);
  const [pets, setPets] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Notificaciones
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  // Modales
  const [showNuevoModal, setShowNuevoModal] = useState(false);
  const [closingNuevoModal, setClosingNuevoModal] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [facturaEditando, setFacturaEditando] = useState(null);

  const [showPreview, setShowPreview] = useState(false);
  const [closingPreview, setClosingPreview] = useState(false);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);

  const [showConfirm, setShowConfirm] = useState(false);
  const [closingConfirm, setClosingConfirm] = useState(false);
  const [facturaAEliminar, setFacturaAEliminar] = useState(null);

  // Lote CAI
  const [showLoteMenu, setShowLoteMenu] = useState(false);
  const [showLoteModal, setShowLoteModal] = useState(false);
  const [closingLoteModal, setClosingLoteModal] = useState(false);
  const [lotes, setLotes] = useState([]);
  const [loadingLotes, setLoadingLotes] = useState(true);
  const [nuevoLote, setNuevoLote] = useState({
    cai: "",
    rangoDesde: "",
    rangoHasta: "",
  });

  // ==================== FORMULARIO NUEVA/EDICIÓN ====================
  const [formData, setFormData] = useState({
    cliente: { ownerId: "", rtn: "" },
    mascota: { petId: "" },
    metodoPago: "",
    servicios: [],
    productos: [],
    descuentoTipo: "monto",
    descuentoValor: 0,
  });

  // ==================== HELPERS ====================
  const notify = (msg) => {
    setNotificationMessage(msg);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 1800);
  };

  const currency = (n) =>
    `L ${Number(n || 0).toLocaleString("es-HN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const numFactura = (f) => f?.numero || f?.numeroCorrelativoTexto || "—";
  const safeDate = (d) => new Date(d || Date.now()).toLocaleDateString();

  const resetFormFactura = () => {
    setFormData({
      cliente: { ownerId: "", rtn: "" },
      mascota: { petId: "" },
      metodoPago: "",
      servicios: [],
      productos: [],
      descuentoTipo: "monto",
      descuentoValor: 0,
    });
    setModoEdicion(false);
    setFacturaEditando(null);
  };

  // ==================== CARGA INICIAL ====================
  useEffect(() => {
    const cargarTodo = async () => {
      try {
        setLoading(true);
        const [fs, os, ps, ss, prs] = await Promise.all([
          getFacturas(),
          getOwners(),
          getPets(),
          getServicios(),
          getProducts(),
        ]);
        setFacturas(fs || []);
        setOwners(os || []);
        setPets(ps || []);
        setServicios(ss || []);
        setProductos(prs || []);
      } catch (e) {
        console.error(e); 
        notify("Error cargando datos");
      } finally {
        setLoading(false);
      }
    };
    cargarTodo();
  }, []);

  // ==================== MASCOTAS POR DUEÑO ====================
  const mascotasDelOwner = useMemo(() => {
    const ownerId = formData.cliente.ownerId;
    if (!ownerId) return [];
    return pets.filter((p) => {
      const pid =
        p.owner?._id ||
        p.ownerId?._id ||
        p.ownerId ||
        p.owner;
      return pid === ownerId;
    });
  }, [pets, formData.cliente.ownerId]);

  // ==================== TOTALES ====================
  const subtotalServicios = useMemo(
    () =>
      formData.servicios.reduce(
        (a, s) => a + Number(s.precio ?? s.price ?? 0) * Number(s.cantidad || 0),
        0
      ),
    [formData.servicios]
  );
  const subtotalProductos = useMemo(
    () =>
      formData.productos.reduce(
        (a, p) => a + Number(p.precio ?? p.price ?? 0) * Number(p.cantidad || 0),
        0
      ),
    [formData.productos]
  );
  const subtotal = subtotalServicios + subtotalProductos;

  const descuentoTotal = useMemo(() => {
    const v = Number(formData.descuentoValor || 0);
    return formData.descuentoTipo === "porcentaje"
      ? Math.min(subtotal * (v / 100), subtotal)
      : Math.min(v, subtotal);
  }, [formData.descuentoTipo, formData.descuentoValor, subtotal]);

  const baseImponible = Math.max(subtotal - descuentoTotal, 0);
  const impuesto = +(baseImponible * 0.15).toFixed(2);
  const total = +(baseImponible + impuesto).toFixed(2);

  // ==================== FILTRO FACTURAS ====================
  const facturasFiltradas = useMemo(() => {
    if (!searchTerm.trim()) return facturas;
    const t = searchTerm.toLowerCase();
    return facturas.filter(
      (f) =>
        numFactura(f).toString().toLowerCase().includes(t) ||
        f.cliente?.nombre?.toLowerCase().includes(t) ||
        f.mascota?.nombre?.toLowerCase().includes(t)
    );
  }, [facturas, searchTerm]);

  // ==================== HANDLERS FORM ====================
  const onSelectOwner = (ownerId) =>
    setFormData((s) => ({
      ...s,
      cliente: { ...s.cliente, ownerId },
      mascota: { petId: "" },
    }));

  const addServicio = (servicioId) => {
    const s = servicios.find((x) => x._id === servicioId);
    if (!s) return;
    const precio = Number(s.precio ?? s.price ?? 0);
    setFormData((prev) => ({
      ...prev,
      servicios: [
        ...prev.servicios,
        {
          servicioId: s._id,
          nombre: s.nombre,
          precio,
          cantidad: 1,
          subtotal: precio,
        },
      ],
    }));
  };

 const addProducto = (productId) => {
  if (!productId) return;
  const p = productos.find((x) => x._id === productId);
  if (!p) return;

  const precio = Number(p.price ?? p.precio ?? 0);

  setFormData((prev) => ({
    ...prev,
    productos: [
      ...prev.productos,
      {
        productId: p._id, 
        _id: p._id,        
        nombre: p.name ?? p.nombre,
        precio,
        cantidad: 1,
        subtotal: precio,
      },
    ],
  }));
};
  const updListQty = (list, id, delta) =>
    list
      .map((i) =>
        i.servicioId === id || i._id === id || i.productId === id
          ? {
              ...i,
              cantidad: Math.max(0, Number(i.cantidad || 0) + delta),
              subtotal:
                Math.max(0, Number(i.precio || i.price) * (Number(i.cantidad || 0) + delta)),
            }
          : i
      )
      .filter((i) => (i.cantidad || 0) > 0);

  const updServQty = (id, delta) =>
    setFormData((s) => ({ ...s, servicios: updListQty(s.servicios, id, delta) }));
  const updProdQty = (id, delta) =>
    setFormData((s) => ({ ...s, productos: updListQty(s.productos, id, delta) }));

  const delServ = (id) =>
    setFormData((s) => ({
      ...s,
      servicios: s.servicios.filter((x) => x.servicioId !== id && x._id !== id),
    }));

  const delProd = (id) =>
    setFormData((s) => ({
      ...s,
      productos: s.productos.filter((x) => x.productId !== id && x._id !== id),
    }));

  // ==================== NUEVA / EDICIÓN ====================
  const openNuevoModal = () => {
    resetFormFactura(); 
    setModoEdicion(false);
    setShowNuevoModal(true);
  };

  const openEditModal = (f) => {
    // Mapeo de la factura al formulario
    setModoEdicion(true);
    setFacturaEditando(f);
    setFormData({
      cliente: { ownerId: f.cliente?.ownerId || f.cliente?.owner?._id || "" , rtn: f.cliente?.rtn || "" },
      mascota: { petId: f.mascota?.petId || f.mascota?._id || "" },
      metodoPago: f.metodoPago || "",
      servicios: (f.servicios || []).map((s) => ({
        servicioId: s.servicioId || s._id,
        nombre: s.nombre,
        precio: Number(s.precio ?? s.price ?? s.unitPrice ?? 0),
        cantidad: Number(s.cantidad || 0),
        _id: s._id,
      })),
      productos: (f.productos || []).map((p) => ({
        productId: p.productId || p._id,
        nombre: p.nombre ?? p.name,
        precio: Number(p.precio ?? p.price ?? 0),
        cantidad: Number(p.cantidad || 0),
        _id: p._id,
      })),
      descuentoTipo: f.descuentoTipo || "monto",
      descuentoValor: Number(f.descuentoValor || 0),
    });
    setShowNuevoModal(true);
  };

  const closeNuevoModal = () => {
    setClosingNuevoModal(true);
    setTimeout(() => {
      setShowNuevoModal(false);
      setClosingNuevoModal(false);
      resetFormFactura(); 
    }, 180);
  };

  // ==================== CREAR / EDITAR / ESTADO / ELIMINAR ====================
const handleGuardarFactura = async () => {
  if (!formData.cliente.ownerId || !formData.mascota.petId)
    return notify("Selecciona dueño y mascota");
  if (formData.cliente.rtn && !/^\d{14}$/.test(formData.cliente.rtn))
    return notify("RTN inválido (14 dígitos)");
  if (!formData.metodoPago) return notify("Selecciona método de pago");
  if (subtotal <= 0) return notify("Agrega un servicio o producto");

  // Estado por defecto solo al crear
  let estadoFactura = "Pagado";
  if (!modoEdicion) {
    if (formData.metodoPago === "Tarjeta" || formData.metodoPago === "Transferencia")
      estadoFactura = "Pendiente";
  }

  //  Incluimos todos los datos necesarios
  const payload = {
    cliente: {
      ownerId: formData.cliente.ownerId,
      rtn: formData.cliente.rtn || "",
    },
    mascota: { petId: formData.mascota.petId },
    servicios: formData.servicios.map((s) => ({
      servicioId: s.servicioId || s._id,
      nombre: s.nombre,
      precio: Number(s.precio ?? s.price ?? 0),
      cantidad: Number(s.cantidad || 1),
      subtotal: Number(s.precio ?? s.price ?? 0) * Number(s.cantidad || 1),
    })),
    productos: formData.productos.map((p) => ({
      productId: p.productId || p._id,
      nombre: p.nombre ?? p.name,
      precio: Number(p.precio ?? p.price ?? 0),
      cantidad: Number(p.cantidad || 1),
      subtotal: Number(p.precio ?? p.price ?? 0) * Number(p.cantidad || 1),
    })),
    descuentoTipo: formData.descuentoTipo,
    descuentoValor: Number(formData.descuentoValor || 0),
    metodoPago: formData.metodoPago,
    subtotal,
    descuentoTotal,
    baseImponible,
    impuesto,
    total,
    ...(modoEdicion ? {} : { estado: estadoFactura }),
  };

    try {
      if (modoEdicion && facturaEditando?._id) {
        // PUT directo (frontend-only por ahora)
        const base = window.location.hostname === "localhost" ? "http://localhost:5000" : "";
        const res = await fetch(`${base}/api/facturas/${facturaEditando._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.mensaje || "Error actualizando factura");
        const actualizada = data?.factura || data;
        setFacturas((prev) => prev.map((x) => (x._id === actualizada._id ? actualizada : x)));
        notify("Factura actualizada");
      } else {
        const created = await createFactura(payload);
        const nueva = created?.factura || created;
        if (!nueva?._id) throw new Error("Error creando factura");
        setFacturas((prev) => [nueva, ...prev]);
        notify("Factura creada correctamente");
      }
      closeNuevoModal();
    } catch (e) {
      console.error(e);
      notify(e.message || "Error guardando factura");
    }
  };

  const toggleEstado = async (f) => {
    try {
      const nuevoEstado = f.estado === "Pagado" ? "Pendiente" : "Pagado";
      const updated = await updateFacturaEstado(f._id, nuevoEstado);
      const nf = updated?.factura || updated;
      setFacturas((prev) => prev.map((x) => (x._id === f._id ? nf : x)));
      notify("Estado actualizado");
    } catch (e) {
      console.error(e);
      notify("Error actualizando estado");
    }
  };

  const askDelete = (f) => {
    setFacturaAEliminar(f);
    setShowConfirm(true);
  };
  const closeConfirmModal = () => {
    setClosingConfirm(true);
    setTimeout(() => {
      setShowConfirm(false);
      setClosingConfirm(false);
      setFacturaAEliminar(null);
    }, 180);
  };
  const handleDelete = async () => {
    try {
      await deleteFactura(facturaAEliminar._id);
      setFacturas((prev) => prev.filter((x) => x._id !== facturaAEliminar._id));
      closeConfirmModal();
      notify("Factura eliminada");
      // ⚠️ Backend: aquí luego revertiremos inventario (+cantidad) al eliminar
    } catch (e) {
      console.error(e);
      notify("Error eliminando factura");
    }
  };

  // ==================== LOTE CAI ====================
  const closeLoteModal = () => {
    setClosingLoteModal(true);
    setTimeout(() => {
      setShowLoteModal(false);
      setShowLoteMenu(false);
      setClosingLoteModal(false);
    }, 180);
  };

  const cargarLotes = async () => {
    try {
      setLoadingLotes(true);
      const base = window.location.hostname === "localhost" ? "http://localhost:5000" : "";
      const res = await fetch(`${base}/api/lotes`);
      const data = await res.json();
      setLotes(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      notify("Error cargando lotes");
    } finally {
      setLoadingLotes(false);
    }
  };

  const crearLote = async (e) => {
    e.preventDefault();
    try {
      const base = window.location.hostname === "localhost" ? "http://localhost:5000" : "";
      const res = await fetch(`${base}/api/lotes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoLote),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.mensaje || "Error creando lote");
      notify("Lote creado correctamente");
      setNuevoLote({ cai: "", rangoDesde: "", rangoHasta: "" });
      await cargarLotes();
    } catch (e) {
      console.error(e);
      notify(e.message || "Error creando lote");
    }
  };

  const activarLote = async (id) => {
    try {
      const base = window.location.hostname === "localhost" ? "http://localhost:5000" : "";
      const res = await fetch(`${base}/api/lotes/${id}/activar`, { method: "PUT" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.mensaje || "Error activando lote");
      notify("Lote activado");
      await cargarLotes();
    } catch (e) {
      console.error(e);
      notify(e.message || "Error activando lote");
    }
  };

  useEffect(() => {
    if (showLoteModal) cargarLotes();
  }, [showLoteModal]);

  // ==================== PREVIEW / PDF ====================
  const openPreview = (f) => {
    setFacturaSeleccionada(f);
    setShowPreview(true);
  };
  const closePreview = () => {
    setClosingPreview(true);
    setTimeout(() => {
      setShowPreview(false);
      setClosingPreview(false);
      setFacturaSeleccionada(null);
    }, 180);
  };

  const generarPDF = (f) => {
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    const m = 40;
    let y = 40;
    try {
      // Intento dibujar el logo (PNG importado) a color
      doc.addImage(logo1, "PNG", m, y - 4, 90, 48);
    } catch (_) {
      
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(7, 90, 60);
    doc.text("ALM INVESIONES SRL", m + 100 + 8, y + 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(30);
    doc.text(" PETPLAZA HOSPIVET", m + 100 + 8, y + 28);
    doc.text("Tegucigalpa, Ave. La Paz | Tel: +504 2242-5850", m + 100 + 8, y + 42);
     doc.text("LEOVETEQUI@GMAIL.COM  | 0801-9016-859530", m + 100 + 8, y + 56);

    // Datos a la derecha
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(20);
    doc.text(`FACTURA ${numFactura(f)}`, 555, y + 8, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(30);
    doc.text(`Fecha: ${safeDate(f.fecha || f.createdAt)}`, 555, y + 26, { align: "right" });
    doc.text(`Estado: ${f.estado}`, 555, y + 40, { align: "right" });
    doc.text(`Método: ${f.metodoPago}`, 555, y + 54, { align: "right" });

    // ===== Bloque fiscal =====
    y += 70;
    doc.setDrawColor(5, 150, 105);
    doc.setTextColor(30);
    doc.roundedRect(m, y, 520, 62, 8, 8);
    doc.setFont("helvetica", "bold");
    doc.text("INFORMACIÓN FISCAL (HONDURAS)", m + 10, y + 18);
    doc.setFont("helvetica", "normal");
    doc.text(`CAI: ${f.cai}`, m + 10, y + 36);
    doc.text(
      `Rango autorizado: ${f.caiRangoDesde} a ${f.caiRangoHasta}      Fecha límite: ${safeDate(
        f.caiFechaLimite
      )}`,
      m + 10,
      y + 52
    );

    // ===== Cliente / Mascota =====
    y += 90;
    doc.setFont("helvetica", "bold");
    doc.text("DATOS DEL CLIENTE", m, y);
    doc.text("DATOS DE LA MASCOTA", 360, y);
    doc.setFont("helvetica", "normal");
    y += 16;
    doc.text(`Nombre: ${f.cliente?.nombre || "-"}`, m, y);
    doc.text(`Nombre: ${f.mascota?.nombre || "-"}`, 360, y);
    y += 14;
    doc.text(`RTN: ${f.cliente?.rtn || "-"}`, m, y);
    doc.text(`Especie: ${f.mascota?.especie || "-"}`, 360, y);
    y += 14;
    doc.text(`Teléfono: ${f.cliente?.telefono || "-"}`, m, y);
    doc.text(`Raza: ${f.mascota?.raza || "-"}`, 360, y);

    // ===== Detalle =====
    y += 22;
    const bodyRows = [];

    // SERVICIOS
    (f.servicios || []).forEach((s) => {
      const nombre = s.nombre ?? "Servicio";
      const cant = Number(s.cantidad || 0);
      const pu = Number(s.precio ?? s.price ?? s.unitPrice ?? 0);
      bodyRows.push([nombre, cant, `L ${pu.toFixed(2)}`, `L ${(pu * cant).toFixed(2)}`]);
    });

    // PRODUCTOS
    (f.productos || []).forEach((p) => {
      const nombre = p.nombre ?? p.name ?? "Producto";
      const cant = Number(p.cantidad || 0);
      const pu = Number(p.precio ?? p.price ?? 0);
      bodyRows.push([nombre, cant, `L ${pu.toFixed(2)}`, `L ${(pu * cant).toFixed(2)}`]);
    });

    autoTable(doc, {
      head: [["Descripción", "Cant.", "Precio Unit.", "Total"]],
      body: bodyRows,
      startY: y,
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 6 },
      headStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: "bold" },
      margin: { left: m, right: m },
    });

    let endY = doc.lastAutoTable.finalY || y;
    endY += 10;

    const filasTotales = [["Subtotal", `L ${Number(f.subtotal || 0).toFixed(2)}`]];
    if (Number(f.descuentoTotal || 0) > 0) {
      filasTotales.push(["Descuento", `L ${Number(f.descuentoTotal || 0).toFixed(2)}`]);
      filasTotales.push(["Base imponible", `L ${Number(f.baseImponible || 0).toFixed(2)}`]);
    }
    filasTotales.push(["ISV (15%)", `L ${Number(f.impuesto || 0).toFixed(2)}`]);
    filasTotales.push(["TOTAL", `L ${Number(f.total || 0).toFixed(2)}`]);

    autoTable(doc, {
      body: filasTotales,
      startY: endY,
      theme: "plain",
      styles: { fontSize: 11 },
      columnStyles: { 0: { fontStyle: "bold" } },
      margin: { left: 360, right: m },
    });

    // ===== Pie de página =====
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(90);
    doc.text(
      "Gracias por confiar en PetPlaza Hospivet 🐾 ",
      m,
      pageH - 24
    );

    doc.save(`Factura_${numFactura(f)}.pdf`);
  };

  // ==================== UI ====================
return (
  <div className="facturacion-container">
    {/* Header principal */}
    <div className="facturacion-header">
      <div className="facturacion-header-left">
        <h1 className="facturacion-title">Gestión de Facturación</h1>
        <p className="facturacion-subtitle">Panel de control y emisión de facturas</p>
      </div>

      {/* Menú 3 puntos */}
      <div className="facturacion-header-actions">
        <button
          className="facturacion-menu-btn"
          title="Opciones"
          onClick={() => setShowLoteMenu((v) => !v)}
        >
          <MoreVertical size={18} />
        </button>

        {showLoteMenu && (
          <div className="facturacion-menu-dropdown">
            <button
              onClick={() => {
                setShowLoteMenu(false);
                setShowLoteModal(true);
              }}
            >
              📘 Gestión de Lote CAI
            </button>
          </div>
        )}
      </div>
    </div>
      {/* Estadísticas (compactas) */}
      <div className="facturacion-stats small">
        <div className="stat-card blue">
          <FileText size={22} />
          <div>
            <h4>{facturas.length}</h4>
            <p>Emitidas</p>
          </div>
        </div>
        <div className="stat-card green">
          <CheckCircle size={22} />
          <div>
            <h4>{facturas.filter((f) => f.estado === "Pagado").length}</h4>
            <p>Pagadas</p>
          </div>
        </div>
        <div className="stat-card orange">
          <Clock size={22} />
          <div>
            <h4>{facturas.filter((f) => f.estado === "Pendiente").length}</h4>
            <p>Pendientes</p>
          </div>
        </div>
        <div className="stat-card teal">
          <Calculator size={22} />
          <div>
            <h4>
              {currency(
                facturas
                  .filter((f) => f.estado === "Pagado")
                  .reduce((a, x) => a + Number(x.total || 0), 0)
              )}
            </h4>
            <p>Recaudado</p>
          </div>
        </div>
      </div>

  {/* Buscador + Botón Nueva Factura  */}
<div className="facturacion-search mejorada">
  <input
    type="text"
    placeholder="🔍 Buscar por número, cliente o mascota"
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />
  <button className="facturacion-btn-primary" onClick={openNuevoModal}>
    <Plus size={15} /> Nueva Factura
  </button>
</div>

      {/* Tabla */}
      <div className="facturacion-table-container">
        <table className="facturacion-table">
          <thead>
            <tr>
              <th>Número</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Mascota</th>
              <th>Total</th>
              <th>Método</th>
              <th>Estado</th>
              <th style={{ textAlign: "right" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "1rem" }}>
                  Cargando...
                </td>
              </tr>
            ) : facturasFiltradas.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "1rem" }}>
                  No hay facturas registradas
                </td>
              </tr>
            ) : (
              facturasFiltradas.map((f) => (
                <tr key={f._id}>
                  <td>{numFactura(f)}</td>
                  <td>{safeDate(f.fecha || f.createdAt)}</td>
                  <td>{f.cliente?.nombre}</td>
                  <td>{f.mascota?.nombre}</td>
                  <td className="facturacion-total-amount">{currency(f.total)}</td>
                  <td>
                    <span className="facturacion-metodo-pago-badge">{f.metodoPago}</span>
                  </td>
                  <td>
                    <button
                      className={`facturacion-status-btn ${f.estado === "Pagado" ? "pagado" : "pendiente"}`}
                      onClick={() => toggleEstado(f)}
                    >
                      {f.estado}
                    </button>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div className="facturacion-action-buttons">
                      <button
                        className="facturacion-action-btn view"
                        title="Ver"
                        onClick={() => openPreview(f)}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="facturacion-action-btn edit"
                        title="Editar"
                        onClick={() => openEditModal(f)}
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        className="facturacion-action-btn delete"
                        title="Eliminar"
                        onClick={() => askDelete(f)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* =================== MODAL PREVIEW =================== */}
{showPreview && facturaSeleccionada && (
  <div
    className={`facturacion-modal-overlay ${closingPreview ? "closing" : "active"}`}
  >
    <div
      className={`facturacion-modal facturacion-modal-preview ${closingPreview ? "closing" : "active"}`}
      onClick={(e) => e.stopPropagation()} // 🚫 Evita cierre al hacer clic fuera
    >
      <div className="facturacion-modal-header">
        <h2>Vista Previa de Factura</h2>
        <div style={{ display: "flex", gap: ".5rem" }}>
          <button
            className="facturacion-btn-secondary"
            onClick={() => generarPDF(facturaSeleccionada)}
          >
            Imprimir / Descargar
          </button>
          <button className="facturacion-close-btn" onClick={closePreview}>
            <X size={16} />
          </button>
        </div>
      </div>

      {/* === Contenido de la Vista Previa === */}
      <div className="facturacion-factura-container">
        <div className="facturacion-factura-header">
          <div className="facturacion-factura-empresa">
            <h2>PetPlaza Hospivet</h2>
            <div>Centro Médico Veterinario y Tienda de Mascotas</div>
            <div>Tegucigalpa, Ave. La Paz | Tel: +504 2242-5850</div>
            <div>leovetequi@gmail.com | RTN: 0801-9016-859530</div>
          </div>

          <div className="facturacion-factura-info">
            <div style={{ fontWeight: 800, fontSize: 18 }}>FACTURA</div>
            <div>
              <strong>Número:</strong> {numFactura(facturaSeleccionada)}
            </div>
            <div>
              <strong>Fecha:</strong>{" "}
              {safeDate(facturaSeleccionada.fecha || facturaSeleccionada.createdAt)}
            </div>
            <div>
              <strong>Estado:</strong> {facturaSeleccionada.estado}
            </div>
            <div>
              <strong>Método:</strong> {facturaSeleccionada.metodoPago}
            </div>
          </div>
        </div>

        {/* === Bloque Fiscal === */}
        <div className="facturacion-fiscal-box">
          <div>
            <strong>CAI:</strong> {facturaSeleccionada.cai}
          </div>
          <div>
            <strong>Rango:</strong> {facturaSeleccionada.caiRangoDesde} a{" "}
            {facturaSeleccionada.caiRangoHasta}
            &nbsp;&nbsp;&nbsp;&nbsp;
            <strong>Fecha límite:</strong>{" "}
            {safeDate(facturaSeleccionada.caiFechaLimite)}
          </div>
        </div>

        {/* === Datos del Cliente === */}
        <div className="facturacion-form-row">
          <div className="facturacion-card">
            <h3>Datos del Cliente</h3>
            <div>
              <strong>Nombre:</strong> {facturaSeleccionada.cliente?.nombre}
            </div>
            <div>
              <strong>Mascota:</strong> {facturaSeleccionada.mascota?.nombre}
            </div>
            <div>
              <strong>RTN:</strong>{" "}
              {facturaSeleccionada.cliente?.rtn || "No especificado"}
            </div>
          </div>
          <div className="facturacion-card">
            <h3>Información de Pago</h3>
            <div>
              <strong>Método de pago:</strong>{" "}
              {facturaSeleccionada.metodoPago}
            </div>
          </div>
        </div>

        {/* === Tabla Detalle === */}
        <table className="facturacion-detalles-table">
          <thead>
            <tr>
              <th>Descripción</th>
              <th>Cantidad</th>
              <th>Precio Unitario</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {(facturaSeleccionada.servicios || []).map((s, i) => (
              <tr key={`s-${i}`}>
                <td data-label="Descripción">{s.nombre}</td>
                <td data-label="Cantidad">{s.cantidad}</td>
                <td data-label="Precio Unitario">
                  {currency(Number(s.precio ?? s.price ?? s.unitPrice ?? 0))}
                </td>
                <td data-label="Total">
                  {currency(
                    Number(s.precio ?? s.price ?? s.unitPrice ?? 0) *
                      (s.cantidad || 0)
                  )}
                </td>
              </tr>
            ))}
            {(facturaSeleccionada.productos || []).map((p, i) => {
              const nombre = p.nombre ?? p.name ?? "Producto";
              const precio = Number(p.precio ?? p.price ?? 0);
              return (
                <tr key={`p-${i}`}>
                  <td data-label="Descripción">{nombre}</td>
                  <td data-label="Cantidad">{p.cantidad}</td>
                  <td data-label="Precio Unitario">{currency(precio)}</td>
                  <td data-label="Total">
                    {currency(precio * (p.cantidad || 0))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* === Totales === */}
        <div className="facturacion-factura-totales">
          <div className="facturacion-total-row">
            <span>Subtotal</span>
            <strong>{currency(facturaSeleccionada.subtotal)}</strong>
          </div>
          {Number(facturaSeleccionada.descuentoTotal || 0) > 0 && (
            <>
              <div className="facturacion-total-row">
                <span>Descuento</span>
                <strong>{currency(facturaSeleccionada.descuentoTotal)}</strong>
              </div>
              <div className="facturacion-total-row">
                <span>Base imponible</span>
                <strong>{currency(facturaSeleccionada.baseImponible)}</strong>
              </div>
            </>
          )}
          <div className="facturacion-total-row">
            <span>ISV (15%)</span>
            <strong>{currency(facturaSeleccionada.impuesto)}</strong>
          </div>
          <div className="facturacion-total-row facturacion-grand-total">
            <span>TOTAL</span>
            <strong>{currency(facturaSeleccionada.total)}</strong>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

{/* =================== MODAL NUEVA/EDICIÓN =================== */}
      {showNuevoModal && (
        <div
          className={`facturacion-modal-overlay ${closingNuevoModal ? "closing" : "active"}`}
          onClick={(e) => e.stopPropagation()} // 🚫 Evita cierre al hacer clic fuera
        >
          <div className={`facturacion-modal ${closingNuevoModal ? "closing" : "active"}`}>
            <div className="facturacion-modal-header">
              <h2>{modoEdicion ? "Editar Factura" : "Nueva Factura"}</h2>
              <button className="facturacion-close-btn" onClick={closeNuevoModal}>
                <X size={16} />
              </button>
            </div>

            {/* Dueño/Mascota */}
            <div className="facturacion-form-section">
              <div className="facturacion-form-row">
                <div className="facturacion-form-group">
                  <label>Dueño *</label>
                  <select
                    value={formData.cliente.ownerId}
                    onChange={(e) => onSelectOwner(e.target.value)}
                    required
                  >
                    <option value="">Seleccionar dueño</option>
                    {owners.map((o, i) => (
                      <option key={o._id || o.id || `owner-${i}`} value={o._id || o.id}>
                        {o.full_name || o.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="facturacion-form-group">
                  <label>Mascota *</label>
                  <select
                    value={formData.mascota.petId}
                    onChange={(e) =>
                      setFormData((s) => ({ ...s, mascota: { petId: e.target.value } }))
                    }
                    disabled={!formData.cliente.ownerId}
                    required
                  >
                    <option value="">Seleccionar mascota</option>
                    {mascotasDelOwner.map((p, i) => (
                      <option key={p._id || p.id || `pet-${i}`} value={p._id || p.id}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* RTN / Método de pago */}
              <div className="facturacion-form-row">
                <div className="facturacion-form-group">
                  <label>RTN (14 dígitos)</label>
                  <input
                    value={formData.cliente.rtn}
                    maxLength={14}
                    onChange={(e) =>
                      setFormData((s) => ({
                        ...s,
                        cliente: { ...s.cliente, rtn: e.target.value.replace(/\D/g, "") },
                      }))
                    }
                    placeholder="08011999001234"
                  />
                </div>
                <div className="facturacion-form-group">
                  <label>Método de pago *</label>
                  <select
                    value={formData.metodoPago}
                    onChange={(e) => setFormData((s) => ({ ...s, metodoPago: e.target.value }))}
                    required
                  >
                    <option value="">Seleccionar método</option>
                    <option>Efectivo</option>
                    <option>Tarjeta</option>
                    <option>Transferencia</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Servicios */}
            <div className="facturacion-form-section">
              <h3>Servicios</h3>
              <div className="facturacion-form-group">
                <select onChange={(e) => e.target.value && addServicio(e.target.value)}>
                  <option value="">Seleccionar servicio</option>
                  {servicios.map((s, i) => (
                    <option key={s._id || s.id || `serv-${i}`} value={s._id || s.id}>
                      {s.nombre} — {currency(s.precio || 0)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="facturacion-items-list">
                {formData.servicios.map((it, i) => (
                    <div key={it.servicioId || it._id || `srv-${i}`} className="facturacion-item-card">
                    <div className="facturacion-item-info">
                      <div className="facturacion-item-name">{it.nombre}</div>
                      <div className="facturacion-item-price">{currency(it.precio)}</div>
                    </div>
                    <div className="facturacion-item-controls">
                      <div className="facturacion-quantity-control">
                        <button type="button" onClick={() => updServQty(it.servicioId || it._id, -1)}>
                          –
                        </button>
                        <span>{it.cantidad || 1}</span>
                        <button type="button" onClick={() => updServQty(it.servicioId || it._id, +1)}>
                          +
                        </button>
                      </div>
                      <div className="facturacion-item-total">
                        {currency((it.precio || 0) * (it.cantidad || 1))}
                      </div>
                      <button
                        type="button"
                        className="facturacion-remove-item-btn"
                        onClick={() => delServ(it.servicioId || it._id)}
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Productos */}
            <div className="facturacion-form-section">
              <h3>Productos</h3>
              <div className="facturacion-form-group">
                <select onChange={(e) => e.target.value && addProducto(e.target.value)}>
                  <option value="">Seleccionar producto</option>
                  {productos.map((p, i) => (
                    <option key={p._id || p.id || `prod-${i}`} value={p._id || p.id}>
                       {p.name || p.nombre} — {currency(p.price ?? p.precio ?? 0)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="facturacion-items-list">
                {formData.productos.map((it, i) => {
                  const precio = Number(it.precio ?? it.price ?? 0);
                  return ( 
                  <div key={it.productId || it._id || `prd-${i}`} className="facturacion-item-card">
                      <div className="facturacion-item-info">
                        <div className="facturacion-item-name">{it.nombre || it.name}</div>
                        <div className="facturacion-item-price">{currency(precio)}</div>
                      </div>
                      <div className="facturacion-item-controls">
                        <div className="facturacion-quantity-control">
                          <button type="button" onClick={() => updProdQty(it.productId || it._id, -1)}>
                            –
                          </button>
                          <span>{it.cantidad || 1}</span>
                          <button type="button" onClick={() => updProdQty(it.productId || it._id, +1)}>
                            +
                          </button>
                        </div>
                        <div className="facturacion-item-total">
                          {currency(precio * (it.cantidad || 1))}
                        </div>
                        <button
                          type="button"
                          className="facturacion-remove-item-btn"
                          onClick={() => delProd(it.productId || it._id)}
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Descuentos */}
            <div className="facturacion-form-section">
              <h3>Descuentos</h3>
              <div className="facturacion-form-row">
                <div className="facturacion-form-group">
                  <label>Tipo de descuento</label>
                  <select
                    value={formData.descuentoTipo}
                    onChange={(e) => setFormData((s) => ({ ...s, descuentoTipo: e.target.value }))}
                  >
                    <option value="monto">Monto (L)</option>
                    <option value="porcentaje">Porcentaje (%)</option>
                  </select>
                </div>
                <div className="facturacion-form-group">
                  <label>Valor</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.descuentoValor}
                    onChange={(e) => setFormData((s) => ({ ...s, descuentoValor: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Totales */}
            <div className="facturacion-form-section">
              <div className="facturacion-form-totals">
                <div className="facturacion-total-row">
                  <span>Subtotal:</span> <strong>{currency(subtotal)}</strong>
                </div>
                <div className="facturacion-total-row">
                  <span>Descuento:</span> <strong>- {currency(descuentoTotal)}</strong>
                </div>
                <div className="facturacion-total-row">
                  <span>Base imponible:</span> <strong>{currency(baseImponible)}</strong>
                </div>
                <div className="facturacion-total-row">
                  <span>ISV (15%):</span> <strong>{currency(impuesto)}</strong>
                </div>
                <div className="facturacion-total-row facturacion-grand-total">
                  <span>TOTAL:</span> <strong>{currency(total)}</strong>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: ".5rem" }}>
              <button className="facturacion-btn-secondary" onClick={closeNuevoModal}>
                Cancelar
              </button>
              <button className="facturacion-btn-primary" onClick={handleGuardarFactura}>
                {modoEdicion ? "Guardar Cambios" : "Generar Factura"}
              </button>
            </div>
          </div>
        </div>
      )}

{/* =================== MODAL CONFIRM =================== */}
{showConfirm && (
  <div className={`facturacion-modal-overlay ${closingConfirm ? "closing" : "active"}`}>
    <div
      className={`facturacion-modal facturacion-confirm-modal ${closingConfirm ? "closing" : "active"}`}
      onClick={(e) => e.stopPropagation()} // 🚫 Evita cierre al hacer clic fuera
    >
      <div className="facturacion-modal-header">
        <h2>Confirmar Eliminación</h2>
        <button className="facturacion-close-btn" onClick={closeConfirmModal}>
          <X size={16} />
        </button>
      </div>

      <div className="facturacion-confirm-content">
        <p>
          ¿Eliminar la factura{" "}
          <strong>{numFactura(facturaAEliminar)}</strong> de{" "}
          <strong>{facturaAEliminar?.cliente?.nombre}</strong>?
        </p>

        <div className="facturacion-confirm-actions">
          <button
            className="facturacion-btn-secondary"
            onClick={closeConfirmModal}
          >
            Cancelar
          </button>
          <button
            className="facturacion-btn-danger"
            onClick={handleDelete}
          >
            Sí, eliminar
          </button>
        </div>
      </div>
    </div>
  </div>
)}
      {/* =================== MODAL LOTE CAI =================== */}
{showLoteModal && (
  <div className={`facturacion-modal-overlay ${closingLoteModal ? "closing" : "active"}`}>
    <div
      className={`facturacion-modal ${closingLoteModal ? "closing" : "active"}`}
      onClick={(e) => e.stopPropagation()} // Evita cierre fuera
    >
      <div className="facturacion-modal-header">
        <h2>Gestión de Lote CAI</h2>
        <button className="facturacion-close-btn" onClick={closeLoteModal}>
          <X size={16} />
        </button>
      </div>

      {/* === HISTORIAL DE LOTES === */}
      <div className="facturacion-form-section">
        <h3>Historial de Lotes CAI</h3>
        {loadingLotes ? (
          <p>Cargando lotes...</p>
        ) : lotes.length === 0 ? (
          <p>No hay lotes registrados.</p>
        ) : (
          <table className="facturacion-table">
            <thead>
              <tr>
                <th>CAI</th>
                <th>Rango</th>
                <th>Correlativo</th>
                <th>Vence</th>
                <th>Estado</th>
                {user?.role === "admin" && <th>Acción</th>}
              </tr>
            </thead>
            <tbody>
              {lotes.map((l) => {
                const dias = Math.ceil(
                  (new Date(l.fechaLimite) - new Date()) / (1000 * 60 * 60 * 24)
                );
                const vencido = dias <= 0;
                return (
                  <tr
                    key={l._id}
                    className={l.activo ? "lote-activo" : vencido ? "lote-vencido" : ""}
                  >
                    <td>{l.cai}</td>
                    <td>
                      {l.rangoDesde} → {l.rangoHasta}
                    </td>
                    <td>{l.correlativoActual}</td>
                    <td>{safeDate(l.fechaLimite)}</td>
                    <td>
                      {l.activo ? (
                        <span className="estado-lote activo">Activo</span>
                      ) : vencido ? (
                        <span className="estado-lote vencido">Vencido</span>
                      ) : (
                        <span className="estado-lote inactivo">Inactivo</span>
                      )}
                    </td>
                    {user?.role === "admin" && (
                      <td>
                        {!l.activo && !vencido && (
                          <button
                            className="facturacion-btn-primary mini"
                            onClick={() => activarLote(l._id)}
                          >
                            Activar
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* === REGISTRO DE NUEVO LOTE === */}
      {user?.role === "admin" && (
        <div className="facturacion-form-section">
          <h3>Registrar nuevo lote CAI</h3>
          <form
            onSubmit={async (e) => {
              e.preventDefault();

              const regexCAI = /^[A-Z0-9-]{10,40}$/;
              const regexRango = /^[0-9-]{17,19}$/;

              if (!regexCAI.test(nuevoLote.cai)) {
                notify(
                  "⚠️ El CAI debe contener solo letras, números y guiones (10 a 40 caracteres)."
                );
                return;
              }

              if (
                !regexRango.test(nuevoLote.rangoDesde) ||
                !regexRango.test(nuevoLote.rangoHasta)
              ) {
                notify("⚠️ Formato de rango inválido. Use 000-001-01-00000001");
                return;
              }

              if (nuevoLote.rangoDesde >= nuevoLote.rangoHasta) {
                notify("⚠️ El rango final debe ser mayor que el inicial.");
                return;
              }

              await crearLote(e);
            }}
          >
            <div className="facturacion-form-group">
              <label>CAI *</label>
              <input
                required
                placeholder="Ingrese el CAI proporcionado por el SAR"
                value={nuevoLote.cai}
                onChange={(e) =>
                  setNuevoLote({
                    ...nuevoLote,
                    cai: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""),
                  })
                }
                maxLength={40}
              />
            </div>

            <div className="facturacion-form-row">
              <div className="facturacion-form-group">
                <label>Rango desde *</label>
                <input
                  required
                  placeholder="000-001-01-00000001"
                  value={nuevoLote.rangoDesde}
                  onChange={(e) =>
                    setNuevoLote({
                      ...nuevoLote,
                      rangoDesde: e.target.value.replace(/[^0-9-]/g, ""),
                    })
                  }
                  maxLength={19}
                />
              </div>
              <div className="facturacion-form-group">
                <label>Rango hasta *</label>
                <input
                  required
                  placeholder="000-001-01-00005000"
                  value={nuevoLote.rangoHasta}
                  onChange={(e) =>
                    setNuevoLote({
                      ...nuevoLote,
                      rangoHasta: e.target.value.replace(/[^0-9-]/g, ""),
                    })
                  }
                  maxLength={19}
                />
              </div>
            </div>

            <button className="facturacion-btn-primary" type="submit">
              Crear Lote
            </button>
          </form>
        </div>
      )}
    </div>
  </div>
)}
      {/* TOAST */} {showNotification && ( <div className="facturacion-notification-success show">✅ {notificationMessage}</div> )} </div>
)}
