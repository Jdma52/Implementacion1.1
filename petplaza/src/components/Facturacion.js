// src/components/Facturacion.js
import React, { useEffect, useMemo, useState } from "react";
import "../CSS/Facturacion.css";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ====== APIs ======
import { getFacturas, createFactura, updateFacturaEstado, deleteFactura } from "../apis/facturasApi";
import { getOwners } from "../apis/ownersApi";
import { getPets } from "../apis/petsApi";
import { getServicios } from "../apis/serviciosApi";
import { getProducts } from "../apis/productsApi";

// ===== Helpers =====
const HNL = (n) =>
  `L ${Number(n || 0).toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const numFactura = (f) => {
  if (!f) return "";
  if (typeof f.numero === "number") return `F-${String(f.numero).padStart(3, "0")}`; // autoincrement BD
  if (typeof f.numero === "string") return f.numero;
  if (f.numeroFactura) return f.numeroFactura;
  return "";
};

export default function Facturacion() {
  // ===== Data =====
  const [facturas, setFacturas] = useState([]);
  const [owners, setOwners] = useState([]);
  const [pets, setPetsState] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [productos, setProducts] = useState([]);

  // ===== UI =====
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modales
  const [showModal, setShowModal] = useState(false);
  const [closingModal, setClosingModal] = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [closingDetalleModal, setClosingDetalleModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [closingConfirmModal, setClosingConfirmModal] = useState(false);

  // Estado interacciones
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
  const [facturaAEliminar, setFacturaAEliminar] = useState(null);

  // Notificación simple
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  // ===== Form =====
  const [formData, setFormData] = useState({
    ownerId: "",
    petId: "",
    rtn: "",
    metodoPago: "",
    estado: "Pendiente",
    servicios: [], // [{_id,nombre,precio,cantidad}]
    productos: [], // [{_id,name/nombre,price/precio,cantidad}]
  });

  // ====== Carga inicial ======
  useEffect(() => {
    (async () => {
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
        setPetsState(ps || []);
        setServicios(ss || []);
        setProducts(prs || []);
      } catch (e) {
        notify("Error cargando datos");
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ====== Derivados ======
const mascotasDelOwner = useMemo(() => {
  if (!formData.ownerId || !Array.isArray(pets)) return [];
  return pets.filter(
    (p) => String(p.ownerId?._id || p.ownerId) === String(formData.ownerId)
  );
}, [pets, formData.ownerId]);



const subtotal = useMemo(() => {
  const serviciosArr = Array.isArray(formData.servicios) ? formData.servicios : [];
  const productosArr = Array.isArray(formData.productos) ? formData.productos : [];

  const subS = serviciosArr.reduce((a, s) => a + (s.precio || s.price || 0) * (s.cantidad || 1), 0);
  const subP = productosArr.reduce((a, p) => a + (p.precio || p.price || 0) * (p.cantidad || 1), 0);

  return subS + subP;
}, [formData.servicios, formData.productos]);


  const isv = subtotal * 0.15;
  const total = subtotal + isv;

  // ====== Notificación ======
  const notify = (msg) => {
    setNotificationMessage(msg);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  // ====== CRUD ======
  const refrescarFacturas = async () => {
    const fs = await getFacturas();
    setFacturas(fs || []);
  };

  const openModal = () => {
    setShowModal(true);
    setClosingModal(false);
  };
  const closeModal = () => {
    setClosingModal(true);
    setTimeout(() => {
      setShowModal(false);
      setClosingModal(false);
      setFormData({
        ownerId: "",
        petId: "",
        rtn: "",
        metodoPago: "",
        estado: "Pendiente",
        servicios: [],
        productos: [],
      });
    }, 250);
  };

  const openDetalleModal = (f) => {
    setFacturaSeleccionada(f);
    setShowDetalleModal(true);
    setClosingDetalleModal(false);
  };
  const closeDetalleModal = () => {
    setClosingDetalleModal(true);
    setTimeout(() => {
      setShowDetalleModal(false);
      setClosingDetalleModal(false);
      setFacturaSeleccionada(null);
    }, 250);
  };

  const openConfirmModal = (f) => {
    setFacturaAEliminar(f);
    setShowConfirmModal(true);
    setClosingConfirmModal(false);
  };
  const closeConfirmModal = () => {
    setClosingConfirmModal(true);
    setTimeout(() => {
      setShowConfirmModal(false);
      setClosingConfirmModal(false);
      setFacturaAEliminar(null);
    }, 250);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.ownerId || !formData.petId || !formData.metodoPago) {
      notify("Complete los campos requeridos");
      return;
    }
    try {
      // Adaptar items a tu backend
      const serviciosPayload = formData.servicios.map((s) => ({
        servicioId: s._id || s.servicioId,
        cantidad: s.cantidad || 1,
      }));
      const productosPayload = formData.productos.map((p) => ({
        productId: p._id || p.productId,
        cantidad: p.cantidad || 1,
      }));

      const payload = {
        cliente: { ownerId: formData.ownerId, rtn: formData.rtn || "" },
        mascota: { petId: formData.petId },
        servicios: serviciosPayload,
        products: productosPayload,
        subtotal,
        impuesto: isv,
        total,
        estado: formData.estado || "Pendiente",
        metodoPago: formData.metodoPago,
      };

      await createFactura(payload); // BD autogenera 'numero'
      notify("Factura creada correctamente");
      closeModal();
      await refrescarFacturas();
    } catch (err) {
      notify(err.message || "No se pudo crear la factura");
      console.error(err);
    }
  };

  const cambiarEstado = async (f) => {
    try {
      const nuevo = f.estado === "Pagado" ? "Pendiente" : "Pagado";
      await updateFacturaEstado(f._id, nuevo);
      notify("Estado de factura actualizado");
      await refrescarFacturas();
    } catch (err) {
      notify("Error actualizando estado");
      console.error(err);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteFactura(facturaAEliminar._id);
      notify("Factura eliminada exitosamente");
      closeConfirmModal();
      await refrescarFacturas();
    } catch (err) {
      notify("Error eliminando factura");
      console.error(err);
    }
  };

  // ====== Items en formulario ======
  const addServicio = (id) => {
    if (!id) return;
    const s = (Array.isArray(servicios) ? servicios : []).find((x) => x._id === id);
    if (!s) return;
    setFormData((p) => {
      const ex = p.servicios.find((i) => (i._id || i.servicioId) === s._id);
      if (ex) {
        return {
          ...p,
          servicios: p.servicios.map((i) =>
            (i._id || i.servicioId) === s._id ? { ...i, cantidad: (i.cantidad || 1) + 1 } : i
          ),
        };
      }
      return { ...p, servicios: [...p.servicios, { ...s, cantidad: 1, precio: s.precio }] };
    });
  };
  const updServQty = (id, d) =>
    setFormData((p) => ({
      ...p,
      servicios: p.servicios
        .map((i) =>
          (i._id || i.servicioId) === id ? { ...i, cantidad: Math.max(0, (i.cantidad || 1) + d) } : i
        )
        .filter((i) => (i.cantidad || 0) > 0),
    }));
  const delServ = (id) =>
    setFormData((p) => ({ ...p, servicios: p.servicios.filter((i) => (i._id || i.servicioId) !== id) }));

   // ====== Productos ======
  const addProducto = (id) => {
    if (!id) return;
    const pr = (Array.isArray(productos) ? productos : []).find((x) => x._id === id);
    if (!pr) return;
    const precio = pr.price ?? pr.precio ?? 0;
    const nombre = pr.name ?? pr.nombre ?? "Producto";

    setFormData((p) => {
      const ex = p.productos.find((i) => (i._id || i.productId) === pr._id);
      if (ex) {
        return {
          ...p,
          productos: p.productos.map((i) =>
            (i._id || i.productId) === pr._id ? { ...i, cantidad: (i.cantidad || 1) + 1 } : i
          ),
        };
      }
      return { ...p, productos: [...p.productos, { ...pr, nombre, precio, cantidad: 1 }] };
    });
  };

  const updProdQty = (id, d) =>
    setFormData((p) => ({
      ...p,
      productos: p.productos
        .map((i) =>
          (i._id || i.productId) === id ? { ...i, cantidad: Math.max(0, (i.cantidad || 1) + d) } : i
        )
        .filter((i) => (i.cantidad || 0) > 0),
    }));

  const delProd = (id) =>
    setFormData((p) => ({
      ...p,
      productos: p.productos.filter((i) => (i._id || i.productId) !== id),
    }));

  // ====== PDF ======
  const generarPDF = (f) => {
    const fac = f || facturaSeleccionada;
    if (!fac) return;

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const m = 48;

    // Encabezado / Empresa
    doc.setFont("helvetica", "bold").setFontSize(20).text("PETPLAZA HOSPIVET", m, m + 6);
    doc.setFont("helvetica", "normal").setFontSize(11);
    doc.text("Sistema de Gestión Veterinaria", m, m + 26);
    doc.text("Tegucigalpa, Ave. La Paz | Tel: +504 2242-5850", m, m + 42);

    // Info factura
    const num = numFactura(fac);
    doc.setFont("helvetica", "bold").setFontSize(13);
    doc.text(`FACTURA ${num}`, 595 - m, m + 6, { align: "right" });
    doc.setFont("helvetica", "normal").setFontSize(10);
    doc.text(`Fecha: ${new Date(fac.fecha).toLocaleDateString()}`, 595 - m, m + 26, { align: "right" });
    doc.text(`Estado: ${fac.estado}`, 595 - m, m + 42, { align: "right" });
    doc.text(`Método: ${fac.metodoPago || "-"}`, 595 - m, m + 58, { align: "right" });

    // Separador
    doc.setDrawColor(5, 150, 105).setLineWidth(2).line(m, m + 70, 595 - m, m + 70);

    // Cliente / Mascota
    let y = m + 92;
    doc.setFont("helvetica", "bold").text("DATOS DEL CLIENTE", m, y);
    doc.text("DATOS DE LA MASCOTA", 320, y);
    y += 18;
    doc.setFont("helvetica", "normal");
    doc.text(`Nombre: ${fac?.cliente?.nombre || "-"}`, m, y);
    doc.text(`Nombre: ${fac?.mascota?.nombre || "-"}`, 320, y);
    y += 16;
    doc.text(`Teléfono: ${fac?.cliente?.telefono || "-"}`, m, y);
    doc.text(`Especie: ${fac?.mascota?.especie || "-"}`, 320, y);
    y += 16;
    doc.text(`Email: ${fac?.cliente?.email || "-"}`, m, y);
    doc.text(`Raza: ${fac?.mascota?.raza || "-"}`, 320, y);
    y += 16;
    doc.text(`RTN: ${fac?.cliente?.rtn || "-"}`, m, y);

    // Detalle
    const rows = [];
    (fac.servicios || []).forEach((s) =>
      rows.push([s.nombre, s.cantidad, HNL(s.precio), HNL((s.precio || 0) * (s.cantidad || 0))])
    );
    (fac.productos || []).forEach((p) => {
      const precio = p.precio ?? p.price ?? 0;
      const nombre = p.nombre ?? p.name ?? "Producto";
      rows.push([nombre, p.cantidad, HNL(precio), HNL(precio * (p.cantidad || 0))]);
    });

    autoTable(doc, {
      head: [["Descripción", "Cantidad", "Precio Unitario", "Total"]],
      body: rows,
      startY: y + 22,
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 6 },
      headStyles: { fillColor: [5, 150, 105], textColor: 255 },
      columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } },
      margin: { left: m, right: m },
    });

    const endY = doc.lastAutoTable.finalY + 10;
    const subtotalf = Number(fac.subtotal ?? 0);
    const imp = Number(fac.impuesto ?? fac.isv ?? subtotalf * 0.15);
    const totalf = Number(fac.total ?? subtotalf + imp);

    doc.setFont("helvetica", "normal").setFontSize(10);
    doc.text(`Subtotal: ${HNL(subtotalf)}`, 595 - m, endY + 12, { align: "right" });
    doc.text(`ISV (15%): ${HNL(imp)}`, 595 - m, endY + 28, { align: "right" });
    doc.setFont("helvetica", "bold").setFontSize(12);
    doc.text(`TOTAL: ${HNL(totalf)}`, 595 - m, endY + 48, { align: "right" });

    doc.setFont("helvetica", "italic").setFontSize(9);
    doc.text("¡Gracias por confiar en PetPlaza HospiVet!", 297.5, 820, { align: "center" });

    doc.save(`${num || "Factura"}.pdf`);
  };

  // ====== Filtro y estadísticas ======
  const filteredFacturas = useMemo(() => {
    const s = (searchTerm || "").toLowerCase();
    return (facturas || []).filter((f) => {
      const n = numFactura(f).toLowerCase();
      const c = f?.cliente?.nombre?.toLowerCase() || "";
      const m = f?.mascota?.nombre?.toLowerCase() || "";
      return n.includes(s) || c.includes(s) || m.includes(s);
    });
  }, [facturas, searchTerm]);

  const stats = useMemo(() => {
    const total = facturas.length;
    const pagadas = facturas.filter((f) => f.estado === "Pagado").length;
    const pendientes = total - pagadas;
    const recaudado = facturas
      .filter((f) => f.estado === "Pagado")
      .reduce((a, f) => a + Number(f.total || 0), 0);
    return { total, pagadas, pendientes, recaudado };
  }, [facturas]);

  // ====== UI ======
  return (
    <div className="facturacion-container">
      {/* Encabezado */}
      <div className="facturacion-header">
        <div>
          <h1 className="facturacion-title">Gestión de Facturación</h1>
          <p className="facturacion-subtitle">Administrar facturas y pagos</p>
        </div>
      </div>

      {/* Estadísticas (las que te gustaron) */}
      <div className="facturacion-stats-grid">
        <div className="facturacion-stats-card">
          <div className="facturacion-stats-icon">📄</div>
          <div>
            <p className="facturacion-stats-number">{stats.total}</p>
            <p className="facturacion-stats-label">Total Facturas</p>
          </div>
        </div>
        <div className="facturacion-stats-card">
          <div className="facturacion-stats-icon">💵</div>
          <div>
            <p className="facturacion-stats-number">{HNL(stats.recaudado)}</p>
            <p className="facturacion-stats-label">Total Recaudado</p>
          </div>
        </div>
        <div className="facturacion-stats-card">
          <div className="facturacion-stats-icon">✅</div>
          <div>
            <p className="facturacion-stats-number">{stats.pagadas}</p>
            <p className="facturacion-stats-label">Facturas Pagadas</p>
          </div>
        </div>
        <div className="facturacion-stats-card">
          <div className="facturacion-stats-icon">⏳</div>
          <div>
            <p className="facturacion-stats-number">{stats.pendientes}</p>
            <p className="facturacion-stats-label">Facturas Pendientes</p>
          </div>
        </div>
      </div>

      {/* Search + Nueva */}
      <div className="facturacion-search-button-container">
        <div className="facturacion-search-box">
          <span className="facturacion-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar por número, cliente o mascota"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="facturacion-btn-primary facturacion-btn-flash" onClick={openModal}>
          ➕ Nueva Factura
        </button>
      </div>

      {/* Tabla */}
      <div className="facturacion-table-container">
        <div className="facturacion-table-wrapper">
          <table className="facturacion-table">
            <thead>
              <tr>
                <th>Número</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Mascota</th>
                <th>Total</th>
                <th>Método de Pago</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="ppz-loading">
                    <div className="ppz-spinner" />
                    Cargando facturas…
                  </td>
                </tr>
              ) : filteredFacturas.length === 0 ? (
                <tr>
                  <td colSpan="8" className="ppz-empty-state">No hay facturas registradas</td>
                </tr>
              ) : (
                filteredFacturas.map((f) => (
                  <tr key={f._id}>
                    <td><div className="facturacion-numero-factura">📄 {numFactura(f)}</div></td>
                    <td>{new Date(f.fecha).toLocaleDateString()}</td>
                    <td>{f?.cliente?.nombre}</td>
                    <td>{f?.mascota?.nombre}</td>
                    <td className="facturacion-total-amount">{HNL(f.total)}</td>
                    <td><span className="facturacion-metodo-pago-badge">{f.metodoPago}</span></td>
                    <td>
                      <button className={`facturacion-status-btn ${f.estado.toLowerCase()}`} onClick={() => cambiarEstado(f)}>
                        {f.estado}
                      </button>
                    </td>
                    <td>
                      <div className="facturacion-action-buttons">
                        <button className="facturacion-action-btn view" title="Ver Detalle" onClick={() => openDetalleModal(f)}>
                          👁
                        </button>
                        <button className="facturacion-action-btn download" title="Descargar PDF" onClick={() => generarPDF(f)}>
                          ⬇
                        </button>
                        <button className="facturacion-action-btn delete" title="Eliminar" onClick={() => openConfirmModal(f)}>
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL NUEVA FACTURA (angosto & limpio) */}
      {showModal && (
        <div
          className={`facturacion-modal-overlay ${closingModal ? "closing" : "active"}`}
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.target.classList.contains("facturacion-modal-overlay") && closeModal()}
        >
          <div className={`facturacion-modal facturacion-modal-compact ${closingModal ? "closing" : "active"}`}>
            <div className="facturacion-modal-header">
              <h2>Nueva Factura</h2>
              <button className="facturacion-close-btn" onClick={closeModal}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="facturacion-form-row">
                <div className="facturacion-form-group">
                  <label>Dueño *</label>
                  <select
                    value={formData.ownerId}
                    onChange={(e) => setFormData((p) => ({ ...p, ownerId: e.target.value, petId: "" }))}
                    required
                  >
                    <option value="">Seleccionar dueño</option>
                    {owners.map((o) => (
                      <option key={o._id} value={o._id}>
                        {o.full_name || o.nombre || o.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="facturacion-form-group">
                  <label>Mascota *</label>
                  <select
                    value={formData.petId}
                    onChange={(e) => setFormData((p) => ({ ...p, petId: e.target.value }))}
                    required
                    disabled={!formData.ownerId}
                  >
                    <option value="">Seleccionar mascota</option>
                    {mascotasDelOwner.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.nombre} ({m.especie})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="facturacion-form-row">
                <div className="facturacion-form-group">
                  <label>RTN (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ingrese el RTN"
                    value={formData.rtn}
                    onChange={(e) => setFormData((p) => ({ ...p, rtn: e.target.value }))}
                  />
                </div>
                <div className="facturacion-form-group">
                  <label>Método de pago *</label>
                  <select
                    value={formData.metodoPago}
                    onChange={(e) => setFormData((p) => ({ ...p, metodoPago: e.target.value }))}
                    required
                  >
                    <option value="">Seleccionar método</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Tarjeta">Tarjeta</option>
                    <option value="Transferencia">Transferencia</option>
                  </select>
                </div>
              </div>

              {/* Servicios */}
              <div className="facturacion-form-section">
                <h3>Servicios</h3>
                <div className="facturacion-items-selector">
                  <select onChange={(e) => addServicio(e.target.value)}>
                    <option value="">Seleccionar servicio</option>
                    {servicios.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.nombre} — {HNL(s.precio)}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.servicios.length > 0 && (
                  <div className="facturacion-items-list">
                    <h4>Servicios agregados</h4>
                    {formData.servicios.map((it) => (
                      <div key={it._id || it.servicioId} className="facturacion-item-card">
                        <div className="facturacion-item-info">
                          <div className="facturacion-item-name">{it.nombre}</div>
                          <div className="facturacion-item-price">{HNL(it.precio)}</div>
                        </div>
                        <div className="facturacion-item-controls">
                          <div className="facturacion-quantity-control">
                            <button type="button" onClick={() => updServQty(it._id || it.servicioId, -1)}>–</button>
                            <span>{it.cantidad || 1}</span>
                            <button type="button" onClick={() => updServQty(it._id || it.servicioId, +1)}>+</button>
                          </div>
                          <div className="facturacion-item-total">
                            {HNL((it.precio || 0) * (it.cantidad || 1))}
                          </div>
                          <button
                            type="button"
                            className="facturacion-remove-item-btn"
                            onClick={() => delServ(it._id || it.servicioId)}
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Productos */}
              <div className="facturacion-form-section">
                <h3>Productos</h3>
                <div className="facturacion-items-selector">
                  <select onChange={(e) => addProducto(e.target.value)}>
                    <option value="">Seleccionar producto</option>
                    {productos.map((p) => (
                      <option key={p._id} value={p._id}>
                        {(p.name || p.nombre) + " — " + HNL(p.price ?? p.precio ?? 0)}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.productos.length > 0 && (
                  <div className="facturacion-items-list">
                    <h4>Productos agregados</h4>
                    {formData.productos.map((it) => (
                      <div key={it._id || it.productId} className="facturacion-item-card">
                        <div className="facturacion-item-info">
                          <div className="facturacion-item-name">{it.nombre ?? it.name}</div>
                          <div className="facturacion-item-price">{HNL(it.precio ?? it.price)}</div>
                        </div>
                        <div className="facturacion-item-controls">
                          <div className="facturacion-quantity-control">
                            <button type="button" onClick={() => updProdQty(it._id || it.productId, -1)}>–</button>
                            <span>{it.cantidad || 1}</span>
                            <button type="button" onClick={() => updProdQty(it._id || it.productId, +1)}>+</button>
                          </div>
                          <div className="facturacion-item-total">
                            {HNL((it.precio ?? it.price ?? 0) * (it.cantidad || 1))}
                          </div>
                          <button
                            type="button"
                            className="facturacion-remove-item-btn"
                            onClick={() => delProd(it._id || it.productId)}
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Totales */}
              <div className="facturacion-form-totals">
                <div className="facturacion-total-row"><span>Subtotal:</span><span>{HNL(subtotal)}</span></div>
                <div className="facturacion-total-row"><span>ISV (15%):</span><span>{HNL(isv)}</span></div>
                <div className="facturacion-total-row facturacion-grand-total"><span>Total:</span><span>{HNL(total)}</span></div>
              </div>

              <div className="facturacion-modal-actions">
                <button type="button" className="facturacion-btn-secondary" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="facturacion-btn-primary">Generar Factura</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL VISTA PREVIA */}
      {showDetalleModal && facturaSeleccionada && (
        <div
          className={`facturacion-modal-overlay ${closingDetalleModal ? "closing" : "active"}`}
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.target.classList.contains("facturacion-modal-overlay") && closeDetalleModal()}
        >
          <div className={`facturacion-modal facturacion-modal-preview ${closingDetalleModal ? "closing" : "active"}`}>
            <div className="facturacion-modal-header">
              <h2>Vista Previa de Factura</h2>
              <div className="facturacion-modal-actions">
                <button className="facturacion-btn-secondary" onClick={() => generarPDF()}>
                  🖨 Imprimir
                </button>
                <button className="facturacion-close-btn" onClick={closeDetalleModal}>✕</button>
              </div>
            </div>

            <div className="facturacion-factura-container">
              <div className="facturacion-factura-header">
                <div className="facturacion-factura-empresa">
                  <h2>PetPlaza</h2>
                  <p>Sistema de Gestión Veterinaria</p>
                  <p>Tegucigalpa, Ave. La Paz</p>
                  <p>Tel: +504 2242-5850</p>
                </div>
                <div className="facturacion-factura-info">
                  <h3>FACTURA</h3>
                  <p><strong>Número:</strong> {numFactura(facturaSeleccionada)}</p>
                  <p><strong>Fecha:</strong> {new Date(facturaSeleccionada.fecha).toLocaleDateString()}</p>
                  <p>
                    <strong>Estado:</strong>{" "}
                    <span className={`facturacion-estado-badge ${facturaSeleccionada.estado.toLowerCase()}`}>
                      {facturaSeleccionada.estado}
                    </span>
                  </p>
                  <p><strong>Método:</strong> {facturaSeleccionada.metodoPago}</p>
                </div>
              </div>

              <div className="facturacion-factura-cliente">
                <div className="facturacion-cliente-info">
                  <h4>Datos del Cliente</h4>
                  <p><strong>Nombre:</strong> {facturaSeleccionada?.cliente?.nombre}</p>
                  <p><strong>Teléfono:</strong> {facturaSeleccionada?.cliente?.telefono || "-"}</p>
                  <p><strong>Email:</strong> {facturaSeleccionada?.cliente?.email || "-"}</p>
                  <p><strong>RTN:</strong> {facturaSeleccionada?.cliente?.rtn || "No especificado"}</p>
                </div>
                <div className="facturacion-pago-info">
                  <h4>Datos de la Mascota</h4>
                  <p><strong>Nombre:</strong> {facturaSeleccionada?.mascota?.nombre}</p>
                  <p><strong>Especie:</strong> {facturaSeleccionada?.mascota?.especie || "-"}</p>
                  <p><strong>Raza:</strong> {facturaSeleccionada?.mascota?.raza || "-"}</p>
                </div>
              </div>

              <div className="facturacion-factura-detalles">
                <h4>Detalles de la Factura</h4>

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
                        <td>{s.nombre}</td>
                        <td>{s.cantidad}</td>
                        <td>{HNL(s.precio)}</td>
                        <td>{HNL((s.precio || 0) * (s.cantidad || 0))}</td>
                      </tr>
                    ))}
                    {(facturaSeleccionada.productos || []).map((p, i) => {
                      const precio = p.precio ?? p.price ?? 0;
                      const nombre = p.nombre ?? p.name ?? "Producto";
                      return (
                        <tr key={`p-${i}`}>
                          <td>{nombre}</td>
                          <td>{p.cantidad}</td>
                          <td>{HNL(precio)}</td>
                          <td>{HNL(precio * (p.cantidad || 0))}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="facturacion-factura-totales">
                  <div className="facturacion-total-row"><span>Subtotal:</span><span>{HNL(facturaSeleccionada.subtotal)}</span></div>
                  <div className="facturacion-total-row"><span>ISV (15%):</span><span>{HNL(facturaSeleccionada.impuesto ?? facturaSeleccionada.isv)}</span></div>
                  <div className="facturacion-total-row facturacion-total-final"><span>Total:</span><span>{HNL(facturaSeleccionada.total)}</span></div>
                </div>
              </div>

              <div className="facturacion-factura-footer">
                <p>¡Gracias por confiar en PetPlaza!</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMACIÓN ELIMINAR */}
      {showConfirmModal && (
        <div
          className={`facturacion-modal-overlay ${closingConfirmModal ? "closing" : "active"}`}
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.target.classList.contains("facturacion-modal-overlay") && closeConfirmModal()}
        >
          <div className={`facturacion-modal facturacion-confirm-modal ${closingConfirmModal ? "closing" : "active"}`}>
            <div className="facturacion-modal-header">
              <h2>Confirmar Eliminación</h2>
              <button className="facturacion-close-btn" onClick={closeConfirmModal}>✕</button>
            </div>
            <div className="facturacion-confirm-content">
              <p>
                ¿Estás seguro de eliminar la factura{" "}
                <strong>{numFactura(facturaAEliminar)}</strong> de{" "}
                <strong>{facturaAEliminar?.cliente?.nombre}</strong>?
              </p>
              <div className="facturacion-confirm-actions">
                <button className="facturacion-btn-secondary" onClick={closeConfirmModal}>
                  Cancelar
                </button>
                <button className="facturacion-btn-danger" onClick={handleDelete}>
                  Sí, eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICACIÓN */}
      {showNotification && (
        <div className="facturacion-notification-success show">
          ✅ {notificationMessage}
        </div>
      )}
    </div>
  );
}
