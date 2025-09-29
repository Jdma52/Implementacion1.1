import React, { useState } from "react";
import { Bell, LogOut, X } from "lucide-react";
import "../CSS/Navbar.css";
import { useNavigate } from "react-router-dom";

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false); // Estado para mostrar modal
  const [isClosing, setIsClosing] = useState(false); // Estado para animación de cierre

  // Función para abrir el modal
  const openModal = () => {
    setShowModal(true);
    setIsClosing(false);
  };

  // Función para cerrar el modal con animación
  const closeModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowModal(false);
    }, 300); // Tiempo igual a la animación en CSS (0.3s)
  };

  // Función de logout real
  const handleLogout = () => {
    if (typeof onLogout === "function") {
      onLogout();
    }
    navigate("/"); // Redirige al login
  };

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
          <span className="navbar-role">{user?.role || "Sin rol"}</span>
        </div>

        {/* Avatar */}
        <div className="navbar-avatar">
          {user?.username ? user.username[0].toUpperCase() : "?"}
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
            onClick={(e) => e.stopPropagation()} // Evita cerrar modal al hacer click dentro
          >
            {/* Botón cerrar */}
            <button className="navbar-logout-modal-close" onClick={closeModal}>
              <X size={18} />
            </button>

            {/* Título */}
            <h3 className="navbar-logout-modal-title">¿Deseas cerrar sesión?</h3>

            {/* Acciones */}
            <div className="navbar-logout-modal-actions">
              <button
                className="btn-logout-confirm"
                onClick={() => {
                  closeModal();
                  setTimeout(() => {
                    handleLogout();
                  }, 300); // Espera el fade-out antes de salir
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