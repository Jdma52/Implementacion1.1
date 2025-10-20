import React, { useState } from "react";
import { Bell, LogOut, X } from "lucide-react";
import "../CSS/Navbar.css";
import { useNavigate } from "react-router-dom";

// Importar íconos locales de roles
import EscudoIcon from "../assets/icons/escudo-de-seguridad.png";
import EstetoscopioIcon from "../assets/icons/estetoscopio.png";
import QuimicoIcon from "../assets/icons/quimico.png";
import InventarioIcon from "../assets/icons/inventario.png";
import RecepcionIcon from "../assets/icons/recepcionista.png";

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Roles con color e ícono
  const roles = [
    { value: "admin", label: "Administrador", color: "#ef44444d", icon: EscudoIcon },
    { value: "veterinario", label: "Doctor", color: "#227ed45b", icon: EstetoscopioIcon },
    { value: "laboratorio", label: "Laboratorio", color: "#8a5cf64f", icon: QuimicoIcon },
    { value: "farmacia", label: "Personal de Inventario", color: "#10b98165", icon: InventarioIcon },
    { value: "recepcion", label: "Recepción", color: "#f9741660", icon: RecepcionIcon },
  ];

  // Función para obtener info del rol actual
  const getRoleData = () => roles.find((r) => r.value === user?.role) || null;

  // Modal
  const openModal = () => {
    setShowModal(true);
    setIsClosing(false);
  };

  const closeModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowModal(false);
    }, 300);
  };

  const handleLogout = () => {
    if (typeof onLogout === "function") {
      onLogout();
    }
    navigate("/");
  };

  const roleData = getRoleData();

  return (
    <div className="navbar-wrapper">
      <header className="navbar">
        {/* Notificaciones */}
        <button className="navbar-icon">
          <Bell size={20} />
        </button>

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
                  setTimeout(() => {
                    handleLogout();
                  }, 300);
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
