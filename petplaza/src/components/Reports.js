import React, { useState, useEffect } from 'react';
import { FileText, DollarSign, Package, TrendingDown } from 'lucide-react';
import "../CSS/Reports.css";

const Reports = ({ user }) => {
  const [reportData, setReportData] = useState({
    sales: { total_sales: 0, total_invoices: 0, average_sale: 0 },
    inventory: [
      { category: "Medicamento", total: 12064.50, products: 305 },
      { category: "Vacuna", total: 1350.00, products: 30 },
      { category: "Material", total: 398.00, products: 199 },
    ],
    lowStock: [{ name: "Producto A", quantity: 1 }],
  });

  const [dateRange, setDateRange] = useState({
    start: "2025-07-24",
    end: "2025-08-23"
  });

  const getRecentSales = () => {
    return [
      { date: "Hace 17 días", sales: 1508 },
      { date: "Hace 18 días", sales: 1911 },
      { date: "Hace 19 días", sales: 3257 },
      { date: "Hace 20 días", sales: 3052 },
      { date: "Hace 21 días", sales: 2205 },
      { date: "Hace 22 días", sales: 4321 },
      { date: "Hace 23 días", sales: 5597 },
    ];
  };

  if (!user || user.role !== 'admin') {
    return <div className="no-permissions">No tienes permisos para ver los reportes.</div>;
  }

  return (
    <div className="reports-container">
      {/* Título + Filtros */}
      <div className="header">
        <h1>Informes</h1>
        <div className="date-picker">
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

      {/* Cards estadísticas */}
      <div className="stats-grid">
        <div className="stats-card">
          <DollarSign className="icon" />
          <div>
            <h3>L. {reportData.sales.total_sales.toFixed(2)}</h3>
            <p>Ventas Totales</p>
          </div>
        </div>
        <div className="stats-card">
          <FileText className="icon" />
          <div>
            <h3>{reportData.sales.total_invoices}</h3>
            <p>Facturas Emitidas</p>
          </div>
        </div>
        <div className="stats-card">
          <TrendingDown className="icon" />
          <div>
            <h3>L. {reportData.sales.average_sale.toFixed(2)}</h3>
            <p>Promedio por Venta</p>
          </div>
        </div>
        <div className="stats-card">
          <Package className="icon" />
          <div>
            <h3>{reportData.lowStock.length}</h3>
            <p>Productos Agotándose</p>
          </div>
        </div>
      </div>

      {/* Panel inferior */}
      <div className="reports-grid">
        {/* Ventas diarias */}
        <div className="report-card">
          <div className="report-header">
            <h2>Ventas Diarias (Últimos 7 días)</h2>
            <button>Exportar</button>
          </div>
          <div className="sales-list">
            {getRecentSales().map((day, i) => (
              <div key={i} className="sales-item">
                <span>{day.date}</span>
                <div className="bar-container">
                  <div className="bar" style={{ width: `${day.sales / 60}%` }}></div>
                  <span className="value">L. {day.sales}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inventario */}
        <div className="report-card">
          <div className="report-header">
            <h2>Inventario por categoría</h2>
            <button>Exportar</button>
          </div>
          <div className="inventory-list">
            {reportData.inventory.map((item, i) => (
              <div key={i} className="inventory-item">
                <span>{item.category} ({item.products} productos)</span>
                <strong>L. {item.total.toFixed(2)}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;