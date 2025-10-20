import React, { useState, useEffect } from "react";
import "../CSS/Dashboard.css";

import duenoDeUnaMascota from "../assets/icons/dueno-de-una-mascota.png";
import huellasDeGarras from "../assets/icons/huellas-de-garras.png";
import veterinario from "../assets/icons/veterinario22.png";
import advertencia from "../assets/icons/advertencia.png";

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
  const [pulse, setPulse] = useState(false);
  const [userRole, setUserRole] = useState("");

  // 🔹 Recuperar el rol del usuario al cargar el dashboard
  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role) {
      setUserRole(role.charAt(0).toUpperCase() + role.slice(1));
    }
  }, []);

  // 🔹 Cargar datos del dashboard
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await fetch("http://localhost:5000/api/dashboard");
        const data = await res.json();

        if (!res.ok || !data.success)
          throw new Error(data.message || "Error obteniendo dashboard");

        setStats({
          owners: data.ownersCount,
          pets: data.petsCount,
          appointments: data.appointmentsCount,
          lowStock: data.lowStock,
        });

        setRecentAppointments(data.recentAppointments || []);
        setLowStockItems(data.lowStockItems || []);

        setPulse(true);
        setTimeout(() => setPulse(false), 1000);
      } catch (error) {
        console.error("Error cargando dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
    const interval = setInterval(fetchDashboard, 180000); // cada 3 minutos
    return () => clearInterval(interval);
  }, []);

  // 🔹 Spinner de carga
  const Spinner = () => <div className="spinner"></div>;

  // 🔹 Formatear fecha + hora local de Honduras (corrige desfase UTC)
  const formatLocalDateTime = (fecha, hora) => {
    try {
      if (!fecha) return "Sin fecha";
      const fullDate = hora
        ? `${fecha}T${hora}:00-06:00`
        : `${fecha}T00:00:00-06:00`;
      const date = new Date(fullDate);

      const dateStr = date.toLocaleDateString("es-HN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      const timeStr = date.toLocaleTimeString("es-HN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      return `${dateStr} — ${timeStr}`;
    } catch (error) {
      console.error("Error formateando fecha:", error);
      return "Formato inválido";
    }
  };

  return (
    <div className="dashboard-module">
      {/* Encabezado */}
      <div className="dashboard-header fade-in">
        <h1>
          Bienvenido, {userRole ? `${userRole} PetPlaza` : "Usuario PetPlaza"}
        </h1>
        <p>Resumen del sistema de gestión veterinaria</p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className={`stats-grid ${pulse ? "pulse" : ""}`}>
        {/* Dueños */}
        <div className="stats-card card-hover fade-in">
          <div>
            <p className="stats-number">{loading ? <Spinner /> : stats.owners}</p>
            <p className="stats-label">Dueños Registrados</p>
          </div>
          <div className="icon bg-blue">
            <img
              src={duenoDeUnaMascota}
              alt="Dueños"
              style={{ width: 32, height: 32 }}
            />
          </div>
        </div>

        {/* Mascotas */}
        <div className="stats-card card-hover fade-in">
          <div>
            <p className="stats-number">{loading ? <Spinner /> : stats.pets}</p>
            <p className="stats-label">Mascotas Registradas</p>
          </div>
          <div className="icon bg-green">
            <img
              src={huellasDeGarras}
              alt="Mascotas"
              style={{ width: 32, height: 32 }}
            />
          </div>
        </div>

        {/* Citas */}
        <div className="stats-card card-hover fade-in">
          <div>
            <p className="stats-number">
              {loading ? <Spinner /> : stats.appointments}
            </p>
            <p className="stats-label">Citas Programadas</p>
          </div>
          <div className="icon bg-purple">
            <img
              src={veterinario}
              alt="Citas"
              style={{ width: 32, height: 32 }}
            />
          </div>
        </div>

        {/* Stock bajo */}
        <div className="stats-card card-hover fade-in">
          <div>
            <p className="stats-number">
              {loading ? <Spinner /> : stats.lowStock}
            </p>
            <p className="stats-label">Stock Bajo</p>
          </div>
          <div className="icon bg-red">
            <img
              src={advertencia}
              alt="Stock Bajo"
              style={{ width: 32, height: 32 }}
            />
          </div>
        </div>
      </div>

      {/* Listas */}
      <div className="lists-grid fade-in">
        {/* Citas Recientes */}
        <div className="card card-hover">
          <h2>Citas Recientes</h2>
          <ul>
            {loading ? (
              <li className="list-spinner">
                <Spinner /> Cargando citas...
              </li>
            ) : recentAppointments.length > 0 ? (
              recentAppointments.slice(0, 3).map((appointment) => (
                <li key={appointment._id} className="list-item list-hover">
                  <img
                    src={veterinario}
                    alt="Cita"
                    className="list-icon"
                    style={{ width: 16, height: 16 }}
                  />
                  <div>
                    <p className="font-medium">
                      {appointment.ownerId?.full_name || "Dueño desconocido"}
                    </p>
                    <p className="text-sm">
                      {appointment.petId?.nombre || "Mascota desconocida"} —{" "}
                      {formatLocalDateTime(appointment.fecha, appointment.hora)}
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
              <li className="list-spinner">
                <Spinner /> Cargando productos...
              </li>
            ) : lowStockItems.length > 0 ? (
              lowStockItems.slice(0, 5).map((item) => (
                <li key={item._id} className="list-item list-hover">
                  <img
                    src={advertencia}
                    alt="Producto"
                    className="list-icon"
                    style={{ width: 16, height: 16 }}
                  />
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray">
                      Categoría: {item.category || "Sin categoría"}
                    </p>
                    <p className="text-sm text-red">
                      Stock actual: {item.quantity} / Mínimo: {item.minStock}
                    </p>
                    <p className="text-sm">
                      Precio: L. {item.price?.toFixed(2) || "0.00"}
                    </p>
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
