import React, { useState, useEffect, useRef } from "react";
import { Bell, LogOut, X } from "lucide-react";
import "../CSS/Navbar.css";
import { useNavigate } from "react-router-dom";
import EscudoIcon from "../assets/icons/escudo-de-seguridad.png";
import EstetoscopioIcon from "../assets/icons/estetoscopio.png";
import QuimicoIcon from "../assets/icons/quimico.png";
import InventarioIcon from "../assets/icons/inventario.png";
import RecepcionIcon from "../assets/icons/recepcionista.png";
import { getAppointments } from "../apis/appointmentsApi";

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // ⚡ Estados separados
  const [allAppointments, setAllAppointments] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const roles = [
    { value: "admin", label: "Administrador", color: "#ef44444d", icon: EscudoIcon },
    { value: "veterinario", label: "Doctor", color: "#227ed45b", icon: EstetoscopioIcon },
    { value: "laboratorio", label: "Laboratorio", color: "#8a5cf64f", icon: QuimicoIcon },
    { value: "farmacia", label: "Personal de Inventario", color: "#10b98165", icon: InventarioIcon },
    { value: "recepcion", label: "Recepción", color: "#f9741660", icon: RecepcionIcon },
  ];

  const roleData = roles.find(r => r.value === user?.role) || null;

  const openModal = () => { setShowModal(true); setIsClosing(false); };
  const closeModal = () => { setIsClosing(true); setTimeout(() => setShowModal(false), 300); };
  const handleLogout = () => { if (onLogout) onLogout(); navigate("/"); };

  // ⚡ Traer citas y actualizar solo las programadas y futuras
  const fetchAppointments = async () => {
    try {
      const data = await getAppointments();
      const now = new Date();

      setAllAppointments(data); // Guardamos todo por si se necesita para otras cosas

      const upcoming = data.filter(a => {
        const fechaHora = new Date(`${a.fecha}T${a.hora}`);
        return fechaHora >= now && a.estado === "programada";
      }).sort((a, b) => new Date(`${a.fecha}T${a.hora}`) - new Date(`${b.fecha}T${b.hora}`));

      setUpcomingAppointments(upcoming); // Solo las válidas para badge/lista
    } catch (err) {
      console.error("Error obteniendo citas:", err);
      setUpcomingAppointments([]);
    }
  };

  useEffect(() => {
    fetchAppointments();
    const interval = setInterval(fetchAppointments, 60000); // actualizar cada 1 min
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDate = (fecha, hora) => {
    const date = new Date(`${fecha}T${hora}`);
    return date.toLocaleString("es-ES", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  return (
    <div className="navbar-wrapper">
      <header className="navbar">
        <button className="navbar-icon" onClick={() => { setShowDropdown(!showDropdown); if (!showDropdown) fetchAppointments(); }}>
          <Bell size={20} />
          {/* 🔹 Badge solo si hay citas programadas */}
          {upcomingAppointments.length > 0 && <span className="alert-badge"></span>}
        </button>

        {showDropdown && (
          <div className="notifications-dropdown" ref={dropdownRef}>
            {upcomingAppointments.length > 0 ? upcomingAppointments.map(a => (
              <div key={a._id} className="notification-item">
                <strong>{a.ownerId?.full_name || "Desconocido"}</strong> - <strong>{a.petId?.nombre || "Desconocido"}</strong>
                <br /> {formatDate(a.fecha, a.hora)}
              </div>
            )) : (
              <div className="notification-item">No hay próximas citas</div>
            )}
          </div>
        )}
// ========== 🔔 Lógica de alerta CAI ==========
  useEffect(() => {
    const obtenerEstadoCAI = async () => {
      try {
        if (location.pathname === "/Facturacion") {
          const res = await fetch("http://localhost:5000/api/facturas/loteActivo");
          if (!res.ok) throw new Error("Error al obtener el estado del lote CAI");
          const data = await res.json();
          if (data.alerta) {
            setAlertaCAI(data);
          } else {
            setAlertaCAI(null);
          }
        } else {
          setAlertaCAI(null);
        }
      } catch (err) {
        console.error("Error verificando CAI:", err);
      }
    };
    obtenerEstadoCAI();
  }, [location.pathname]);

  // ========== Modal de cierre ==========
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

  return (
    <div className="navbar-wrapper">
      <header className="navbar">
        {/* ========= 🔔 ALERTA DE LOTE CAI ========= */}
        {location.pathname === "/Facturacion" && (
          <div className="navbar-alert-container">
            <button
              className={`navbar-icon navbar-bell ${
                alertaCAI?.alerta === "expired"
                  ? "text-red-500"
                  : alertaCAI?.alerta === "warning"
                  ? "text-yellow-500"
                  : "text-green-500"
              }`}
              onClick={() => setShowNotif(!showNotif)}
              title="Estado del Lote CAI"
            >
              <Bell size={20} />

              {/* 🔴 Dot de color según el estado */}
              {alertaCAI?.alerta === "expired" && (
                <span className="navbar-alert-dot bg-red-500"></span>
              )}
              {alertaCAI?.alerta === "warning" && (
                <span className="navbar-alert-dot bg-yellow-400"></span>
              )}
              {alertaCAI?.alerta === "ok" && (
                <span className="navbar-alert-dot bg-green-500"></span>
              )}
            </button>

            {/* 🔽 Dropdown con detalles del lote CAI */}
            {showNotif && alertaCAI && (
              <div className="navbar-alert-dropdown">
                <h4>Estado del Lote CAI</h4>
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
                  📄 Restantes: <strong>{alertaCAI.restantes}</strong>
                </p>
                <p>
                  ⏳ Días restantes: <strong>{alertaCAI.diasRestantes}</strong>
                </p>
                <p>CAI: {alertaCAI.cai}</p>
                <p>
                  Rango: {alertaCAI.rangoDesde} → {alertaCAI.rangoHasta}
                </p>
                <p>Fecha límite: {new Date(alertaCAI.fechaLimite).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        )}

        <div className="navbar-user">
          <p className="navbar-username">{user?.full_name || "Usuario"}</p>
          <span className="navbar-role">{roleData?.label || "Sin rol"}</span>
        </div>

        <div className="navbar-avatar" style={{ backgroundColor: roleData ? roleData.color : "#00b073" }}>
          {roleData?.icon ? <img src={roleData.icon} alt={roleData.label} className="navbar-avatar-icon" /> :
            (user?.username ? user.username[0].toUpperCase() : "?")}
        </div>

        <button className="navbar-icon" onClick={openModal}><LogOut size={20} /></button>
      </header>

      {showModal && (
        <div className={`navbar-logout-modal-overlay ${isClosing ? "fade-out" : ""}`} onClick={closeModal}>
          <div className={`navbar-logout-modal-content ${isClosing ? "fade-out" : ""}`} onClick={e => e.stopPropagation()}>
            <button className="navbar-logout-modal-close" onClick={closeModal}><X size={18} /></button>
            <h3 className="navbar-logout-modal-title">¿Deseas cerrar sesión?</h3>
            <div className="navbar-logout-modal-actions">
              <button className="btn-logout-confirm" onClick={() => { closeModal(); setTimeout(() => handleLogout(), 300); }}>Sí</button>
              <button className="btn-logout-cancel" onClick={closeModal}>No</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
