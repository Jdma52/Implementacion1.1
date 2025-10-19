// src/components/Reports.js
import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "../CSS/Reports.css";

// Asegúrate de que estas rutas de assets sean correctas en tu proyecto
// Logo
import petplazaLogo from "../assets/LogoReports.jpeg";

/* === ICONOS PNG === */
import ExportarPDFIcon from "../assets/icons/Exportarpdf.png";
import ExportarXLSXIcon from "../assets/icons/Exportarxlsx.png";
import LempiraIcon from "../assets/icons/lempira.png";
import FacturaIcon from "../assets/icons/factura.png";
import PrecioMedioIcon from "../assets/icons/precio-de-venta-medio.png";
import VentaProductosIcon from "../assets/icons/venta-de-productos.png";

/**
 * Componente de React para la vista de Informes.
 * Permite visualizar estadísticas y exportar reportes a Excel y PDF.
 * Requiere que el usuario tenga el rol de "admin".
 *
 * @param {Object} props - Las props del componente.
 * @param {Object} props.user - Objeto de usuario, debe tener un campo `role`.
 */
const Reports = ({ user }) => {
  // Estado para los datos de los reportes (datos de ejemplo/mock)
  const [reportData] = useState({
    sales: { total_sales: 0, total_invoices: 0, average_sale: 0 },
    inventory: [
      { category: "Medicamento", total: 12064.5, products: 305 },
      { category: "Vacuna", total: 1350.0, products: 30 },
      { category: "Material", total: 398.0, products: 199 },
    ],
    lowStock: [{ name: "Acetaminofén", quantity: 15 }],
  });

  // Estado para el rango de fechas seleccionado
  const [dateRange, setDateRange] = useState({
    start: "2025-07-24", // Fecha de inicio de ejemplo
    end: "2025-08-23", // Fecha de fin de ejemplo
  });

  // Estado para controlar la tarjeta de estadísticas seleccionada (para el modal de detalle)
  const [selectedCard, setSelectedCard] = useState(null);
  // Estado para animar el cierre del modal
  const [closing, setClosing] = useState(false);

  // Función de datos simulados para ventas recientes
  const getRecentSales = () => [
    { date: "Hace 17 días", sales: 1508 },
    { date: "Hace 18 días", sales: 1911 },
    { date: "Hace 19 días", sales: 3257 },
    { date: "Hace 20 días", sales: 8052 },
    { date: "Hace 21 días", sales: 2205 },
    { date: "Hace 22 días", sales: 4321 },
    { date: "Hace 23 días", sales: 5597 },
  ];

  /* ======= Pre-carga del logo como DataURL para PDF ======= */
  const [logoDataURL, setLogoDataURL] = useState(null);
  useEffect(() => {
    // Convierte el asset de imagen a DataURL para que jspdf pueda usarlo
    const img = new Image();
    img.crossOrigin = "Anonymous"; // Necesario para evitar problemas de CORS si la imagen viene de otro dominio, aunque en assets locales no debería ser un problema.
    img.src = petplazaLogo;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      setLogoDataURL(canvas.toDataURL("image/jpeg")); // O "image/png" si el logo es PNG
    };
    img.onerror = (err) => {
        console.error("Error al cargar el logo:", err);
        setLogoDataURL(null); // Asegura que no se intente usar un logo fallido
    };
  }, []);

  // Función para exportar datos a Excel
  const exportToExcel = (data, fileName, sheetName) => {
    // Mapeo simple de datos, asume que 'data' es un array de objetos
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };

  // Función para exportar datos a PDF
  const exportToPDF = (data, fileName, columns) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(fileName, 14, 15);

    const LOGO_MAX_W_MM = 42; // Ancho máximo del logo en mm
    const LOGO_WIDTH_FRACTION = 0.3; // Ancho del logo como fracción del ancho de la página

    let startY = 25; // Posición de inicio de la tabla
    let logoLayout = null;

    // Lógica para añadir el logo en la esquina superior derecha
    if (logoDataURL) {
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Obtener propiedades de la imagen (solo funciona después de que el useEffect la cargue)
      // Se añade un try-catch para manejar el caso de error o si no se ha cargado.
      let props;
      try {
          props = doc.getImageProperties(logoDataURL);
      } catch (e) {
          console.error("No se pudieron obtener las propiedades del logo. ¿Está el logo cargado correctamente?", e);
          props = { width: 1, height: 1 }; // Fallback para evitar errores
      }
      
      const aspect = props.height / props.width;

      const targetWmm = Math.min(LOGO_MAX_W_MM, pageWidth * LOGO_WIDTH_FRACTION);
      const targetHmm = targetWmm * aspect;

      const marginTop = 8;
      const marginRight = 10;

      logoLayout = { pageWidth, logoW: targetWmm, logoH: targetHmm, marginTop, marginRight };
      // Ajusta la posición inicial de la tabla para que no se superponga con el logo
      startY = Math.max(startY, marginTop + targetHmm + 12);
    }

    // Formatear los valores numéricos (asume que los valores a formatear son números en la segunda columna de las filas de datos)
    const formattedData = data.map((row) =>
      row.map((value, index) => {
        // Asume que los totales y valores monetarios son los que necesitan formato.
        // Se aplica si es el último elemento y es un número, o si la columna es de tipo moneda
        // En este mock se asume que los números en las columnas son valores L.
        if (typeof value === "number") {
          return new Intl.NumberFormat("es-HN", {
            style: "currency",
            currency: "HNL", // Moneda de Honduras: Lempira
          }).format(value);
        }
        return value;
      })
    );

    // Generar la tabla con jspdf-autotable
    autoTable(doc, {
      startY,
      head: [columns],
      body: formattedData,
      styles: {
          fontSize: 10,
          cellPadding: 3
      },
      headStyles: {
          fillColor: [20, 40, 60] // Color de fondo del encabezado de la tabla (ej. azul oscuro)
      }
    });

    // Añadir el logo a todas las páginas después de generar la tabla
    if (logoLayout && logoDataURL) {
      const { pageWidth, logoW, logoH, marginTop, marginRight } = logoLayout;
      const x = pageWidth - logoW - marginRight;
      const y = marginTop;
      const total = doc.getNumberOfPages();
      for (let i = 1; i <= total; i++) {
        doc.setPage(i);
        doc.addImage(logoDataURL, "JPEG", x, y, logoW, logoH);
      }
    }

    doc.save(`${fileName}.pdf`);
  };

  // Validación de permisos
  if (!user || user.role !== "admin") {
    return (
      <div className="reports-no-permissions">
        No tienes permisos para ver los reportes.
      </div>
    );
  }

  // Cómputos derivados de los datos simulados
  const salesData = getRecentSales();
  const maxSales = Math.max(...salesData.map((s) => s.sales));

  const computedTotalSales = salesData.reduce((acc, s) => acc + s.sales, 0);
  const computedAverageSale =
    salesData.length > 0 ? computedTotalSales / salesData.length : 0;

  // Usa datos simulados o los computados si los simulados están en 0
  const displayTotalSales =
    reportData.sales.total_sales > 0
      ? reportData.sales.total_sales
      : computedTotalSales;

  const displayAverageSale =
    reportData.sales.average_sale > 0
      ? reportData.sales.average_sale
      : computedAverageSale;

  const displayTotalInvoices =
    reportData.sales.total_invoices > 0
      ? reportData.sales.total_invoices
      : salesData.length;

  // Manejo del cierre suave del modal
  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setSelectedCard(null);
      setClosing(false);
    }, 400); // El tiempo debe coincidir con la duración de la animación CSS de cierre
  };

  // Función de utilidad para formatear números con separadores de miles
  const formatNumber = (num) => new Intl.NumberFormat("es-HN").format(Number(num));

  // Función para determinar si la tarjeta seleccionada es de stock
  const isStockCard = (value) =>
    value === "stock" || value === "agotados" || value === "lowStock";

  // Renderizado del componente
  return (
    <div className="reports-container">
      {/* Header */}
      <div className="reports-header">
        <h1>Informes</h1>
        <div className="reports-date-picker">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) =>
              setDateRange({ ...dateRange, start: e.target.value })
            }
          />
          <span>-</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) =>
              setDateRange({ ...dateRange, end: e.target.value })
            }
          />
        </div>
      </div>

      {/* Tarjetas estadísticas */}
      <div className="reports-stats-grid">
        {/* Ventas Totales */}
        <div
          className={`reports-stats-card ventas ${
            selectedCard === "ventas" ? "active" : ""
          }`}
          onClick={() => setSelectedCard("ventas")}
        >
          <div>
            <h3>L. {formatNumber(Number(displayTotalSales.toFixed(2)))}</h3>
            <p>Ventas Totales</p>
          </div>
          <div className="icon-wrapper">
            <img src={LempiraIcon} alt="Ventas Totales" />
          </div>
        </div>

        {/* Facturas Emitidas */}
        <div
          className={`reports-stats-card facturas ${
            selectedCard === "facturas" ? "active" : ""
          }`}
          onClick={() => setSelectedCard("facturas")}
        >
          <div>
            <h3>{formatNumber(displayTotalInvoices)}</h3>
            <p>Facturas Emitidas</p>
          </div>
          <div className="icon-wrapper">
            <img src={FacturaIcon} alt="Facturas Emitidas" />
          </div>
        </div>

        {/* Promedio por Venta */}
        <div
          className={`reports-stats-card promedio ${
            selectedCard === "promedio" ? "active" : ""
          }`}
          onClick={() => setSelectedCard("promedio")}
        >
          <div>
            <h3>L. {formatNumber(Number(displayAverageSale.toFixed(2)))}</h3>
            <p>Promedio por Venta</p>
          </div>
          <div className="icon-wrapper">
            <img src={PrecioMedioIcon} alt="Promedio por Venta" />
          </div>
        </div>

        {/* Productos con Stock Bajo */}
        <div
          className={`reports-stats-card agotados ${
            isStockCard(selectedCard) ? "active" : ""
          }`}
          onClick={() => setSelectedCard("stock")}
        >
          <div>
            <h3>{formatNumber(reportData.lowStock.length)}</h3>
            <p>Productos con Stock Bajo</p>
          </div>
          <div className="icon-wrapper">
            <img src={VentaProductosIcon} alt="Productos con Stock Bajo" />
          </div>
        </div>
      </div>

      {/* Panel inferior (Cards de detalle) */}
      <div className="reports-grid">
        {/* Ventas Diarias */}
        <div className="reports-card" onClick={() => setSelectedCard("ventas")}>
          <div className="reports-card-header">
            <h2>Ventas Diarias (Últimos 7 días)</h2>
            <div className="export-buttons">
              <button
                className="btn-modern excel"
                onClick={(e) => {
                  e.stopPropagation(); // Evita que se abra el modal
                  exportToExcel(salesData, "Ventas_Ultimos7Dias", "Ventas");
                }}
              >
                <img
                  src={ExportarXLSXIcon}
                  alt="Exportar Excel"
                  className="btn-icon"
                  style={{ width: 18, height: 18, objectFit: "contain", marginRight: 6, filter: "none" }}
                />
                Exportar Excel
              </button>
              <button
                className="btn-modern pdf"
                onClick={(e) => {
                  e.stopPropagation(); // Evita que se abra el modal
                  exportToPDF(
                    salesData.map((s) => [s.date, s.sales]),
                    "Reporte de Ventas",
                    ["Fecha", "Ventas (L.)"]
                  );
                }}
              >
                <img
                  src={ExportarPDFIcon}
                  alt="Exportar PDF"
                  className="btn-icon"
                  style={{ width: 18, height: 18, objectFit: "contain", marginRight: 6, filter: "none" }}
                />
                Exportar PDF
              </button>
            </div>
          </div>
          <div className="reports-sales-list">
            {salesData.map((day, i) => (
              <div key={i} className="reports-sales-item">
                <span>{day.date}</span>
                <div className="reports-bar-container">
                  <div
                    className="reports-bar"
                    style={{ width: `${(day.sales / maxSales) * 100}%` }}
                  />
                  <span className="reports-value">
                    L. {formatNumber(day.sales)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inventario por categoría */}
        <div
          className="reports-card"
          onClick={() => setSelectedCard("inventario")}
        >
          <div className="reports-card-header">
            <h2>Inventario por categoría</h2>
            <div className="export-buttons">
              <button
                className="btn-modern excel"
                onClick={(e) => {
                  e.stopPropagation();
                  exportToExcel(reportData.inventory, "Inventario", "Categorías");
                }}
              >
                <img
                  src={ExportarXLSXIcon}
                  alt="Exportar Excel"
                  className="btn-icon"
                  style={{ width: 18, height: 18, objectFit: "contain", marginRight: 6, filter: "none" }}
                />
                Exportar Excel
              </button>
              <button
                className="btn-modern pdf"
                onClick={(e) => {
                  e.stopPropagation();
                  exportToPDF(
                    reportData.inventory.map((i) => [i.category, i.products, i.total]),
                    "Reporte de Inventario",
                    ["Categoría", "Productos", "Total (L.)"]
                  );
                }}
              >
                <img
                  src={ExportarPDFIcon}
                  alt="Exportar PDF"
                  className="btn-icon"
                  style={{ width: 18, height: 18, objectFit: "contain", marginRight: 6, filter: "none" }}
                />
                Exportar PDF
              </button>
            </div>
          </div>
          <div className="reports-inventory-list">
            {reportData.inventory.map((item, i) => (
              <div key={i} className="reports-inventory-item">
                <span>
                  {item.category} ({item.products} productos)
                </span>
                <strong>L. {formatNumber(Number(item.total.toFixed(2)))}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Estado de Citas */}
        <div className="reports-card" onClick={() => setSelectedCard("citas")}>
          <div className="reports-card-header">
            <h2>Estado de Citas</h2>
            <div className="export-buttons export-buttons--citas">
              <button
                className="btn-modern excel"
                onClick={(e) => {
                  e.stopPropagation();
                  exportToExcel(
                    [
                      { estado: "Programada", cantidad: 3 },
                      { estado: "Completada", cantidad: 5 },
                      { estado: "Cancelada", cantidad: 2 },
                    ],
                    "EstadoCitas",
                    "Citas"
                  );
                }}
              >
                <img
                  src={ExportarXLSXIcon}
                  alt="Exportar Excel"
                  className="btn-icon"
                  style={{ width: 18, height: 18, objectFit: "contain", marginRight: 6, filter: "none" }}
                />
                Exportar Excel
              </button>
              <button
                className="btn-modern pdf"
                onClick={(e) => {
                  e.stopPropagation();
                  exportToPDF(
                    [
                        ["Programada", 3], 
                        ["Completada", 5], 
                        ["Cancelada", 2]
                    ], 
                    "Reporte de Citas", 
                    ["Estado", "Cantidad"]
                  );
                }}
              >
                <img
                  src={ExportarPDFIcon}
                  alt="Exportar PDF"
                  className="btn-icon"
                  style={{ width: 18, height: 18, objectFit: "contain", marginRight: 6, filter: "none" }}
                />
                Exportar PDF
              </button>
            </div>
          </div>
          <div className="reports-inventory-list">
            {[
                { estado: "Programada", cantidad: 3, clase: "programada" },
                { estado: "Completada", cantidad: 5, clase: "completada" },
                { estado: "Cancelada", cantidad: 2, clase: "cancelada" },
            ].map((item, i) => (
                <div key={i} className="reports-inventory-item">
                    <span className={`reports-tag ${item.clase}`}>{item.estado}</span>
                    <strong>{formatNumber(item.cantidad)}</strong>
                </div>
            ))}
          </div>
        </div>

        {/* Stock Bajo */}
        <div className="reports-card" onClick={() => setSelectedCard("stock")}>
          <div className="reports-card-header">
            <h2>Productos con Stock Bajo</h2>
            <div className="export-buttons">
              <button
                className="btn-modern excel"
                onClick={(e) => {
                  e.stopPropagation();
                  exportToExcel(reportData.lowStock, "StockBajo", "Productos");
                }}
              >
                <img
                  src={ExportarXLSXIcon}
                  alt="Exportar Excel"
                  className="btn-icon"
                  style={{ width: 18, height: 18, objectFit: "contain", marginRight: 6, filter: "none" }}
                />
                Exportar Excel
              </button>
              <button
                className="btn-modern pdf"
                onClick={(e) => {
                  e.stopPropagation();
                  exportToPDF(
                    reportData.lowStock.map((p) => [p.name, p.quantity]),
                    "Reporte Stock Bajo",
                    ["Producto", "Cantidad"]
                  );
                }}
              >
                <img
                  src={ExportarPDFIcon}
                  alt="Exportar PDF"
                  className="btn-icon"
                  style={{ width: 18, height: 18, objectFit: "contain", marginRight: 6, filter: "none" }}
                />
                Exportar PDF
              </button>
            </div>
          </div>
          <div className="reports-low-stock-list">
            {reportData.lowStock.map((prod, i) => (
              <div key={i} className="reports-low-stock-item">
                <span>{prod.name}</span>
                <strong>{formatNumber(prod.quantity)}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== MODAL ===== */}
      {selectedCard && (
        <div
          className={`modal-overlay ${closing ? "closing" : ""}`}
          onClick={handleClose}
        >
          <div className="modal-content smooth-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={handleClose}>
              <X size={20} />
            </button>

            {/* Contenido del Modal: Ventas */}
            {selectedCard === "ventas" && (
              <div className="reports-card">
                <h2>Detalle de Ventas</h2>
                <div className="export-buttons">
                  <button
                    className="btn-modern excel"
                    onClick={() => exportToExcel(salesData, "Ventas_Ultimos7Dias", "Ventas")}
                  >
                    <img
                      src={ExportarXLSXIcon}
                      alt="Exportar Excel"
                      className="btn-icon"
                      style={{ width: 18, height: 18, objectFit: "contain", marginRight: 6, filter: "none" }}
                    />
                    Exportar Excel
                  </button>
                  <button
                    className="btn-modern pdf"
                    onClick={() =>
                      exportToPDF(
                        salesData.map((s) => [s.date, s.sales]),
                        "Reporte de Ventas",
                        ["Fecha", "Ventas (L.)"]
                      )
                    }
                  >
                    <img
                      src={ExportarPDFIcon}
                      alt="Exportar PDF"
                      className="btn-icon"
                      style={{ width: 18, height: 18, objectFit: "contain", marginRight: 6, filter: "none" }}
                    />
                    Exportar PDF
                  </button>
                </div>
                <div className="reports-sales-list">
                  {salesData.map((day, i) => (
                    <div key={i} className="reports-sales-item">
                      <span>{day.date}</span>
                      <div className="reports-bar-container">
                        <div
                          className="reports-bar"
                          style={{
                            width: `${(day.sales / maxSales) * 100}%`,
                          }}
                        />
                        <span className="reports-value">
                          L. {formatNumber(day.sales)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contenido del Modal: Facturas */}
            {selectedCard === "facturas" && (
              <div className="reports-card">
                <h2>Detalle de Facturas Emitidas</h2>
                <div className="export-buttons">
                  <button
                    className="btn-modern excel"
                    onClick={() =>
                      exportToExcel(
                        [{ metrica: "Facturas Emitidas", valor: displayTotalInvoices }],
                        "Facturas_Emitidas",
                        "Facturas"
                      )
                    }
                  >
                    <img
                      src={ExportarXLSXIcon}
                      alt="Exportar Excel"
                      className="btn-icon"
                      style={{ width: 18, height: 18, objectFit: "contain", marginRight: 6, filter: "none" }}
                    />
                    Exportar Excel
                  </button>
                  <button
                    className="btn-modern pdf"
                    onClick={() =>
                      exportToPDF(
                        [["Facturas Emitidas", displayTotalInvoices]],
                        "Reporte de Facturas",
                        ["Métrica", "Valor"]
                      )
                    }
                  >
                    <img
                      src={ExportarPDFIcon}
                      alt="Exportar PDF"
                      className="btn-icon"
                      style={{ width: 18, height: 18, objectFit: "contain", marginRight: 6, filter: "none" }}
                    />
                    Exportar PDF
                  </button>
                </div>
                <p style={{ fontSize: "1.05rem", marginTop: 8 }}>
                  Total de facturas emitidas:{" "}
                  <strong>{formatNumber(displayTotalInvoices)}</strong>
                </p>
              </div>
            )}

            {/* Contenido del Modal: Promedio */}
            {selectedCard === "promedio" && (
              <div className="reports-card">
                <h2>Detalle del Promedio por Venta</h2>
                <div className="export-buttons">
                  <button
                    className="btn-modern excel"
                    onClick={() =>
                      exportToExcel(
                        [
                          {
                            metrica: "Promedio por Venta (L.)",
                            valor: Number(displayAverageSale.toFixed(2)),
                          },
                        ],
                        "Promedio_por_Venta",
                        "Ventas"
                      )
                    }
                  >
                    <img
                      src={ExportarXLSXIcon}
                      alt="Exportar Excel"
                      className="btn-icon"
                      style={{ width: 18, height: 18, objectFit: "contain", marginRight: 6, filter: "none" }}
                    />
                    Exportar Excel
                  </button>
                  <button
                    className="btn-modern pdf"
                    onClick={() =>
                      exportToPDF(
                        [["Promedio por Venta (L.)", Number(displayAverageSale.toFixed(2))]],
                        "Reporte Promedio por Venta",
                        ["Métrica", "Valor (L.)"]
                      )
                    }
                  >
                    <img
                      src={ExportarPDFIcon}
                      alt="Exportar PDF"
                      className="btn-icon"
                      style={{ width: 18, height: 18, objectFit: "contain", marginRight: 6, filter: "none" }}
                    />
                    Exportar PDF
                  </button>
                </div>
                <p style={{ fontSize: "1.05rem", marginTop: 8 }}>
                  Promedio actual:{" "}
                  <strong>L. {formatNumber(Number(displayAverageSale.toFixed(2)))}</strong>
                </p>
              </div>
            )}

            {/* Contenido del Modal: Inventario */}
            {selectedCard === "inventario" && (
              <div className="reports-card">
                <h2>Detalle de Inventario</h2>
                <div className="export-buttons">
                  <button
                    className="btn-modern excel"
                    onClick={() => exportToExcel(reportData.inventory, "Inventario", "Categorías")}
                  >
                    <img
                      src={ExportarXLSXIcon}
                      alt="Exportar Excel"
                      className="btn-icon"
                      style={{ width: 18, height: 18, objectFit: "contain", marginRight: 6, filter: "none" }}
                    />
                    Exportar Excel
                  </button>
                  <button
                    className="btn-modern pdf"
                    onClick={() =>
                      exportToPDF(
                        reportData.inventory.map((i) => [i.category, i.products, i.total]),
                        "Reporte de Inventario",
                        ["Categoría", "Productos", "Total (L.)"]
                      )
                    }
                  >
                    <img
                      src={ExportarPDFIcon}
                      alt="Exportar PDF"
                      className="btn-icon"
                      style={{ width: 18, height: 18, objectFit: "contain", marginRight: 6, filter: "none" }}
                    />
                    Exportar PDF
                  </button>
                </div>
                <div className="reports-inventory-list">
                  {reportData.inventory.map((item, i) => (
                    <div key={i} className="reports-inventory-item">
                      <span>
                        {item.category} ({item.products} productos)
                      </span>
                      <strong>
                        L. {formatNumber(Number(item.total.toFixed(2)))}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contenido del Modal: Stock Bajo (Se activa con 'stock' o 'agotados' de la tarjeta superior) */}
            {isStockCard(selectedCard) && (
              <div className="reports-card">
                <h2>Detalle de Stock Bajo</h2>
                <div className="export-buttons">
                  <button
                    className="btn-modern excel"
                    onClick={() => exportToExcel(reportData.lowStock, "StockBajo", "Productos")}
                  >
                    <img
                      src={ExportarXLSXIcon}
                      alt="Exportar Excel"
                      className="btn-icon"
                      style={{ width: 18, height: 18, objectFit: "contain", marginRight: 6, filter: "none" }}
                    />
                    Exportar Excel
                  </button>
                  <button
                    className="btn-modern pdf"
                    onClick={() =>
                      exportToPDF(
                        reportData.lowStock.map((p) => [p.name, p.quantity]),
                        "Reporte Stock Bajo",
                        ["Producto", "Cantidad"]
                      )
                    }
                  >
                    <img
                      src={ExportarPDFIcon}
                      alt="Exportar PDF"
                      className="btn-icon"
                      style={{ width: 18, height: 18, objectFit: "contain", marginRight: 6, filter: "none" }}
                    />
                    Exportar PDF
                  </button>
                </div>
                <div className="reports-low-stock-list">
                  {reportData.lowStock.map((prod, i) => (
                    <div key={i} className="reports-low-stock-item">
                      <span>{prod.name}</span>
                      <strong>{formatNumber(prod.quantity)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contenido del Modal: Citas */}
            {selectedCard === "citas" && (
                <div className="reports-card">
                    <h2>Detalle de Estado de Citas</h2>
                    <div className="export-buttons">
                        <button
                            className="btn-modern excel"
                            onClick={() =>
                                exportToExcel(
                                    [
                                        { estado: "Programada", cantidad: 3 },
                                        { estado: "Completada", cantidad: 5 },
                                        { estado: "Cancelada", cantidad: 2 },
                                    ],
                                    "Estado_Citas",
                                    "Citas"
                                )
                            }
                        >
                            <img
                                src={ExportarXLSXIcon}
                                alt="Exportar Excel"
                                className="btn-icon"
                                style={{ width: 18, height: 18, objectFit: "contain", marginRight: 6, filter: "none" }}
                            />
                            Exportar Excel
                        </button>

                        <button
                            className="btn-modern pdf"
                            onClick={() =>
                                exportToPDF(
                                    [
                                        ["Programada", 3],
                                        ["Completada", 5],
                                        ["Cancelada", 2],
                                    ],
                                    "Reporte de Citas",
                                    ["Estado", "Cantidad"]
                                )
                            }
                        >
                            <img
                                src={ExportarPDFIcon}
                                alt="Exportar PDF"
                                className="btn-icon"
                                style={{ width: 18, height: 18, objectFit: "contain", marginRight: 6, filter: "none" }}
                            />
                            Exportar PDF
                        </button>
                    </div>

                    <div className="reports-inventory-list">
                        {[
                            { estado: "Programada", cantidad: 3, clase: "programada" },
                            { estado: "Completada", cantidad: 5, clase: "completada" },
                            { estado: "Cancelada", cantidad: 2, clase: "cancelada" },
                        ].map((item, i) => (
                            <div key={i} className="reports-inventory-item">
                                <span className={`reports-tag ${item.clase}`}>{item.estado}</span>
                                <strong>{formatNumber(item.cantidad)}</strong>
                            </div>
                        ))}
                    </div>
                </div>
            )}


            {/* Fallback */}
            {selectedCard &&
              !(
                ["ventas", "facturas", "promedio", "inventario", "citas"].includes(selectedCard) ||
                isStockCard(selectedCard)
              ) && (
                <div className="reports-card">
                  <h2>Detalle</h2>
                  <p>No hay información disponible para esta tarjeta.</p>
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
