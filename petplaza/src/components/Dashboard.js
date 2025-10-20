import React, { useState, useEffect } from "react";
import { Users, PawPrint, Calendar, AlertTriangle, User, Package } from "lucide-react";
import "../CSS/Dashboard.css";

const Dashboard = () => {
  const [stats, setStats] = useState({
    owners: 0,
    pets: 0,
    appointments: 0,
    lowStock: 0,
  });

  const [recentAppointments, setRecentAppointments] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await fetch("http://localhost:5000/api/dashboard");
        const data = await res.json();

        if (!res.ok || !data.success) throw new Error(data.message || "Error obteniendo dashboard");

        setStats({
          owners: data.ownersCount,
          pets: data.petsCount,
          appointments: data.appointmentsCount,
          lowStock: data.lowStock,
        });

        setRecentAppointments(data.recentAppointments || []);
        setLowStockItems(data.lowStockItems || []);
      } catch (error) {
        console.error("Error cargando dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
    const interval = setInterval(fetchDashboard, 5000);
    return () => clearInterval(interval);
  }, []);

  const Spinner = () => <div className="spinner"></div>;

  return (
    <div className="dashboard-module">
      {/* Encabezado */}
      <div className="dashboard-header fade-in">
        <h1>Bienvenido, Administrador PetPlaza</h1>
        <p>Resumen del sistema de gestión veterinaria</p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="stats-grid">
        {[
          { label: "Dueños Registrados", value: stats.owners, icon: <Users className="icon-inner" />, color: "bg-blue" },
          { label: "Mascotas Registradas", value: stats.pets, icon: <PawPrint className="icon-inner" />, color: "bg-green" },
          { label: "Citas Programadas", value: stats.appointments, icon: <Calendar className="icon-inner" />, color: "bg-purple" },
          { label: "Stock Bajo", value: stats.lowStock, icon: <AlertTriangle className="icon-inner" />, color: "bg-red" },
        ].map((card, i) => (
          <div key={i} className="stats-card card-hover fade-in">
            <div>
              <p className="stats-number">{loading ? <Spinner /> : card.value}</p>
              <p className="stats-label">{card.label}</p>
            </div>
            <div className={`icon ${card.color}`}>{card.icon}</div>
          </div>
        ))}
      </div>

      {/* Listas */}
      <div className="lists-grid fade-in">
        {/* Citas Recientes */}
        <div className="card card-hover">
          <h2>Citas Recientes</h2>
          <ul>
            {loading ? (
              <li className="list-spinner"><Spinner /> Cargando citas...</li>
            ) : recentAppointments.length > 0 ? (
              recentAppointments.slice(0, 3).map((appointment) => (
                <li key={appointment._id} className="list-item list-hover">
                  <User className="list-icon bg-blue" style={{ width: 16, height: 16 }} />
                  <div>
                    <p className="font-medium">
                      {appointment.ownerId?.full_name || "Dueño desconocido"}
                    </p>
                    <p className="text-sm">
                      {appointment.petId?.nombre || "Mascota desconocida"} —{" "}
                      {new Date(appointment.fecha).toLocaleDateString()}
                    </p>
                  </div>
                </li>
              ))
            ) : (
              <li>No hay citas recientes</li>
            )}
          </ul>
        </div>

        {/* Stock Bajo */}
        <div className="card card-hover">
          <h2>Artículos con Stock Bajo</h2>
          <ul>
            {loading ? (
              <li className="list-spinner"><Spinner /> Cargando productos...</li>
            ) : lowStockItems.length > 0 ? (
              lowStockItems.slice(0, 3).map((item) => (
                <li key={item._id} className="list-item list-hover">
                  <Package className="list-icon bg-red" style={{ width: 16, height: 16 }} />
                  <div>
                    <p className="font-medium">{item.nombre}</p>
                    <p className="text-sm text-red">Stock: {item.cantidad}</p>
                  </div>
                </li>
              ))
            ) : (
              <li>No hay productos con stock bajo</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
