// src/components/Mascotas.js
import React, { useMemo, useState } from "react";
import {
  FaEdit,
  FaTrash,
  FaPaw,
  FaUser,
  FaCalendarAlt,
  FaWeight,
  FaPalette,
  FaSearch,
} from "react-icons/fa";
import "../CSS/Mascotas.css";

const Mascotas = () => {
  // ---- Datos de ejemplo ----
  const [mascotas, setMascotas] = useState([
    {
      id: 1,
      nombre: "Máximo",
      especie: "Perro",
      raza: "Labrador",
      dueño: "Juan Pérez",
      nacimiento: "2020-05-15",
      peso: 25.5,
      color: "Dorado",
    },
    {
      id: 2,
      nombre: "Legolas",
      especie: "Perro",
      raza: "Pitbull",
      dueño: "José David Martínez Ardón",
      nacimiento: "2021-07-10",
      peso: 35,
      color: "Café",
    },
  ]);

  // ---- Dueños (para el select del modal) ----
  const [dueños] = useState([
    "Juan Pérez",
    "José David Martínez Ardón",
    "Carlos López",
    "María Hernández",
    "Freddy Leonel Montecinos",
  ]);

  // ---- Buscador ----
  const [search, setSearch] = useState("");
  const normalize = (s) =>
    (s ?? "")
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");

  const filteredMascotas = useMemo(() => {
    const q = normalize(search.trim());
    if (!q) return mascotas;
    return mascotas.filter((m) =>
      [m.nombre, m.especie, m.raza, m.dueño, m.color].some((f) =>
        normalize(f).includes(q)
      )
    );
  }, [search, mascotas]);

  // ---- Modal Crear/Editar ----
  const [showModal, setShowModal] = useState(false);
  const [closingMain, setClosingMain] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [mascotaEditando, setMascotaEditando] = useState(null);

  // ---- Modal Eliminar ----
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [closingDelete, setClosingDelete] = useState(false);
  const [mascotaAEliminar, setMascotaAEliminar] = useState(null);

  // ---- Form ----
  const [nuevaMascota, setNuevaMascota] = useState({
    nombre: "",
    especie: "",
    raza: "",
    dueño: "",
    nacimiento: "",
    peso: "",
    color: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNuevaMascota((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault(); // Evita recarga
    if (modoEdicion) {
      setMascotas((prev) =>
        prev.map((m) =>
          m.id === mascotaEditando.id ? { ...nuevaMascota, id: m.id } : m
        )
      );
    } else {
      setMascotas((prev) => [...prev, { ...nuevaMascota, id: Date.now() }]);
    }
    cerrarModalPrincipal();
  };

  // ---- Abrir/Cerrar modales con animación ----
  const abrirModalNueva = () => {
    setModoEdicion(false);
    setMascotaEditando(null);
    setNuevaMascota({
      nombre: "",
      especie: "",
      raza: "",
      dueño: "",
      nacimiento: "",
      peso: "",
      color: "",
    });
    setClosingMain(false);
    setShowModal(true);
  };

  const abrirModalEditar = (mascota) => {
    setModoEdicion(true);
    setMascotaEditando(mascota);
    setNuevaMascota(mascota);
    setClosingMain(false);
    setShowModal(true);
  };

  const cerrarModalPrincipal = () => {
    setClosingMain(true);
    setTimeout(() => {
      setShowModal(false);
      setClosingMain(false);
    }, 250);
  };

  const abrirModalEliminar = (mascota) => {
    setMascotaAEliminar(mascota);
    setClosingDelete(false);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setClosingDelete(true);
    setTimeout(() => {
      setShowDeleteModal(false);
      setClosingDelete(false);
      setMascotaAEliminar(null);
    }, 250);
  };

  const confirmarEliminar = () => {
    setMascotas((prev) => prev.filter((m) => m.id !== mascotaAEliminar.id));
    closeDeleteModal();
  };

  return (
    <div className="mascotas-container">
      {/* Header */}
      <div className="mascotas-header">
        <div
          className="mascotas-title-wrapper"
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
          <FaPaw size={24} color="#00a884" aria-hidden="true" />
          <div>
            <h2 className="mascotas-title">Mascotas</h2>
            <p className="mascotas-subtitle">Gestión de mascotas registradas</p>
          </div>
        </div>
        <button className="btn-nueva-mascota" onClick={abrirModalNueva}>
          + Nueva Mascota
        </button>
      </div>

      {/* Buscador */}
      <div className="mascotas-search">
        <input
          type="text"
          placeholder="Buscar por nombre, especie, raza o dueño..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Buscar mascotas"
        />
        <FaSearch className="search-icon" aria-hidden="true" />
      </div>

      {/* Grid de tarjetas */}
      <div className="mascotas-grid">
        {filteredMascotas.map((mascota) => (
          <div className="mascota-card" key={mascota.id}>
            <div className="card-actions">
              <FaEdit
                className="icon edit"
                onClick={() => abrirModalEditar(mascota)}
              />
              <FaTrash
                className="icon delete"
                onClick={() => abrirModalEliminar(mascota)}
              />
            </div>

            <div className="mascota-header">
              <div className="mascota-icon">
                <FaPaw aria-hidden="true" />
              </div>
              <div className="mascota-titles">
                <h3 className="mascota-nombre">{mascota.nombre}</h3>
                <div className="mascota-raza">
                  {mascota.especie} - {mascota.raza}
                </div>
              </div>
            </div>

            <p>
              <FaUser /> Dueño: {mascota.dueño}
            </p>
            <p>
              <FaCalendarAlt /> Fecha de Nacimiento: {mascota.nacimiento}
            </p>
            <p>
              <FaWeight /> Peso: {mascota.peso} kg
            </p>
            <p>
              <FaPalette className="palette-icon" /> Color: {mascota.color}
            </p>
          </div>
        ))}

        {filteredMascotas.length === 0 && (
          <div className="empty-state">
            No se encontraron mascotas con ese criterio.
          </div>
        )}
      </div>

      {/* Modal Crear/Editar */}
      {showModal && (
        <div
          className={`modal-overlay ${closingMain ? "closing" : "active"}`}
          onMouseDown={(e) => {
            if (e.target.classList.contains("modal-overlay"))
              cerrarModalPrincipal();
          }}
        >
          <div
            className={`modal ${closingMain ? "closing" : "active"}`}
            role="dialog"
            aria-modal="true"
          >
            <h3>{modoEdicion ? "Editar Mascota" : "Nueva Mascota"}</h3>

            <form className="modal-form" onSubmit={handleSubmit}>
              <label>
                Nombre 
                <input
                  type="text"
                  name="nombre"
                  value={nuevaMascota.nombre}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Dueño 
                <select
                  name="dueño"
                  value={nuevaMascota.dueño}
                  onChange={handleChange}
                  required
                >
                  <option value="">Seleccionar dueño</option>
                  {dueños.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Especie
                <select
                  name="especie"
                  value={nuevaMascota.especie}
                  onChange={handleChange}
                >
                  <option value="">Seleccionar especie</option>
                  <option value="Perro">Perro</option>
                  <option value="Gato">Gato</option>
                  <option value="Conejo">Conejo</option>
                  <option value="Hamster">Hamster</option>
                  <option value="Ave">Ave</option>
                  <option value="Tortuga">Tortuga</option>
                  <option value="Pez">Pez</option>
                  <option value="Exotico">Exótico</option>
                  <option value="Otros">Otros</option>
                </select>
              </label>

              <label>
                Raza
                <input
                  type="text"
                  name="raza"
                  value={nuevaMascota.raza}
                  onChange={handleChange}
                />
              </label>

              <label>
                Fecha de Nacimiento
                <input
                  type="date"
                  name="nacimiento"
                  value={nuevaMascota.nacimiento}
                  onChange={handleChange}
                />
              </label>

              <label>
                Peso (kg)
                <input
                  type="number"
                  name="peso"
                  value={nuevaMascota.peso}
                  onChange={handleChange}
                  step="0.1"
                />
              </label>

              <label>
                Color
                <input
                  type="text"
                  name="color"
                  value={nuevaMascota.color}
                  onChange={handleChange}
                />
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancelar"
                  onClick={cerrarModalPrincipal}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-guardar">
                  {modoEdicion ? "Actualizar" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {showDeleteModal && (
        <div
          className={`modal-overlay ${closingDelete ? "closing" : "active"}`}
          onMouseDown={(e) => {
            if (e.target.classList.contains("modal-overlay"))
              closeDeleteModal();
          }}
        >
          <div
            className={`modal ${closingDelete ? "closing" : "active"}`}
            role="dialog"
            aria-modal="true"
          >
            <h3>¿Eliminar mascota?</h3>
            <p>
              ¿Deseas eliminar a <strong>{mascotaAEliminar?.nombre}</strong>?
            </p>
            <div className="modal-actions">
              <button className="btn-cancelar" onClick={closeDeleteModal}>
                No
              </button>
              <button className="btn-guardar" onClick={confirmarEliminar}>
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Mascotas;
