import React, { useState } from "react";
import { FileText, DollarSign, Package, TrendingDown, Eye, X } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "../CSS/Reports.css";

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

  const getRecentSales = () => [
    { date: "Hace 17 días", sales: 1508 },
    { date: "Hace 18 días", sales: 1911 },
    { date: "Hace 19 días", sales: 3257 },
    { date: "Hace 20 días", sales: 8052 },
    { date: "Hace 21 días", sales: 2205 },
    { date: "Hace 22 días", sales: 4321 },
    { date: "Hace 23 días", sales: 5597 },
  ];

  // Excel
  const exportToExcel = (data, fileName, sheetName) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };

  // PDF
  const exportToPDF = (data, fileName, columns) => {
    const doc = new jsPDF();
    doc.text(fileName, 14, 15);

    autoTable(doc, {
      startY: 25,
      head: [columns],
      body: data,
    });

    doc.save(`${fileName}.pdf`);
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="reports-no-permissions">
        No tienes permisos para ver los reportes.
      </div>
    );
  }

  const salesData = getRecentSales();
  const maxSales = Math.max(...salesData.map((s) => s.sales));

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
        <div
          className={`reports-stats-card ventas ${selectedCard === "ventas" ? "active" : ""}`}
          onClick={() => setSelectedCard("ventas")}
        >
          <div>
            <h3>L. {reportData.sales.total_sales.toFixed(2)}</h3>
            <p>Ventas Totales</p>
          </div>
          <DollarSign className="icon" />
        </div>

        <div
          className={`reports-stats-card facturas ${selectedCard === "facturas" ? "active" : ""}`}
          onClick={() => setSelectedCard("facturas")}
        >
          <div>
            <h3>{reportData.sales.total_invoices}</h3>
            <p>Facturas Emitidas</p>
          </div>
          <FileText className="icon" />
        </div>

        <div
          className={`reports-stats-card promedio ${selectedCard === "promedio" ? "active" : ""}`}
          onClick={() => setSelectedCard("promedio")}
        >
          <div>
            <h3>L. {reportData.sales.average_sale.toFixed(2)}</h3>
            <p>Promedio por Venta</p>
          </div>
          <TrendingDown className="icon" />
        </div>

        <div
          className={`reports-stats-card agotados ${selectedCard === "stock" ? "active" : ""}`}
          onClick={() => setSelectedCard("stock")}
        >
          <div>
            <h3>{reportData.lowStock.length}</h3>
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
                className="btn-excel"
                onClick={(e) => {
                  e.stopPropagation();
                  exportToExcel(salesData, "Ventas_Ultimos7Dias", "Ventas");
                }}
              >
                📊 Excel
              </button>
              <button
                className="btn-pdf"
                onClick={(e) => {
                  e.stopPropagation();
                  exportToPDF(
                    salesData.map((s) => [s.date, s.sales]),
                    "Reporte de Ventas",
                    ["Fecha", "Ventas (L.)"]
                  );
                }}
              >
                📄 PDF
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
                  ></div>
                  <span className="reports-value">L. {day.sales}</span>
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
                className="btn-excel"
                onClick={(e) => {
                  e.stopPropagation();
                  exportToExcel(reportData.inventory, "Inventario", "Categorías");
                }}
              >
                📊 Excel
              </button>
              <button
                className="btn-pdf"
                onClick={(e) => {
                  e.stopPropagation();
                  exportToPDF(
                    reportData.inventory.map((i) => [i.category, i.products, i.total]),
                    "Reporte de Inventario",
                    ["Categoría", "Productos", "Total (L.)"]
                  );
                }}
              >
                📄 PDF
              </button>
            </div>
          </div>
          <div className="reports-inventory-list">
            {reportData.inventory.map((item, i) => (
              <div key={i} className="reports-inventory-item">
                <span>
                  {item.category} ({item.products} productos)
                </span>
                <strong>L. {item.total.toFixed(2)}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Estado de citas */}
        <div className="reports-card" onClick={() => setSelectedCard("citas")}>
          <div className="reports-card-header">
            <h2>Estado de Citas</h2>
            <div className="export-buttons">
              <button
                className="btn-excel"
                onClick={(e) => {
                  e.stopPropagation();
                  exportToExcel(
                    [{ estado: "Programada", cantidad: 3 }],
                    "EstadoCitas",
                    "Citas"
                  );
                }}
              >
                📊 Excel
              </button>
              <button
                className="btn-pdf"
                onClick={(e) => {
                  e.stopPropagation();
                  exportToPDF(
                    [["Programada", 3]],
                    "Reporte de Citas",
                    ["Estado", "Cantidad"]
                  );
                }}
              >
                📄 PDF
              </button>
            </div>
          </div>
          <p>
            <span className="reports-tag">Programada</span> 3
          </p>
        </div>

        {/* Stock bajo */}
        <div className="reports-card" onClick={() => setSelectedCard("stock")}>
          <div className="reports-card-header">
            <h2>Productos con Stock Bajo</h2>
            <div className="export-buttons">
              <button
                className="btn-excel"
                onClick={(e) => {
                  e.stopPropagation();
                  exportToExcel(reportData.lowStock, "StockBajo", "Productos");
                }}
              >
                📊 Excel
              </button>
              <button
                className="btn-pdf"
                onClick={(e) => {
                  e.stopPropagation();
                  exportToPDF(
                    reportData.lowStock.map((p) => [p.name, p.quantity]),
                    "Reporte Stock Bajo",
                    ["Producto", "Cantidad"]
                  );
                }}
              >
                📄 PDF
              </button>
            </div>
          </div>
          <div className="reports-low-stock-list">
            {reportData.lowStock.map((prod, i) => (
              <div key={i} className="reports-low-stock-item">
                <span>{prod.name}</span>
                <strong>{prod.quantity}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal con detalle + export */}
      {selectedCard && (
        <div className="modal-overlay" onClick={() => setSelectedCard(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedCard(null)}>
              <X size={20} />
            </button>

            {selectedCard === "ventas" && (
              <div className="reports-card">
                <h2>Detalle de Ventas</h2>
                <div className="export-buttons">
                  <button
                    className="btn-excel"
                    onClick={() => exportToExcel(salesData, "Ventas_Ultimos7Dias", "Ventas")}
                  >
                    📊 Excel
                  </button>
                  <button
                    className="btn-pdf"
                    onClick={() =>
                      exportToPDF(
                        salesData.map((s) => [s.date, s.sales]),
                        "Reporte de Ventas",
                        ["Fecha", "Ventas (L.)"]
                      )
                    }
                  >
                    📄 PDF
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
                        ></div>
                        <span className="reports-value">L. {day.sales}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedCard === "inventario" && (
              <div className="reports-card">
                <h2>Detalle de Inventario</h2>
                <div className="export-buttons">
                  <button
                    className="btn-excel"
                    onClick={() => exportToExcel(reportData.inventory, "Inventario", "Categorías")}
                  >
                    📊 Excel
                  </button>
                  <button
                    className="btn-pdf"
                    onClick={() =>
                      exportToPDF(
                        reportData.inventory.map((i) => [i.category, i.products, i.total]),
                        "Reporte de Inventario",
                        ["Categoría", "Productos", "Total (L.)"]
                      )
                    }
                  >
                    📄 PDF
                  </button>
                </div>
                <div className="reports-inventory-list">
                  {reportData.inventory.map((item, i) => (
                    <div key={i} className="reports-inventory-item">
                      <span>
                        {item.category} ({item.products} productos)
                      </span>
                      <strong>L. {item.total.toFixed(2)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedCard === "citas" && (
              <div className="reports-card">
                <h2>Detalle de Citas</h2>
                <div className="export-buttons">
                  <button
                    className="btn-excel"
                    onClick={() =>
                      exportToExcel([{ estado: "Programada", cantidad: 3 }], "EstadoCitas", "Citas")
                    }
                  >
                    📊 Excel
                  </button>
                  <button
                    className="btn-pdf"
                    onClick={() =>
                      exportToPDF([["Programada", 3]], "Reporte de Citas", ["Estado", "Cantidad"])
                    }
                  >
                    📄 PDF
                  </button>
                </div>
                <p>
                  <span className="reports-tag">Programada</span> 3
                </p>
              </div>
            )}

            {selectedCard === "stock" && (
              <div className="reports-card">
                <h2>Detalle de Stock Bajo</h2>
                <div className="export-buttons">
                  <button
                    className="btn-excel"
                    onClick={() => exportToExcel(reportData.lowStock, "StockBajo", "Productos")}
                  >
                    📊 Excel
                  </button>
                  <button
                    className="btn-pdf"
                    onClick={() =>
                      exportToPDF(
                        reportData.lowStock.map((p) => [p.name, p.quantity]),
                        "Reporte Stock Bajo",
                        ["Producto", "Cantidad"]
                      )
                    }
                  >
                    📄 PDF
                  </button>
                </div>
                <div className="reports-low-stock-list">
                  {reportData.lowStock.map((prod, i) => (
                    <div key={i} className="reports-low-stock-item">
                      <span>{prod.name}</span>
                      <strong>{prod.quantity}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
