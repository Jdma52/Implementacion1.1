import React, { useState } from "react";
import { Users, PawPrint, Calendar, AlertTriangle, User, Package } from "lucide-react";
import "../CSS/Dashboard.css";

const Dashboard = () => {
  const [stats] = useState({
    owners: 25,
    pets: 42,
    appointments: 18,
    lowStock: 6,
  });

  const [recentAppointments] = useState([
    { id: 1, ownerName: "Carlos Pérez", date: "2025-09-02", time: "10:00 AM" },
    { id: 2, ownerName: "Ana López", date: "2025-09-01", time: "3:00 PM" },
    { id: 3, ownerName: "José Martínez", date: "2025-08-30", time: "11:30 AM" },
  ]);

  const [lowStockItems] = useState([
    { id: 1, name: "Vacuna Antirrábica", quantity: 3 },
    { id: 2, name: "Alimento Premium", quantity: 5 },
    { id: 3, name: "Desparasitante", quantity: 2 },
  ]);

  return (
    <div className="dashboard-module">
      {/* Encabezado */}
      <div className="dashboard-header fade-in">
        <h1>Bienvenido, Administrador PetPlaza</h1>
        <p>Resumen del sistema de gestión veterinaria</p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="stats-grid">
        <div className="stats-card card-hover fade-in">
          <div>
            <p className="stats-number">{stats.owners}</p>
            <p className="stats-label">Dueños Registrados</p>
          </div>
          <div className="icon bg-blue">
            <Users className="icon-inner" style={{ width: 18, height: 18 }} />
          </div>
        </div>

        <div className="stats-card card-hover fade-in">
          <div>
            <p className="stats-number">{stats.pets}</p>
            <p className="stats-label">Mascotas Registradas</p>
          </div>
          <div className="icon bg-green">
            <PawPrint className="icon-inner" style={{ width: 18, height: 18 }} />
          </div>
        </div>

        <div className="stats-card card-hover fade-in">
          <div>
            <p className="stats-number">{stats.appointments}</p>
            <p className="stats-label">Citas Programadas</p>
          </div>
          <div className="icon bg-purple">
            <Calendar className="icon-inner" style={{ width: 18, height: 18 }} />
          </div>
        </div>

        <div className="stats-card card-hover fade-in">
          <div>
            <p className="stats-number">{stats.lowStock}</p>
            <p className="stats-label">Stock Bajo</p>
          </div>
          <div className="icon bg-red">
            <AlertTriangle className="icon-inner" style={{ width: 18, height: 18 }} />
          </div>
        </div>
      </div>

      {/* Listas una al lado de la otra */}
      <div className="lists-grid fade-in">
        <div className="card card-hover">
          <h2>Citas Recientes</h2>
          <ul>
            {recentAppointments.map((appointment) => (
              <li key={appointment.id} className="list-item list-hover">
                <User className="list-icon bg-blue" style={{ width: 16, height: 16 }} />
                <div>
                  <p className="font-medium">{appointment.ownerName}</p>
                  <p className="text-sm">{appointment.date} a las {appointment.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="card card-hover">
          <h2>Artículos con Stock Bajo</h2>
          <ul>
            {lowStockItems.map((item) => (
              <li key={item.id} className="list-item list-hover">
                <Package className="list-icon bg-red" style={{ width: 16, height: 16 }} />
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-red">{`Stock: ${item.quantity}`}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;