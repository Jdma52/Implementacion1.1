import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "../CSS/Sidebar.css";
import logo from "../assets/logo.jpeg";

// Importar tus íconos PNG
import DashboardIcon from "../assets/icons/DashboardIcon.png";
import PeopleIcon from "../assets/icons/PeopleIcon.png";
import PetsIcon from "../assets/icons/PetsIcon.png";
import EventIcon from "../assets/icons/EventIcon.png";
import MedicalIcon from "../assets/icons/MedicalIcon.png";
import InventoryIcon from "../assets/icons/InventoryIcon.png";
import InvoiceDollarIcon from "../assets/icons/InvoiceDollarIcon.png";
import ChartBarIcon from "../assets/icons/ChartBarIcon.png";
import UserTieIcon from "../assets/icons/UserTieIcon.png";

const Sidebar = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // Definimos los items del menú
  const menuItems = [
    { icon: DashboardIcon, label: "Dashboard", path: "/dashboard", anim: "bounce" },
    { icon: PeopleIcon, label: "Dueños", path: "/owners", anim: "pulse" },
    { icon: PetsIcon, label: "Mascotas", path: "/pets", anim: "spin" },
    { icon: EventIcon, label: "Citas", path: "/appointments", anim: "bounce" },
    { icon: MedicalIcon, label: "Expedientes", path: "/medical-records", anim: "pulse" },
    { icon: InventoryIcon, label: "Inventario", path: "/Inventory", anim: "spin" },
    { icon: InvoiceDollarIcon, label: "Facturación", path: "/Facturacion", anim: "bounce" },
    { icon: ChartBarIcon, label: "Reportes", path: "/reports", anim: "pulse" },
    { icon: UserTieIcon, label: "Usuarios", path: "/users", anim: "spin" },
  ];

  return (
    <div className="sidebar-wrapper">
      {/* Botón hamburguesa */}
      <button
        className="hamburger-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Abrir menú"
      >
        {isOpen ? "❌" : "☰"}
      </button>

      {/* Overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)}></div>}

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        {/* Logo como botón */}
        <div
          className="sidebar-header"
          onClick={() => navigate("/dashboard")}
          style={{ cursor: "pointer" }}
        >
          <div className="logo-container">
            <img src={logo} alt="PetPlaza Logo" className="sidebar-logo" />
            <div className="logo-text">
              <h2 className="sidebar-title">PetPlaza</h2>
              <p className="sidebar-subtitle">HOSPIVET</p>
            </div>
          </div>
        </div>

        {/* Menú */}
        <nav className="sidebar-menu">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-item ${isActive ? "active" : ""}`
              }
              onClick={() => setIsOpen(false)}
            >
              <img
                src={item.icon}
                alt={item.label}
                className={`sidebar-icon ${item.anim}`} // animación dinámica
              />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Usuario */}
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {user?.username && user.username.length > 0
              ? user.username[0].toUpperCase()
              : "?"}
          </div>
          <div>
            <p className="sidebar-user-name">{user?.full_name || "Usuario"}</p>
            <p className="sidebar-user-role">{user?.role || "Sin rol"}</p>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default Sidebar;