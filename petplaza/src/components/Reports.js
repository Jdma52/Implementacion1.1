import React, { useState, useEffect } from "react";
import {
  FileText,
  Package,
  TrendingDown,
  X,
  Wallet,
  FileSpreadsheet,
  FileDown,
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "../CSS/Reports.css";

/* Logo (guárdalo en src/assets/LogoReports.jpeg) */
import petplazaLogo from "../assets/LogoReports.jpeg";

const Reports = ({ user }) => {
  const [reportData] = useState({
    sales: { total_sales: 0, total_invoices: 0, average_sale: 0 },
    inventory: [
      { category: "Medicamento", total: 12064.5, products: 305 },
      { category: "Vacuna", total: 1350.0, products: 30 },
      { category: "Material", total: 398.0, products: 199 },
    ],
    lowStock: [{ name: "Acetaminofén", quantity: 15 }],
  });

  const [dateRange, setDateRange] = useState({
    start: "2025-07-24",
    end: "2025-08-23",
  });

  const [selectedCard, setSelectedCard] = useState(null);
  const [closing, setClosing] = useState(false);

  const getRecentSales = () => [
    { date: "Hace 17 días", sales: 1508 },
    { date: "Hace 18 días", sales: 1911 },
    { date: "Hace 19 días", sales: 3257 },
    { date: "Hace 20 días", sales: 8052 },
    { date: "Hace 21 días", sales: 2205 },
    { date: "Hace 22 días", sales: 4321 },
    { date: "Hace 23 días", sales: 5597 },
  ];

  /* ======= Pre-carga del logo como DataURL ======= */
  const [logoDataURL, setLogoDataURL] = useState(null);
  useEffect(() => {
    const img = new Image();
    img.src = petplazaLogo;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      setLogoDataURL(canvas.toDataURL("image/jpeg")); // usa "image/png" si tu archivo es PNG
    };
  }, []);

  // Excel (original)
  const exportToExcel = (data, fileName, sheetName) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };

  // PDF (logo proporcional, tabla más abajo y tamaño reducido)
  const exportToPDF = (data, fileName, columns) => {
    const doc = new jsPDF();
    doc.text(fileName, 14, 15);

    const LOGO_MAX_W_MM = 42;
    const LOGO_WIDTH_FRACTION = 0.30;

    let startY = 25;
    let logoLayout = null;

    if (logoDataURL) {
      const pageWidth = doc.internal.pageSize.getWidth();
      const props = doc.getImageProperties(logoDataURL);
      const aspect = props.height / props.width;

      const targetWmm = Math.min(LOGO_MAX_W_MM, pageWidth * LOGO_WIDTH_FRACTION);
      const targetHmm = targetWmm * aspect;

      const marginTop = 8;
      const marginRight = 10;

      logoLayout = { pageWidth, logoW: targetWmm, logoH: targetHmm, marginTop, marginRight };
      startY = Math.max(startY, marginTop + targetHmm + 12);
    }

    const formattedData = data.map((row) =>
      row.map((value) => {
        if (typeof value === "number") {
          return new Intl.NumberFormat("es-HN", {
            style: "currency",
            currency: "HNL",
          }).format(value);
        }
        return value;
      })
    );

    autoTable(doc, {
      startY,
      head: [columns],
      body: formattedData,
    });

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

  if (!user || user.role !== "admin") {
    return <div className="reports-no-permissions">No tienes permisos para ver los reportes.</div>;
  }

  const salesData = getRecentSales();
  const maxSales = Math.max(...salesData.map((s) => s.sales));

  // Cálculos de respaldo (no toco tus datos originales)
  const computedTotalSales = salesData.reduce((acc, s) => acc + s.sales, 0);
  const computedAverageSale = salesData.length > 0 ? computedTotalSales / salesData.length : 0;

  const displayTotalSales =
    reportData.sales.total_sales > 0 ? reportData.sales.total_sales : computedTotalSales;

  const displayAverageSale =
    reportData.sales.average_sale > 0 ? reportData.sales.average_sale : computedAverageSale;

  const displayTotalInvoices =
    reportData.sales.total_invoices > 0 ? reportData.sales.total_invoices : salesData.length;

  // Cierre suave
  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setSelectedCard(null);
      setClosing(false);
    }, 400);
  };

  const formatNumber = (num) => new Intl.NumberFormat("es-HN").format(Number(num));

  // Utilidad para saber si el modal debe mostrar “Stock Bajo”
  const isStockCard = (value) =>
    value === "stock" || value === "agotados" || value === "lowStock";

  return (
    <div className="reports-container">
      {/* Header */}
      <div className="reports-header">
        <h1>Informes</h1>
        <div className="reports-date-picker">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
          />
          <span>-</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
          />
        </div>
      </div>

      {/* Tarjetas estadísticas */}
      <div className="reports-stats-grid">
        <div
          className={`reports-stats-card ventas ${selectedCard === "ventas" ? "active" : ""}`}
          onClick={() => setSelectedCard("ventas")}
        >
          <div>
            <h3>L. {formatNumber(Number(displayTotalSales.toFixed(2)))}</h3>
            <p>Ventas Totales</p>
          </div>
          <Wallet className="icon" />
        </div>

        <div
          className={`reports-stats-card facturas ${selectedCard === "facturas" ? "active" : ""}`}
          onClick={() => setSelectedCard("facturas")}
        >
          <div>
            <h3>{formatNumber(displayTotalInvoices)}</h3>
            <p>Facturas Emitidas</p>
          </div>
          <FileText className="icon" />
        </div>

        <div
          className={`reports-stats-card promedio ${selectedCard === "promedio" ? "active" : ""}`}
          onClick={() => setSelectedCard("promedio")}
        >
          <div>
            <h3>L. {formatNumber(Number(displayAverageSale.toFixed(2)))}</h3>
            <p>Promedio por Venta</p>
          </div>
          <TrendingDown className="icon" />
        </div>

        <div
          className={`reports-stats-card agotados ${isStockCard(selectedCard) ? "active" : ""}`}
          onClick={() => setSelectedCard("stock")}
        >
          <div>
            <h3>{formatNumber(reportData.lowStock.length)}</h3>
            <p>Productos con Stock Bajo</p>
          </div>
          <Package className="icon" />
        </div>
      </div>

      {/* Panel inferior */}
      <div className="reports-grid">
        {/* Ventas */}
        <div className="reports-card" onClick={() => setSelectedCard("ventas")}>
          <div className="reports-card-header">
            <h2>Ventas Diarias (Últimos 7 días)</h2>
            <div className="export-buttons">
              <button
                className="btn-modern excel"
                onClick={(e) => {
                  e.stopPropagation();
                  exportToExcel(salesData, "Ventas_Ultimos7Dias", "Ventas");
                }}
              >
                <FileSpreadsheet size={18} />
                Exportar Excel
              </button>
              <button
                className="btn-modern pdf"
                onClick={(e) => {
                  e.stopPropagation();
                  exportToPDF(
                    salesData.map((s) => [s.date, s.sales]),
                    "Reporte de Ventas",
                    ["Fecha", "Ventas (L.)"]
                  );
                }}
              >
                <FileDown size={18} />
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
                  <span className="reports-value">L. {formatNumber(day.sales)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inventario */}
        <div className="reports-card" onClick={() => setSelectedCard("inventario")}>
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
                <FileSpreadsheet size={18} />
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
                <FileDown size={18} />
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

        {/* Citas (compacto) */}
        <div className="reports-card" onClick={() => setSelectedCard("citas")}>
          <div className="reports-card-header">
            <h2>Estado de Citas</h2>
            <div className="export-buttons export-buttons--citas">
              <button
                className="btn-modern excel"
                onClick={(e) => {
                  e.stopPropagation();
                  exportToExcel([{ estado: "Programada", cantidad: 3 }], "EstadoCitas", "Citas");
                }}
              >
                <FileSpreadsheet size={18} />
                Exportar Excel
              </button>
              <button
                className="btn-modern pdf"
                onClick={(e) => {
                  e.stopPropagation();
                  exportToPDF([["Programada", 3]], "Reporte de Citas", ["Estado", "Cantidad"]);
                }}
              >
                <FileDown size={18} />
                Exportar PDF
              </button>
            </div>
          </div>
          <p>
            <span className="reports-tag">Programada</span> {formatNumber(3)}
          </p>
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
                <FileSpreadsheet size={18} />
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
                <FileDown size={18} />
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
        <div className={`modal-overlay ${closing ? "closing" : ""}`} onClick={handleClose}>
          <div className="modal-content smooth-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={handleClose}>
              <X size={20} />
            </button>

            {selectedCard === "ventas" && (
              <div className="reports-card">
                <h2>Detalle de Ventas</h2>
                <div className="export-buttons">
                  <button
                    className="btn-modern excel"
                    onClick={() => exportToExcel(salesData, "Ventas_Ultimos7Dias", "Ventas")}
                  >
                    <FileSpreadsheet size={18} />
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
                    <FileDown size={18} />
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
                          style={{ width: `${(day.sales / maxSales) * 100}%` }}
                        />
                        <span className="reports-value">L. {formatNumber(day.sales)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                    <FileSpreadsheet size={18} />
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
                    <FileDown size={18} />
                    Exportar PDF
                  </button>
                </div>
                <p style={{ fontSize: "1.05rem", marginTop: 8 }}>
                  Total de facturas emitidas: <strong>{formatNumber(displayTotalInvoices)}</strong>
                </p>
              </div>
            )}

            {selectedCard === "promedio" && (
              <div className="reports-card">
                <h2>Detalle del Promedio por Venta</h2>
                <div className="export-buttons">
                  <button
                    className="btn-modern excel"
                    onClick={() =>
                      exportToExcel(
                        [{ metrica: "Promedio por Venta (L.)", valor: Number(displayAverageSale.toFixed(2)) }],
                        "Promedio_por_Venta",
                        "Ventas"
                      )
                    }
                  >
                    <FileSpreadsheet size={18} />
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
                    <FileDown size={18} />
                    Exportar PDF
                  </button>
                </div>
                <p style={{ fontSize: "1.05rem", marginTop: 8 }}>
                  Promedio actual:{" "}
                  <strong>L. {formatNumber(Number(displayAverageSale.toFixed(2)))}</strong>
                </p>
              </div>
            )}

            {selectedCard === "inventario" && (
              <div className="reports-card">
                <h2>Detalle de Inventario</h2>
                <div className="export-buttons">
                  <button
                    className="btn-modern excel"
                    onClick={() => exportToExcel(reportData.inventory, "Inventario", "Categorías")}
                  >
                    <FileSpreadsheet size={18} />
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
                    <FileDown size={18} />
                    Exportar PDF
                  </button>
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
            )}

            {/* === STOCK BAJO (robusto) === */}
            {isStockCard(selectedCard) && (
              <div className="reports-card">
                <h2>Detalle de Stock Bajo</h2>
                <div className="export-buttons">
                  <button
                    className="btn-modern excel"
                    onClick={() =>
                      exportToExcel(reportData.lowStock, "StockBajo", "Productos")
                    }
                  >
                    <FileSpreadsheet size={18} />
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
                    <FileDown size={18} />
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

            {/* Fallback visual si llega un valor inesperado */}
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
