import React, { useState, useEffect, useRef } from "react";
import { Bell, LogOut, X } from "lucide-react";
import "../CSS/Navbar.css";
import { useNavigate } from "react-router-dom";

// Importar íconos locales de roles
import EscudoIcon from "../assets/icons/escudo-de-seguridad.png";
import EstetoscopioIcon from "../assets/icons/estetoscopio.png";
import QuimicoIcon from "../assets/icons/quimico.png";
import InventarioIcon from "../assets/icons/inventario.png";
import RecepcionIcon from "../assets/icons/recepcionista.png";

// Importar funciones de la API
import { getAppointments } from "../apis/appointmentsApi";

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Notificaciones
  const [appointments, setAppointments] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Roles con color e ícono
  const roles = [
    { value: "admin", label: "Administrador", color: "#ef44444d", icon: EscudoIcon },
    { value: "veterinario", label: "Doctor", color: "#227ed45b", icon: EstetoscopioIcon },
    { value: "laboratorio", label: "Laboratorio", color: "#8a5cf64f", icon: QuimicoIcon },
    { value: "farmacia", label: "Personal de Inventario", color: "#10b98165", icon: InventarioIcon },
    { value: "recepcion", label: "Recepción", color: "#f9741660", icon: RecepcionIcon },
  ];

  const getRoleData = () => roles.find((r) => r.value === user?.role) || null;
  const roleData = getRoleData();

  // Modal
  const openModal = () => {
    setShowModal(true);
    setIsClosing(false);
  };
  const closeModal = () => {
    setIsClosing(true);
    setTimeout(() => setShowModal(false), 300);
  };
  const handleLogout = () => {
    if (typeof onLogout === "function") onLogout();
    navigate("/");
  };

  // Traer citas próximas
  const fetchAppointments = async () => {
    try {
      const data = await getAppointments();
      const now = new Date();
      // Filtrar citas futuras desde hoy y ordenar por fecha/hora
      const upcoming = data
        .filter(a => {
          const fechaHora = new Date(`${a.fecha}T${a.hora}`);
          return fechaHora >= now;
        })
        .sort((a, b) => {
          const fechaA = new Date(`${a.fecha}T${a.hora}`);
          const fechaB = new Date(`${b.fecha}T${b.hora}`);
          return fechaA - fechaB;
        })
        .slice(0, 3); // mostrar solo 3 próximas
      setAppointments(upcoming);
    } catch (err) {
      console.error("Error obteniendo citas:", err);
    }
  };

  // Actualizar al abrir el dropdown
  const handleToggleDropdown = () => {
    setShowDropdown(!showDropdown);
    if (!showDropdown) fetchAppointments();
  };

  useEffect(() => {
    fetchAppointments();
    const interval = setInterval(fetchAppointments, 60000); // actualizar cada 1 min
    return () => clearInterval(interval);
  }, []);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Formatear fecha
  const formatDate = (fecha, hora) => {
    const date = new Date(`${fecha}T${hora}`);
    return date.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="navbar-wrapper">
      <header className="navbar">
        {/* Notificaciones */}
        <button
          className="navbar-icon"
          onClick={handleToggleDropdown}
        >
          <Bell size={20} />
          {appointments.length > 0 && <span className="alert-badge"></span>}
        </button>

        {showDropdown && (
          <div className="notifications-dropdown" ref={dropdownRef}>
            {appointments.length === 0 && (
              <div className="notification-item">No hay próximas citas</div>
            )}
            {appointments.map((a) => (
              <div key={a._id} className="notification-item">
                <strong>{a.ownerId?.full_name || "Desconocido"}</strong> - <strong>{a.petId?.nombre || "Desconocido"}</strong><br />
                {formatDate(a.fecha, a.hora)}
              </div>
            ))}
          </div>
        )}

        {/* Usuario */}
        <div className="navbar-user">
          <p className="navbar-username">{user?.full_name || "Usuario"}</p>
          <span className="navbar-role">{roleData?.label || "Sin rol"}</span>
        </div>

        {/* Avatar */}
        <div
          className="navbar-avatar"
          style={{ backgroundColor: roleData ? roleData.color : "#00b073" }}
        >
          {roleData?.icon ? (
            <img
              src={roleData.icon}
              alt={roleData.label}
              className="navbar-avatar-icon"
            />
          ) : (
            user?.username ? user.username[0].toUpperCase() : "?"
          )}
        </div>

        {/* Logout */}
        <button className="navbar-icon" onClick={openModal}>
          <LogOut size={20} />
        </button>
      </header>

      {/* ===== MODAL DE LOGOUT ===== */}
      {showModal && (
        <div
          className={`navbar-logout-modal-overlay ${isClosing ? "fade-out" : ""}`}
          onClick={closeModal}
        >
          <div
            className={`navbar-logout-modal-content ${isClosing ? "fade-out" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="navbar-logout-modal-close" onClick={closeModal}>
              <X size={18} />
            </button>
            <h3 className="navbar-logout-modal-title">¿Deseas cerrar sesión?</h3>
            <div className="navbar-logout-modal-actions">
              <button
                className="btn-logout-confirm"
                onClick={() => {
                  closeModal();
                  setTimeout(() => handleLogout(), 300);
                }}
              >
                Sí
              </button>
              <button className="btn-logout-cancel" onClick={closeModal}>
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
