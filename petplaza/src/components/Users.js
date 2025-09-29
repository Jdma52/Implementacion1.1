// src/components/Users.js
import React, { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, User, Mail,
  Shield, Eye, EyeOff, ShieldCheck, Stethoscope,
  FlaskConical, Package, Users as UsersIcon } from "lucide-react";
import "../CSS/Users.css";
import { getUsers, createUser, updateUser, deleteUser, toggleUserStatus } from "../apis/usersApi";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    full_name: "",
    email: "",
    role: "",
    password: "",
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isClosingConfirm, setIsClosingConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const roles = [
    {
      value: "admin",
      label: "Administradores",
      color: "#ef4444",
      icon: <ShieldCheck size={20} />,
    },
    {
      value: "veterinario",
      label: "Doctores",
      color: "#3b82f6",
      icon: <Stethoscope size={20} />,
    },
    {
      value: "laboratorio",
      label: "Laboratorio",
      color: "#8b5cf6",
      icon: <FlaskConical size={20} />,
    },
    {
      value: "farmacia",
      label: "Personal de Inventario",
      color: "#10b981",
      icon: <Package size={20} />,
    },
    {
      value: "recepcion",
      label: "Recepción",
      color: "#f97316",
      icon: <UsersIcon size={20} />,
    },
  ];

  // === CARGAR USUARIOS DEL BACKEND ===
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      console.error("Error cargando usuarios:", err);
    }
  };

  // === CREAR / EDITAR ===
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        username: formData.username,
        full_name: formData.full_name,
        email: formData.email,
        role: formData.role,
        password: formData.password,
      };

      if (editingUser) {
        if (!payload.password) delete payload.password;
        await updateUser(editingUser._id, payload);
      } else {
        await createUser(payload);
      }

      handleCloseModal();
      loadUsers();
    } catch (err) {
      console.error("Error guardando usuario:", err);
    }
  };

  // === EDITAR ===
  const handleEdit = (userToEdit) => {
    setEditingUser(userToEdit);
    setFormData({
      username: userToEdit.username,
      full_name: userToEdit.full_name,
      email: userToEdit.email,
      role: userToEdit.role,
      password: "",
    });
    setShowModal(true);
  };

  // === ELIMINAR ===
  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteUser(userToDelete._id);
      closeConfirmModal();
      loadUsers();
    } catch (err) {
      console.error("Error eliminando usuario:", err);
    }
  };

  const cancelDelete = () => closeConfirmModal();

  const closeConfirmModal = () => {
    setIsClosingConfirm(true);
    setTimeout(() => {
      setShowConfirmModal(false);
      setIsClosingConfirm(false);
      setUserToDelete(null);
    }, 300);
  };

  // === CAMBIAR ESTADO (ACTIVO/INACTIVO) ===
  const handleToggleStatus = async (id) => {
    try {
      const updated = await toggleUserStatus(id);
      setUsers(
        users.map((u) =>
          u._id === id ? { ...u, is_active: updated.is_active } : u
        )
      );
    } catch (err) {
      console.error("Error cambiando estado:", err);
    }
  };

  // === MODAL PRINCIPAL ===
  const handleCloseModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowModal(false);
      setIsClosing(false);
      setEditingUser(null);
      setFormData({
        username: "",
        full_name: "",
        email: "",
        role: "",
        password: "",
      });
    }, 300);
  };

  // === FILTRO ===
  const filteredUsers = users.filter(
    (u) =>
      u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // === ESTILOS DE ROLES ===
  const getRoleStyle = (role) => {
    const foundRole = roles.find((r) => r.value === role);
    return foundRole
      ? { backgroundColor: `${foundRole.color}20`, color: foundRole.color }
      : {};
  };

  return (
    <div className="users-container">
      {/* Header */}
      <div className="users-header">
        <div>
          <h1 className="users-title">
            <UsersIcon size={22} /> Gestión de Usuarios
          </h1>
          <p className="users-subtitle">
            Administrar roles y permisos del personal
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Nuevo Usuario
        </button>
      </div>

      {/* Estadísticas */}
      <div className="stats-grid">
        {roles.map((r) => (
          <div className="stats-card" key={r.value}>
            <div className="stats-icon" style={{ color: r.color }}>
              {r.icon}
            </div>
            <div>
              <p className="stats-number">
                {users.filter((u) => u.role === r.value).length}
              </p>
              <p className="stats-label">{r.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Buscador */}
      <div className="search-box">
        <Search className="search-icon" />
        <input
          type="text"
          placeholder="Buscar por nombre, usuario, email o rol"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tabla */}
      <div className="table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Nombre Completo</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u._id}>
                <td>
                  <User size={16} style={{ marginRight: 6 }} /> @{u.username}
                </td>
                <td>{u.full_name}</td>
                <td>
                  <Mail size={16} style={{ marginRight: 6 }} /> {u.email}
                </td>
                <td>
                  <span className="role-badge" style={getRoleStyle(u.role)}>
                    <Shield size={14} style={{ marginRight: 4 }} />{" "}
                    {roles.find((r) => r.value === u.role)?.label}
                  </span>
                </td>
                <td>
                  <button
                    className={`status-btn ${
                      u.is_active ? "active" : "inactive"
                    }`}
                    onClick={() => handleToggleStatus(u._id)}
                  >
                    {u.is_active ? "Activo" : "Inactivo"}
                  </button>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="action-btn edit"
                      onClick={() => handleEdit(u)}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={() => handleDeleteClick(u)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Nuevo/Editar */}
      {showModal && (
        <div className={`modal-overlay ${isClosing ? "closing" : "open"}`}>
          <div className={`modal ${isClosing ? "closing" : "open"}`}>
            <h2>{editingUser ? "Editar Usuario" : "Nuevo Usuario"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nombre de Usuario</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  required
                  disabled={!!editingUser}
                />
              </div>
              <div className="form-group">
                <label>Nombre Completo</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Rol</label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  required
                >
                  <option value="">Seleccionar rol</option>
                  {roles.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group password-field">
                <label>Contraseña</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required={!editingUser}
                  minLength="6"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCloseModal}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingUser ? "Actualizar" : "Crear Usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmación Eliminar */}
      {showConfirmModal && (
        <div
          className={`confirm-modal-overlay ${
            isClosingConfirm ? "closing" : "open"
          }`}
        >
          <div
            className={`confirm-modal ${
              isClosingConfirm ? "closing" : "open"
            }`}
          >
            <h3>¿Deseas eliminar este usuario?</h3>
            <p style={{ textAlign: "center", marginBottom: "1rem" }}>
              {userToDelete?.full_name}
            </p>
            <div className="confirm-actions">
              <button className="confirm-btn" onClick={confirmDelete}>
                Sí, Eliminar
              </button>
              <button className="cancel-btn" onClick={cancelDelete}>
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;