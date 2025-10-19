import React, { useMemo, useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  User as UserIcon,
  Mail,
  Phone,
  Home,
  IdCard,
} from "lucide-react";
import "../CSS/Duenos.css";
import {
  getOwners,
  createOwner,
  updateOwner,
  deleteOwner,
} from "../apis/ownersApi"; // 👈 Import API real

const Dueños = () => {
  const [owners, setOwners] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [closingModal, setClosingModal] = useState(false);
  const [editingOwner, setEditingOwner] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [closingDeleteModal, setClosingDeleteModal] = useState(false);
  const [ownerToDelete, setOwnerToDelete] = useState(null);

  // 👇 Nuevo estado para errores
  const [errorModal, setErrorModal] = useState({ show: false, message: "" });

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    dni: "",
    address: "",
  });

  // ---------- cargar dueños desde la API ----------
  useEffect(() => {
    const fetchOwners = async () => {
      try {
        setLoading(true);
        const data = await getOwners(searchTerm);
        setOwners(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOwners();
  }, [searchTerm]);

  // ---------- utilidades ----------
  const formatPhone = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 4) return digits;
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  };

  const formatDNI = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 13);
    if (digits.length <= 4) return digits;
    if (digits.length <= 8) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
  };

  const initialsOf = (name) =>
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() || "")
      .join("");

  // ---------- CRUD ----------
  const openCreate = () => {
    setEditingOwner(null);
    setFormData({ full_name: "", phone: "", email: "", dni: "", address: "" });
    setShowModal(true);
    setClosingModal(false);
  };

  const openEdit = (owner) => {
    setEditingOwner(owner);
    setFormData(owner);
    setShowModal(true);
    setClosingModal(false);
  };

  const closeModal = () => {
    setClosingModal(true);
    setTimeout(() => {
      setShowModal(false);
      setEditingOwner(null);
      setClosingModal(false);
    }, 300);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingOwner) {
        const updated = await updateOwner(editingOwner._id, formData);
        setOwners((prev) =>
          prev.map((o) => (o._id === editingOwner._id ? updated.owner : o))
        );
      } else {
        const created = await createOwner(formData);
        setOwners((prev) => [...prev, created.owner]);
      }
      closeModal();
    } catch (err) {
      setErrorModal({ show: true, message: err.message }); // 👈 modal error
    }
  };

  const confirmDelete = (owner) => {
    setOwnerToDelete(owner);
    setShowDeleteModal(true);
    setClosingDeleteModal(false);
  };

  const handleDeleteConfirmed = async () => {
    try {
      await deleteOwner(ownerToDelete._id);
      setOwners((prev) => prev.filter((o) => o._id !== ownerToDelete._id));
      closeDeleteModal();
    } catch (err) {
      setErrorModal({ show: true, message: err.message }); // 👈 modal error
    }
  };

  const handleDeleteCancelled = () => {
    closeDeleteModal();
  };

  const closeDeleteModal = () => {
    setClosingDeleteModal(true);
    setTimeout(() => {
      setShowDeleteModal(false);
      setOwnerToDelete(null);
      setClosingDeleteModal(false);
    }, 300);
  };

  // ---------- filtro adicional en FE ----------
  const filteredOwners = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return owners;
    return owners.filter((o) =>
      [o.full_name, o.phone, o.email, o.dni, o.address]
        .filter(Boolean)
        .some((f) => f.toLowerCase().includes(q))
    );
  }, [owners, searchTerm]);

  return (
    <div className="owners-container">
      {/* Header */}
      <div className="owners-header">
        <div>
          <h1 className="owners-title">
            <UserIcon size={20} /> Dueños de Mascotas
          </h1>
          <p className="owners-subtitle">Gestión de propietarios registrados</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <Plus size={18} /> Nuevo Dueño
        </button>
      </div>

      {/* Buscador */}
      <div className="search-box">
        <Search className="search-icon" aria-hidden />
        <input
          type="text"
          placeholder="Buscar por nombre, teléfono, email, DNI o dirección…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Buscar dueños"
        />
      </div>

      {/* Tabla */}
      <div className="table-wrapper">
        {loading ? (
          <p className="empty-state">Cargando dueños...</p>
        ) : error ? (
          <p className="empty-state">❌ {error}</p>
        ) : (
          <table className="owners-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>Correo Electrónico</th>
                <th>DNI</th>
                <th>Dirección</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredOwners.length ? (
                filteredOwners.map((o) => (
                  <tr key={o._id}>
                    <td>
                      <div className="owner-info">
                        <div className="owner-avatar">{initialsOf(o.full_name)}</div>
                        <span>{o.full_name}</span>
                      </div>
                    </td>
                    <td className="cell-with-icon">
                      <Phone size={16} /> {o.phone}
                    </td>
                    <td className="cell-with-icon">
                      <Mail size={16} /> {o.email}
                    </td>
                    <td className="cell-with-icon">
                      <IdCard size={16} /> {o.dni}
                    </td>
                    <td className="cell-with-icon">
                      <Home size={16} /> {o.address}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="action-btn edit"
                          onClick={() => openEdit(o)}
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={() => confirmDelete(o)}
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="empty-state">
                    No se encontraron dueños con ese criterio.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Crear/Editar */}
      {showModal && (
        <div
          className={`modal-overlay ${closingModal ? "closing" : "active"}`}
          role="dialog"
          aria-modal="true"
          onClick={(e) =>
            e.target.classList.contains("modal-overlay") && closeModal()
          }
        >
          <div className={`modal ${closingModal ? "closing" : "active"}`}>
            <h2>{editingOwner ? "Editar Dueño" : "Nuevo Dueño"}</h2>
            <form onSubmit={handleSubmit}>
              <label>
                Nombre Completo
                <input
                  type="text"
                  placeholder="Ej. Juan Pérez"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  required
                />
              </label>

              <label>
                Teléfono
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="####-####"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      phone: formatPhone(e.target.value),
                    })
                  }
                  maxLength={9}
                  required
                />
              </label>

              <label>
                Correo electrónico (opcional)
                <input
                  type="email"
                  placeholder="correo@dominio.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </label>

              <label>
                DNI
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0801-1990-12345"
                  value={formData.dni}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dni: formatDNI(e.target.value),
                    })
                  }
                  maxLength={15}
                  required
                />
              </label>

              <label>
                Dirección
                <textarea
                  placeholder="Colonia Palmira, Tegucigalpa"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  rows={3}
                  required
                />
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary cancel"
                  onClick={closeModal}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingOwner ? "Actualizar" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && (
        <div
          className={`modal-overlay ${closingDeleteModal ? "closing" : "active"}`}
          role="dialog"
          aria-modal="true"
        >
          <div
            className={`modal delete-modal ${
              closingDeleteModal ? "closing" : "active"
            }`}
          >
            <h2>¿Eliminar dueño?</h2>
            <p>
              ¿Estás seguro de que deseas eliminar a{" "}
              <strong>{ownerToDelete?.full_name}</strong>? Esta acción no se
              puede deshacer.
            </p>
            <div className="modal-actions">
              <button className="btn-danger" onClick={handleDeleteConfirmed}>
                Sí, eliminar
              </button>
              <button
                className="btn-cancel-alt"
                onClick={handleDeleteCancelled}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Error */}
      {errorModal.show && (
        <div className="modal-overlay active" role="dialog" aria-modal="true">
          <div className="modal delete-modal active">
            <h2>Error</h2>
            <p>{errorModal.message}</p>
            <div className="modal-actions">
              <button
                className="btn-danger"
                onClick={() => setErrorModal({ show: false, message: "" })}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dueños;
