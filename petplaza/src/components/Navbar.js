import React, { useState, useEffect, useRef } from "react";
import { Bell, LogOut, X } from "lucide-react";
import "../CSS/Navbar.css";
import { useNavigate, useLocation } from "react-router-dom";
import { getAppointments } from "../apis/appointmentsApi";

// Iconos por rol
import EscudoIcon from "../assets/icons/escudo-de-seguridad.png";
import EstetoscopioIcon from "../assets/icons/estetoscopio.png";
import QuimicoIcon from "../assets/icons/quimico.png";
import InventarioIcon from "../assets/icons/inventario.png";
import RecepcionIcon from "../assets/icons/recepcionista.png";

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  const [showModal, setShowModal] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const [appointments, setAppointments] = useState([]);
  const [alertaCAI, setAlertaCAI] = useState(null);

  /* =====================================================
     ROLES
  ===================================================== */
  const roles = [
    { value: "admin", label: "Administrador", color: "#ef44444d", icon: EscudoIcon },
    { value: "veterinario", label: "Doctor", color: "#227ed45b", icon: EstetoscopioIcon },
    { value: "laboratorio", label: "Laboratorio", color: "#8a5cf64f", icon: QuimicoIcon },
    { value: "farmacia", label: "Inventario", color: "#10b98165", icon: InventarioIcon },
    { value: "recepcion", label: "Recepción", color: "#f9741660", icon: RecepcionIcon },
  ];
  const roleData = roles.find((r) => r.value === user?.role) || null;

  /* =====================================================
     FUNCIONES PARA CITAS Y CAI
  ===================================================== */
  const fetchAppointments = async () => {
    try {
      const data = await getAppointments();

      // 🔹 Solo mostrar citas programadas
      const programadas = data
        .filter((a) => a.estado?.toLowerCase() === "programada")
        .sort(
          (a, b) => new Date(`${a.fecha}T${a.hora}`) - new Date(`${b.fecha}T${b.hora}`)
        );

      setAppointments(programadas);
    } catch (err) {
      console.error("Error obteniendo citas:", err);
    }
  };

  const fetchCAIStatus = async () => {
    try {
      if (location.pathname === "/Facturacion") {
        const base =
          window.location.hostname === "localhost" ? "http://localhost:5000" : "";
        const res = await fetch(`${base}/api/facturas/loteActivo`);
        if (!res.ok) throw new Error("Error al obtener el estado del lote CAI");
        const data = await res.json();
        setAlertaCAI(data.alerta ? data : null);
      } else {
        setAlertaCAI(null);
      }
    } catch (err) {
      console.error("Error verificando CAI:", err);
    }
  };

  /* =====================================================
     REFRESCO INSTANTÁNEO
  ===================================================== */
  const triggerAppointmentRefresh = () => {
    fetchAppointments(); // Refresca inmediatamente en esta pestaña
    localStorage.setItem("appointmentInstant", Date.now()); // Notifica otras pestañas
  };

  /* =====================================================
     EFECTOS DE INICIALIZACIÓN
  ===================================================== */
  useEffect(() => {
    fetchAppointments();
    fetchCAIStatus();

    const interval = setInterval(fetchAppointments, 60000); // Refresca cada 60s
    return () => clearInterval(interval);
  }, [location.pathname]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "appointmentInstant") {
        fetchAppointments(); // 🔥 REFRESCA AL INSTANTE si cambió en otra pestaña
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  /* =====================================================
     CERRAR DROPDOWN AL HACER CLIC FUERA
  ===================================================== */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* =====================================================
     FUNCIONES GENERALES
  ===================================================== */
  const openModal = () => {
    setShowModal(true);
    setIsClosing(false);
  };

  const closeModal = () => {
    setIsClosing(true);
    setTimeout(() => setShowModal(false), 300);
  };

  const handleLogout = () => {
    if (onLogout) onLogout();
    navigate("/");
  };

  const formatDate = (fecha, hora) => {
    const date = new Date(`${fecha}T${hora}`);
    return date.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /* =====================================================
     COLOR DE CAMPANA SEGÚN ALERTAS
  ===================================================== */
  let bellColor = "";
  if (alertaCAI?.alerta === "expired") bellColor = "text-red-500";
  else if (alertaCAI?.alerta === "warning") bellColor = "text-yellow-500";
  else if (appointments.length > 0) bellColor = "text-green-500";

  /* =====================================================
     RENDER PRINCIPAL
  ===================================================== */
  return (
    <div className="navbar-wrapper">
      <header className="navbar">
        {/* 🔔 CAMPANA DE NOTIFICACIONES */}
        <div className="navbar-icon-wrapper" ref={dropdownRef}>
          <button
            className={`navbar-icon navbar-bell ${bellColor}`}
            onClick={() => setShowDropdown(!showDropdown)}
            title="Notificaciones"
          >
            <Bell size={20} />
            {(appointments.length > 0 || alertaCAI) && (
              <span className="alert-badge"></span>
            )}
          </button>

          {showDropdown && (
            <div className="notifications-dropdown">
              <h4>Centro de Notificaciones</h4>

              {/* 🔹 Sección Citas */}
              <div className="notif-section">
                <h5>🗓️ Próximas Citas</h5>
                {appointments.length === 0 ? (
                  <p className="notif-empty">No hay citas programadas.</p>
                ) : (
                  appointments.map((a) => (
                    <div key={a._id} className="notification-item fade-in">
                      <strong>{a.ownerId?.full_name || "Desconocido"}</strong> -{" "}
                      {a.petId?.nombre || "Mascota"}
                      <br />
                      {formatDate(a.fecha, a.hora)}
                    </div>
                  ))
                )}
              </div>

              {/* 🔹 Sección CAI */}
              {alertaCAI && (
                <div className="notif-section">
                  <h5>📄 Estado del Lote CAI</h5>
                  {alertaCAI.alerta === "expired" && (
                    <p className="text-red-500 font-semibold">⚠️ Lote vencido</p>
                  )}
                  {alertaCAI.alerta === "warning" && (
                    <p className="text-yellow-500 font-semibold">
                      ⚠️ Lote próximo a vencer
                    </p>
                  )}
                  {alertaCAI.alerta === "ok" && (
                    <p className="text-green-600 font-semibold">🟢 Lote activo</p>
                  )}
                  <p>
                    Restantes: <strong>{alertaCAI.restantes}</strong>
                  </p>
                  <p>
                    Días restantes: <strong>{alertaCAI.diasRestantes}</strong>
                  </p>
                  <p>CAI: {alertaCAI.cai}</p>
                  <p>
                    Rango: {alertaCAI.rangoDesde} → {alertaCAI.rangoHasta}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 👤 Usuario */}
        <div className="navbar-user">
          <p className="navbar-username">{user?.full_name || "Usuario"}</p>
          <span className="navbar-role">{roleData?.label || "Sin rol"}</span>
        </div>

        <div
          className="navbar-avatar"
          style={{ backgroundColor: roleData?.color || "#00b073" }}
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

        {/* 🔒 Logout */}
        <button className="navbar-icon" onClick={openModal} title="Cerrar sesión">
          <LogOut size={20} />
        </button>
      </header>

      {/* MODAL LOGOUT */}
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
