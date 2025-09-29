import React, { useState, useEffect } from "react";
import { Search, CalendarHeart, Pencil, Trash2 } from "lucide-react";
import "../CSS/Citas.css";

function Citas() {
  const ejemplos = [
    {
      id: 1,
      fecha: "2025-08-24",
      hora: "10:00",
      dueño: "Leonel Montecinos",
      mascota: "Max",
      doctor: "Dr. Eduardo Matamoros",
      motivo: "Consulta general",
      estado: "Programada",
    },
    {
      id: 2,
      fecha: "2025-08-24",
      hora: "11:00",
      dueño: "Jose David Martinez",
      mascota: "Luna",
      doctor: "Dr. Leonel Matamoros",
      motivo: "Vacunación",
      estado: "Programada",
    },
  ];

  const [citas, setCitas] = useState(() => {
    const saved = localStorage.getItem("citas");
    return saved ? JSON.parse(saved) : ejemplos;
  });

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [nuevaCita, setNuevaCita] = useState({
    fecha: "",
    hora: "",
    dueño: "",
    mascota: "",
    doctor: "",
    motivo: "",
    estado: "Programada",
  });
  const [mensaje, setMensaje] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [citaAEliminar, setCitaAEliminar] = useState(null);

  // Listas de opciones
  const dueñosDisponibles = ["Leonel Montecinos", "Jose David Martinez", "Ana López", "Carlos Ramírez"];
  const mascotasDisponibles = ["Max", "Luna", "Toby", "Misha"];
  const doctoresDisponibles = [
    "Dra. Maria González - Medicina General",
    "Dr. Carlos Rodríguez - Cirugía",
    "Dra. Ana López - Dermatología",
    "Dr. Jorge Martínez - Cardiología",
    "Dra. Laura Hernández - Oftalmología",
    "Dr. Roberto Silva - Traumatología",
    "Dra. Patricia Morales - Neurología",
    "Dr. Fernando Castro - Medicina Interna",
    "Dra. Sofía Vargas - Reproducción",
    "Dr. Miguel Torres - Medicina Felina",
  ];

  useEffect(() => {
    localStorage.setItem("citas", JSON.stringify(citas));
  }, [citas]);

  function handleChange(e) {
    setNuevaCita({ ...nuevaCita, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (editId !== null) {
      setCitas(citas.map((c) => (c.id === editId ? { ...nuevaCita, id: editId } : c)));
      setMensaje("Cita editada con éxito");
      setEditId(null);
    } else {
      setCitas([...citas, { ...nuevaCita, id: Date.now() }]);
      setMensaje("Cita programada con éxito");
    }

    setNuevaCita({
      fecha: "",
      hora: "",
      dueño: "",
      mascota: "",
      doctor: "",
      motivo: "",
      estado: "Programada",
    });

    cerrarModal();
    setTimeout(() => setMensaje(""), 3000);
  }

  function handleEditar(cita) {
    setNuevaCita(cita);
    setEditId(cita.id);
    setShowModal(true);
  }

  function confirmarEliminar(cita) {
    setCitaAEliminar(cita);
    setShowConfirmModal(true);
  }

  function handleEliminarConfirmado() {
    if (citaAEliminar) {
      setCitas(citas.filter((c) => c.id !== citaAEliminar.id));
      setMensaje(`Cita de ${citaAEliminar.dueño} eliminada con éxito`);
      setTimeout(() => setMensaje(""), 3000);
    }
    cerrarConfirmModal();
  }

  function handleCancelarEliminar() {
    cerrarConfirmModal();
  }

  const citasFiltradas = citas.filter((cita) =>
    [cita.dueño, cita.mascota, cita.doctor, cita.motivo]
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const getColorFondo = (estado) => {
    switch (estado) {
      case "Programada": return "#ADD8E6";
      case "Completada": return "#d4edda";
      case "Cancelada": return "#f8d7da";
      default: return "white";
    }
  };

  const getColorTexto = (estado) => {
    switch (estado) {
      case "Programada": return "#004085";
      case "Completada": return "#155724";
      case "Cancelada": return "#721c24";
      default: return "#000";
    }
  };

  // Función para cerrar modal con animación y limpiar estados
  const cerrarModal = () => {
    setShowModal(false);
    setEditId(null);
    setNuevaCita({
      fecha: "",
      hora: "",
      dueño: "",
      mascota: "",
      doctor: "",
      motivo: "",
      estado: "Programada",
    });
  };

  const cerrarConfirmModal = () => {
    setShowConfirmModal(false);
    setCitaAEliminar(null);
  };

  return (
    <div className="citas-container">
      <div className="citas-header">
        <div>
          <h1 className="Citas-title">
            <CalendarHeart size={26} color="#4CAF50" style={{ marginRight: "10px" }} />
            Citas Médicas
          </h1>
          <h4 className="Citas-subtitulo">Gestión de Citas Médicas</h4>
        </div>
        <button
          className="btn-nueva-cita"
          onClick={() => {
            setEditId(null);
            setNuevaCita({
              fecha: "",
              hora: "",
              dueño: "",
              mascota: "",
              doctor: "",
              motivo: "",
              estado: "Programada",
            });
            setShowModal(true);
          }}
        >
          + Nueva Cita
        </button>
      </div>

      {mensaje && <div className="mensaje-exito">{mensaje}</div>}

      <div className="citas-search">
        <Search className="search-icon" />
        <input
          type="text"
          placeholder="Buscar por dueño, mascota, médico o motivo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <table className="citas-table">
        <thead>
          <tr>
            <th>Fecha y Hora</th>
            <th>Dueño</th>
            <th>Mascota</th>
            <th>Doctor</th>
            <th>Motivo</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {citasFiltradas.map((cita) => (
            <tr key={cita.id}>
              <td>
                <div className="fecha-hora">
                  <span>{cita.fecha}</span>
                  <br />
                  <span className="hora">{cita.hora}</span>
                </div>
              </td>
              <td>{cita.dueño}</td>
              <td>{cita.mascota}</td>
              <td>{cita.doctor}</td>
              <td>{cita.motivo}</td>
              <td>
                <select
                  value={cita.estado}
                  onChange={(e) =>
                    setCitas(
                      citas.map((c) =>
                        c.id === cita.id ? { ...c, estado: e.target.value } : c
                      )
                    )
                  }
                  style={{
                    backgroundColor: getColorFondo(cita.estado),
                    color: getColorTexto(cita.estado),
                  }}
                  className="estado-select"
                >
                  <option value="Programada">Programada</option>
                  <option value="Completada">Completada</option>
                  <option value="Cancelada">Cancelada</option>
                </select>
              </td>
              <td className="acciones">
                <button className="btn-editar" onClick={() => handleEditar(cita)}>
                  <Pencil size={20} color="#2196F3" />
                </button>
                <button className="btn-eliminar" onClick={() => confirmarEliminar(cita)}>
                  <Trash2 size={20} color="#E53935" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal de Nueva/Editar Cita */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{editId !== null ? "Editar Cita" : "Nueva Cita"}</h3>
            <form onSubmit={handleSubmit}>
              <label>Dueño</label>
              <select name="dueño" value={nuevaCita.dueño} onChange={handleChange} required>
                <option value="">Seleccionar dueño</option>
                {dueñosDisponibles.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              <label>Mascota</label>
              <select name="mascota" value={nuevaCita.mascota} onChange={handleChange} required>
                <option value="">Seleccionar mascota</option>
                {mascotasDisponibles.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>

              <label>Doctor</label>
              <select name="doctor" value={nuevaCita.doctor} onChange={handleChange} required>
                <option value="">Seleccionar médico</option>
                {doctoresDisponibles.map((doc) => (
                  <option key={doc} value={doc}>{doc}</option>
                ))}
              </select>

              <label>Motivo</label>
              <input
                type="text"
                name="motivo"
                placeholder="Motivo de la cita"
                value={nuevaCita.motivo}
                onChange={handleChange}
                required
              />

              <label>Fecha</label>
              <input type="date" name="fecha" value={nuevaCita.fecha} onChange={handleChange} required />

              <label>Hora</label>
              <input type="time" name="hora" value={nuevaCita.hora} onChange={handleChange} required />

              <div className="modal-buttons">
                <button type="submit" className="btn-guardar">
                  {editId !== null ? "Guardar Cambios" : "Guardar"}
                </button>
                <button type="button" className="btn-cancelar" onClick={cerrarModal}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmar Eliminación */}
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Confirmar Eliminación</h3>
            <p>¿Seguro que quieres eliminar la cita de {citaAEliminar?.dueño}?</p>
            <div className="modal-buttons">
              <button className="btn-guardar" onClick={handleEliminarConfirmado}>
                Sí, eliminar
              </button>
              <button className="btn-cancelar" onClick={handleCancelarEliminar}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default Citas;