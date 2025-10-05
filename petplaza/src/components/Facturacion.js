import React, { useState, useEffect } from "react";
import { 
  Plus, Search, Trash2, Download, FileText, User, 
  PawPrint, CreditCard, Calendar, DollarSign, Eye, X,
  MinusCircle, PlusCircle, Printer, AlertCircle, Check, XCircle
} from "lucide-react";
import "../CSS/Facturacion.css";

// Importación corregida de jspdf y autotable
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Importar el logo
import logo from "../assets/logo1.png";

const Facturacion = ({ dueñosData, mascotasData }) => {
  // Estado del componente
  const [facturas, setFacturas] = useState([
    { 
      id: 1, 
      numero: "F-001", 
      fecha: "2025-08-24", 
      cliente: "Juan Pérez", 
      mascota: "Max", 
      total: 125.50, 
      estado: "Pagado", 
      metodoPago: "Tarjeta",
      rtn: "0801199012345",
      servicios: [{id: 1, nombre: "Consulta general", precio: 25.00, cantidad: 1}],
      productos: [{id: 1, nombre: "Alimento premium 5kg", precio: 45.00, cantidad: 2}],
      subtotal: 115.50,
      impuesto: 10.00
    }
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [closingModal, setClosingModal] = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [closingDetalleModal, setClosingDetalleModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [closingConfirmModal, setClosingConfirmModal] = useState(false);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
  const [facturaAEliminar, setFacturaAEliminar] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [formData, setFormData] = useState({
    cliente: "",
    mascota: "",
    rtn: "",
    servicios: [],
    productos: [],
    subtotal: 0,
    impuesto: 0,
    total: 0,
    metodoPago: ""
  });

  // Datos de ejemplo si no se pasan por props
  const clientes = dueñosData || [
    { id: 1, nombre: "Juan Pérez", mascotas: ["Max", "Bella"] },
    { id: 2, nombre: "María García", mascotas: ["Luna", "Coco"] },
    { id: 3, nombre: "Carlos López", mascotas: ["Rocky"] },
  ];
  
  const servicios = [
    { id: 1, nombre: "Consulta General", precio: 300.00 },
    { id: 2, nombre: "Vacunación", precio: 150.00 },
    { id: 3, nombre: "Desparasitación", precio: 200.00 },
    { id: 4, nombre: "Cirugía menor", precio: 500.00 },
  ];
  
  const productos = [
    { id: 1, nombre: "Antibiótico Amoxicilina", precio: 25.00 },
    { id: 2, nombre: "Alimento Premium 5kg", precio: 45.00 },
    { id: 3, nombre: "Juguete para mascota", precio: 15.00 },
    { id: 4, nombre: "Shampoo medicinal", precio: 30.00 },
  ];
  
  const metodosPago = ["Efectivo", "Tarjeta", "Transferencia"];

  // Cálculo de estadísticas
  const totalFacturas = facturas.length;
  const totalFacturado = facturas.reduce((acc, f) => acc + f.total, 0);
  const facturasPagadas = facturas.filter(f => f.estado === "Pagado").length;
  const facturasPendientes = totalFacturas - facturasPagadas;

  // Mostrar notificación
  const mostrarNotificacion = (mensaje) => {
    setNotificationMessage(mensaje);
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  };

  // Lógica para manejar items en nueva factura
  const handleAddItem = (item, type) => {
    setFormData(prevData => {
      const items = prevData[type];
      const existingItem = items.find(i => i.id === item.id);
      let newItems;
      if (existingItem) {
        newItems = items.map(i => i.id === item.id ? { ...i, cantidad: i.cantidad + 1 } : i);
      } else {
        newItems = [...items, { ...item, cantidad: 1 }];
      }
      return { ...prevData, [type]: newItems };
    });
  };

  const handleUpdateQuantity = (itemId, type, delta) => {
    setFormData(prevData => {
      const items = prevData[type];
      const newItems = items
        .map(i => i.id === itemId ? { ...i, cantidad: i.cantidad + delta } : i)
        .filter(i => i.cantidad > 0);
      return { ...prevData, [type]: newItems };
    });
  };

  const handleRemoveItem = (itemId, type) => {
    setFormData(prevData => ({ ...prevData, [type]: prevData[type].filter(i => i.id !== itemId) }));
  };

  useEffect(() => {
    const subtotal = formData.servicios.reduce((acc, s) => acc + (s.precio * s.cantidad), 0) + 
                     formData.productos.reduce((acc, p) => acc + (p.precio * p.cantidad), 0);
    const impuesto = subtotal * 0.15;
    const total = subtotal + impuesto;
    setFormData(prev => ({ ...prev, subtotal, impuesto, total }));
  }, [formData.servicios, formData.productos]);

  // Manejo de modales con transiciones
  const openModal = () => {
    setShowModal(true);
    setClosingModal(false);
  };

  const closeModal = () => {
    setClosingModal(true);
    setTimeout(() => {
      setShowModal(false);
      setClosingModal(false);
      setFormData({ cliente: "", mascota: "", rtn: "", servicios: [], productos: [], subtotal: 0, impuesto: 0, total: 0, metodoPago: "" });
    }, 300);
  };

  const openDetalleModal = (factura) => {
    setFacturaSeleccionada(factura);
    setShowDetalleModal(true);
    setClosingDetalleModal(false);
  };

  const closeDetalleModal = () => {
    setClosingDetalleModal(true);
    setTimeout(() => {
      setShowDetalleModal(false);
      setClosingDetalleModal(false);
      setFacturaSeleccionada(null);
    }, 300);
  };

  const openConfirmModal = (factura) => {
    setFacturaAEliminar(factura);
    setShowConfirmModal(true);
    setClosingConfirmModal(false);
  };

  const closeConfirmModal = () => {
    setClosingConfirmModal(true);
    setTimeout(() => {
      setShowConfirmModal(false);
      setClosingConfirmModal(false);
      setFacturaAEliminar(null);
    }, 300);
  };

  // Manejo de facturas (CRUD)
  const handleSubmit = (e) => {
    e.preventDefault();
    const nuevaFactura = {
      id: Date.now(),
      numero: `F-${String(facturas.length + 1).padStart(3, '0')}`,
      fecha: new Date().toISOString().split('T')[0],
      estado: "Pendiente",
      ...formData
    };
    setFacturas([nuevaFactura, ...facturas]);
    closeModal();
    mostrarNotificacion("Factura creada exitosamente");
  };
  
  const handleDelete = () => {
    setFacturas(facturas.filter(f => f.id !== facturaAEliminar.id));
    closeConfirmModal();
    mostrarNotificacion("Factura eliminada exitosamente");
  };

  const cambiarEstado = (id) => {
    setFacturas(facturas.map(f => f.id === id ? { ...f, estado: f.estado === "Pagado" ? "Pendiente" : "Pagado" } : f));
    mostrarNotificacion("Estado de factura actualizado");
  };
  
const generarPDF = (facturaData) => {
  const factura = facturaData || facturaSeleccionada;
  if (!factura) return;
  
  const doc = new jsPDF();
  
  // ==================== ENCABEZADO PROFESIONAL MEJORADO ====================
  // Información de la empresa en el lado izquierdo - más compacta
  doc.setFontSize(12);
  doc.setTextColor(40, 180, 130);
  doc.setFont(undefined, 'bold');
  doc.text("A.L.M. INVERSIONES SRL", 20, 15);
  
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.setFont(undefined, 'normal');
  doc.text("PetPlaza HospiVet - Sistema de Gestión Veterinaria", 20, 21);
  doc.text("Tegucigalpa, Ave. La Paz, Col. Palmira", 20, 26);
  doc.text("Tel: +504 2242-5850 | RTN: 08010000000000", 20, 31);
  
  // Logo centrado y mejor posicionado
  if (logo) {
    try {
      // Logo más pequeño y mejor posicionado
      const logoWidth = 35;  // Reducido para mejor balance
      const logoHeight = 25; // Reducido para mejor balance
      const logoX = 160;     // Posición desde la derecha
      const logoY = 12;      // Posición desde arriba
      
      doc.addImage(logo, 'PNG', logoX, logoY, logoWidth, logoHeight);
      
      // Marco decorativo opcional alrededor del logo
      doc.setDrawColor(40, 180, 130);
      doc.setLineWidth(0.5);
      doc.roundedRect(logoX - 2, logoY - 2, logoWidth + 4, logoHeight + 4, 2, 2);
    } catch (error) {
      console.warn("Error al cargar el logo:", error);
      // Fallback: texto si el logo no carga
      doc.setFontSize(10);
      doc.setTextColor(40, 180, 130);
      doc.text("PETPLAZA", 160, 20);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text("HOSPIVET", 160, 25);
    }
  } else {
    // Fallback cuando no hay logo
    doc.setFontSize(10);
    doc.setTextColor(40, 180, 130);
    doc.text("PETPLAZA", 160, 20);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("HOSPIVET", 160, 25);
  }
  
// Línea con color de marca pero muy sutil
//doc.setDrawColor(40, 180, 130); 
//doc.setLineWidth(0.2); 
//doc.line(20, 42, 190, 42);
  
  // ==================== TÍTULO FACTURA ====================
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'bold');
  doc.text("FACTURA", 105, 48, { align: "center" });
  
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.setFont(undefined, 'normal');
  doc.text("Documento Tributario - Factura Electrónica", 105, 53, { align: "center" });
  
  // ==================== INFORMACIÓN DE FACTURA Y CLIENTE ====================
  // Fondo para sección de información
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(15, 58, 180, 35, 3, 3, 'F');
  doc.setDrawColor(220, 220, 220);
  doc.roundedRect(15, 58, 180, 35, 3, 3);
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'bold');
  
  // Encabezados de columnas - 
  doc.text("INFORMACIÓN DE FACTURA", 30, 66);
  doc.text("INFORMACIÓN DEL CLIENTE", 120, 66);
  
  doc.setFont(undefined, 'normal');
  doc.setFontSize(9);
  
  // Columna izquierda - Información de factura - 
  doc.text(`Número: ${factura.numero}`, 20, 73);
  doc.text(`Fecha: ${factura.fecha}`, 20, 78);
  doc.text(`Estado: ${factura.estado}`, 20, 83);
  doc.text(`Método de pago: ${factura.metodoPago}`, 20, 88);
  
  // Columna derecha - Información de cliente
  doc.text(`Cliente: ${factura.cliente}`, 120, 73);
  doc.text(`Mascota: ${factura.mascota}`, 120, 78);
  doc.text(`RTN: ${factura.rtn || 'No especificado'}`, 120, 83);
  
  // ==================== TABLA DE DETALLES ====================
  const tableColumn = ["Descripción", "Cant.", "Precio Unit.", "Total"];
  const tableRows = [];
  
  // Agregar servicios
  factura.servicios.forEach(servicio => {
    const servicioData = [
      servicio.nombre,
      servicio.cantidad.toString(),
      `L. ${servicio.precio.toFixed(2)}`,
      `L. ${(servicio.precio * servicio.cantidad).toFixed(2)}`
    ];
    tableRows.push(servicioData);
  });
  
  // Agregar productos
  factura.productos.forEach(producto => {
    const productoData = [
      producto.nombre,
      producto.cantidad.toString(),
      `L. ${producto.precio.toFixed(2)}`,
      `L. ${(producto.precio * producto.cantidad).toFixed(2)}`
    ];
    tableRows.push(productoData);
  });
  
  // Crear tabla con autotable 
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 98, 
    theme: 'grid',
    styles: { 
      fontSize: 9,
      cellPadding: 4,
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
    },
    headStyles: { 
      fillColor: [40, 180, 130],
      textColor: 255,
      fontStyle: 'bold',
      lineWidth: 0.1,
    },
    bodyStyles: {
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { cellWidth: 'auto', fontStyle: 'bold' },
      1: { cellWidth: 15, halign: 'center' },
      2: { cellWidth: 25, halign: 'right' },
      3: { cellWidth: 25, halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: 15, right: 15 },
    tableLineWidth: 0.1,
  });
  
  // ==================== TOTALES  ====================
  const finalY = doc.lastAutoTable.finalY + 10;
  
  // Fondo para totales
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(120, finalY - 5, 75, 35, 3, 3, 'F');
  
  // Bordes para la sección de totales
  doc.setDrawColor(200, 200, 200);
  doc.roundedRect(120, finalY - 5, 75, 35, 3, 3);
  
  // Texto de totales
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text("Subtotal:", 125, finalY + 5);
  doc.text(`L. ${factura.subtotal.toFixed(2)}`, 175, finalY + 5, { align: "right" });
  
  doc.text("ISV (15%):", 125, finalY + 12);
  doc.text(`L. ${factura.impuesto.toFixed(2)}`, 175, finalY + 12, { align: "right" });
  
  // Línea separadora antes del total
  doc.setDrawColor(150, 150, 150);
  doc.line(125, finalY + 16, 175, finalY + 16);
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(40, 180, 130);
  doc.text("TOTAL:", 125, finalY + 25);
  doc.text(`L. ${factura.total.toFixed(2)}`, 175, finalY + 25, { align: "right" });
  
  // ==================== PIE DE PÁGINA PROFESIONAL ====================
  const footerY = finalY + 40;
  
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont(undefined, 'italic');
  
  // Línea separadora del footer
  doc.setDrawColor(200, 200, 200);
  doc.line(15, footerY - 5, 195, footerY - 5);
  
  doc.text("¡Gracias por confiar en PetPlaza HospiVet!", 105, footerY, { align: "center" });
  doc.text("Su satisfacción y la salud de su mascota son nuestra prioridad", 105, footerY + 5, { align: "center" });
  doc.text("Factura generada electrónicamente - A.L.M. Inversiones SRL", 105, footerY + 10, { align: "center" });
  
  // ==================== GUARDAR PDF ====================
  doc.save(`factura-${factura.numero}.pdf`);
};


  const filteredFacturas = facturas.filter(f =>
    Object.values(f).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Obtener mascotas del cliente seleccionado
  const mascotasDelCliente = formData.cliente 
    ? clientes.find(c => c.nombre === formData.cliente)?.mascotas || []
    : [];

  return (
    <div className="facturacion-container">
      <div className="facturacion-header">
        <div>
          <h1 className="facturacion-title"><FileText size={22} /> Gestión de Facturación</h1>
          <p className="facturacion-subtitle">Administrar facturas y pagos</p>
        </div>
      </div>

      <div className="facturacion-stats-grid">
        <div className="facturacion-stats-card"><div className="facturacion-stats-icon"><FileText size={20} /></div><div><p className="facturacion-stats-number">{totalFacturas}</p><p className="facturacion-stats-label">Total Facturas</p></div></div>
        <div className="facturacion-stats-card"><div className="facturacion-stats-icon"><DollarSign size={20} /></div><div><p className="facturacion-stats-number">L {totalFacturado.toFixed(2)}</p><p className="facturacion-stats-label">Total Facturado</p></div></div>
        <div className="facturacion-stats-card"><div className="facturacion-stats-icon"><CreditCard size={20} /></div><div><p className="facturacion-stats-number">{facturasPagadas}</p><p className="facturacion-stats-label">Facturas Pagadas</p></div></div>
        <div className="facturacion-stats-card"><div className="facturacion-stats-icon"><Calendar size={20} /></div><div><p className="facturacion-stats-number">{facturasPendientes}</p><p className="facturacion-stats-label">Facturas Pendientes</p></div></div>
      </div>

      <div className="facturacion-search-button-container">
        <div className="facturacion-search-box">
          <Search className="facturacion-search-icon" size={18} />
          <input type="text" placeholder="Buscar por número, cliente o mascota" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <button className="facturacion-btn-primary facturacion-btn-flash" onClick={openModal}>
          <Plus size={18} /> Nueva Factura
        </button>
      </div>
      
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
              {filteredFacturas.map(f => (
                <tr key={f.id}>
                  <td><div className="facturacion-numero-factura"><FileText size={14} /> {f.numero}</div></td>
                  <td>{f.fecha}</td>
                  <td><div className="facturacion-cell-with-icon"><User size={14} /> {f.cliente}</div></td>
                  <td><div className="facturacion-cell-with-icon"><PawPrint size={14} /> {f.mascota}</div></td>
                  <td className="facturacion-total-amount">L {f.total.toFixed(2)}</td>
                  <td><span className="facturacion-metodo-pago-badge">{f.metodoPago}</span></td>
                  <td>
                    <button 
                      className={`facturacion-status-btn ${f.estado.toLowerCase()}`} 
                      onClick={() => cambiarEstado(f.id)}
                    >
                      {f.estado}
                    </button>
                  </td>
                  <td>
                    <div className="facturacion-action-buttons">
                      <button className="facturacion-action-btn view" title="Ver Detalle" onClick={() => openDetalleModal(f)}><Eye size={16} /></button>
                      <button className="facturacion-action-btn download" title="Descargar PDF" onClick={() => generarPDF(f)}><Download size={16} /></button>
                      <button className="facturacion-action-btn delete" title="Eliminar" onClick={() => openConfirmModal(f)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL NUEVA FACTURA */}
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
              <button className="facturacion-close-btn" onClick={closeModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="facturacion-form-row">
                <div className="facturacion-form-group">
                  <label>Dueño</label>
                  <select 
                    value={formData.cliente} 
                    onChange={(e) => setFormData({ ...formData, cliente: e.target.value, mascota: '' })} 
                    required
                  >
                    <option value="">Seleccionar dueño</option>
                    {clientes.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                  </select>
                </div>
                <div className="facturacion-form-group">
                  <label>Mascota</label>
                  <select 
                    value={formData.mascota} 
                    onChange={(e) => setFormData({ ...formData, mascota: e.target.value })} 
                    required 
                    disabled={!formData.cliente}
                  >
                    <option value="">Seleccionar mascota</option>
                    {mascotasDelCliente.map(m => <option key={m} value={m}>{m}</option>)}
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
                    onChange={(e) => setFormData({ ...formData, rtn: e.target.value })}
                  />
                </div>
                <div className="facturacion-form-group">
                  <label>Método de pago</label>
                  <select 
                    value={formData.metodoPago} 
                    onChange={(e) => setFormData({ ...formData, metodoPago: e.target.value })} 
                    required
                  >
                    <option value="">Seleccionar método</option>
                    {metodosPago.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="facturacion-form-section">
                <h3>Servicios</h3>
                <div className="facturacion-items-selector">
                  <select 
                    value="" 
                    onChange={(e) => {
                      if (e.target.value) { 
                        handleAddItem(servicios.find(s => s.id === parseInt(e.target.value)), 'servicios');
                      }
                    }}
                  >
                    <option value="">Seleccionar servicio</option>
                    {servicios.map(s => <option key={s.id} value={s.id}>{s.nombre} - L {s.precio.toFixed(2)}</option>)}
                  </select>
                </div>
                
                {formData.servicios.length > 0 && (
                  <div className="facturacion-items-list">
                    <h4>Servicios agregados</h4>
                    {formData.servicios.map(item => (
                      <div key={item.id} className="facturacion-item-card">
                        <div className="facturacion-item-info">
                          <div className="facturacion-item-name">{item.nombre}</div>
                          <div className="facturacion-item-price">L {item.precio.toFixed(2)} c/u</div>
                        </div>
                        <div className="facturacion-item-controls">
                          <div className="facturacion-quantity-control">
                            <button type="button" onClick={() => handleUpdateQuantity(item.id, 'servicios', -1)}><MinusCircle size={16} /></button>
                            <span>{item.cantidad}</span>
                            <button type="button" onClick={() => handleUpdateQuantity(item.id, 'servicios', 1)}><PlusCircle size={16} /></button>
                          </div>
                          <div className="facturacion-item-total">L {(item.precio * item.cantidad).toFixed(2)}</div>
                          <button type="button" className="facturacion-remove-item-btn" onClick={() => handleRemoveItem(item.id, 'servicios')}><Trash2 size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="facturacion-form-section">
                <h3>Productos</h3>
                <div className="facturacion-items-selector">
                  <select 
                    onChange={(e) => e.target.value && handleAddItem(productos.find(p => p.id === parseInt(e.target.value)), 'productos')}
                  >
                    <option value="">Seleccionar producto</option>
                    {productos.map(p => <option key={p.id} value={p.id}>{p.nombre} - L {p.precio.toFixed(2)}</option>)}
                  </select>
                </div>
                
                {formData.productos.length > 0 && (
                  <div className="facturacion-items-list">
                    <h4>Productos agregados</h4>
                    {formData.productos.map(item => (
                      <div key={item.id} className="facturacion-item-card">
                        <div className="facturacion-item-info">
                          <div className="facturacion-item-name">{item.nombre}</div>
                          <div className="facturacion-item-price">L {item.precio.toFixed(2)} c/u</div>
                        </div>
                        <div className="facturacion-item-controls">
                          <div className="facturacion-quantity-control">
                            <button type="button" onClick={() => handleUpdateQuantity(item.id, 'productos', -1)}><MinusCircle size={16} /></button>
                            <span>{item.cantidad}</span>
                            <button type="button" onClick={() => handleUpdateQuantity(item.id, 'productos', 1)}><PlusCircle size={16} /></button>
                          </div>
                          <div className="facturacion-item-total">L {(item.precio * item.cantidad).toFixed(2)}</div>
                          <button type="button" className="facturacion-remove-item-btn" onClick={() => handleRemoveItem(item.id, 'productos')}><Trash2 size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="facturacion-form-totals">
                <div className="facturacion-total-row"><span>Subtotal:</span><span>L {formData.subtotal.toFixed(2)}</span></div>
                <div className="facturacion-total-row"><span>ISV (15%):</span><span>L {formData.impuesto.toFixed(2)}</span></div>
                <div className="facturacion-total-row facturacion-grand-total"><span>Total:</span><span>L {formData.total.toFixed(2)}</span></div>
              </div>
              
              <div className="facturacion-modal-actions">
                <button type="button" className="facturacion-btn-secondary" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="facturacion-btn-primary">Generar Factura</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL VISTA PREVIA DE FACTURA */}
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
                <button className="facturacion-btn-secondary" onClick={() => generarPDF()}><Printer size={16} /> Imprimir</button>
                <button className="facturacion-close-btn" onClick={closeDetalleModal}><X size={20} /></button>
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
                  <p><strong>Número:</strong> {facturaSeleccionada.numero}</p>
                  <p><strong>Fecha:</strong> {facturaSeleccionada.fecha}</p>
                  <p><strong>Estado:</strong> <span className={`facturacion-estado-badge ${facturaSeleccionada.estado.toLowerCase()}`}>{facturaSeleccionada.estado}</span></p>
                </div>
              </div>
              
              <div className="facturacion-factura-cliente">
                <div className="facturacion-cliente-info">
                  <h4>Datos del Cliente</h4>
                  <p><strong>Nombre:</strong> {facturaSeleccionada.cliente}</p>
                  <p><strong>Mascota:</strong> {facturaSeleccionada.mascota}</p>
                  <p><strong>RTN:</strong> {facturaSeleccionada.rtn || 'No especificado'}</p>
                </div>
                
                <div className="facturacion-pago-info">
                  <h4>Información de Pago</h4>
                  <p><strong>Método de pago:</strong> {facturaSeleccionada.metodoPago}</p>
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
                    {facturaSeleccionada.servicios.map((servicio, index) => (
                      <tr key={`s-${index}`}>
                        <td>{servicio.nombre}</td>
                        <td>{servicio.cantidad}</td>
                        <td>L. {servicio.precio.toFixed(2)}</td>
                        <td>L. {(servicio.precio * servicio.cantidad).toFixed(2)}</td>
                      </tr>
                    ))}
                    {facturaSeleccionada.productos.map((producto, index) => (
                      <tr key={`p-${index}`}>
                        <td>{producto.nombre}</td>
                        <td>{producto.cantidad}</td>
                        <td>L. {producto.precio.toFixed(2)}</td>
                        <td>L. {(producto.precio * producto.cantidad).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <div className="facturacion-factura-totales">
                  <div className="facturacion-total-row">
                    <span>Subtotal:</span>
                    <span>L. {facturaSeleccionada.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="facturacion-total-row">
                    <span>ISV (15%):</span>
                    <span>L. {facturaSeleccionada.impuesto.toFixed(2)}</span>
                  </div>
                  <div className="facturacion-total-row facturacion-total-final">
                    <span>Total:</span>
                    <span>L. {facturaSeleccionada.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="facturacion-factura-footer">
                <p>¡Gracias por confiar en PetPlaza!</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {showConfirmModal && (
        <div 
          className={`facturacion-modal-overlay ${closingConfirmModal ? "closing" : "active"}`}
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.target.classList.contains("facturacion-modal-overlay") && closeConfirmModal()}
        >
          <div className={`facturacion-modal facturacion-confirm-modal ${closingConfirmModal ? "closing" : "active"}`}>
            <div className="facturacion-modal-header">
              <h2><AlertCircle size={24} /> Confirmar Eliminación</h2>
              <button className="facturacion-close-btn" onClick={closeConfirmModal}><X size={20} /></button>
            </div>
            <div className="facturacion-confirm-content">
              <p>¿Estás seguro de eliminar la factura <strong>{facturaAEliminar?.numero}</strong> de <strong>{facturaAEliminar?.cliente}</strong>?</p>
              <div className="facturacion-confirm-actions">
                <button className="facturacion-btn-secondary" onClick={closeConfirmModal}>
                  <XCircle size={16} /> Cancelar
                </button>
                <button className="facturacion-btn-danger" onClick={handleDelete}>
                  <Check size={16} /> Sí, eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICACIÓN */}
      {showNotification && (
        <div className="facturacion-notification-success show">
          <Check size={18} /> {notificationMessage}
        </div>
      )}
    </div>
  );
};

export default Facturacion;
