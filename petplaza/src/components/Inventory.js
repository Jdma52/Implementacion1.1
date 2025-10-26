// src/components/Inventory.js
import React, { useState, useEffect } from "react";
import {
  Edit,
  Trash2,
  ClipboardList,
  AlertTriangle,
  CalendarDays,
  Stethoscope,
} from "lucide-react";
import "../CSS/Inventory.css";


import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../apis/productsApi";

const sanitizeIntegerString = (str) => {
  if (typeof str !== "string") return str;
  return str.replace(/[^\d-]/g, "");
};

const sanitizeFloatString = (str) => {
  if (typeof str !== "string") return str;
  const cleaned = str.replace(/[^0-9.-]/g, "");
  const parts = cleaned.split(".");
  if (parts.length <= 2) return cleaned;
  return parts.shift() + "." + parts.join("");
};

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [closingModal, setClosingModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [closingDeleteModal, setClosingDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [form, setForm] = useState({
    name: "",
    category: "",
    quantity: "",
    price: "",
    minStock: "",
    provider: "",
    purchaseDate: "",
    expiryDate: "",
  });

  // Cargar productos al iniciar
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getProducts();
        setItems(data);
      } catch (err) {
        console.error("❌ Error cargando productos:", err);
      }
    };
    fetchData();
  }, []);

  // Métricas
  const totalProducts = items.length;
  const stockLow = items.filter((i) => Number(i.quantity) <= Number(i.minStock)).length;
  const expired = items.filter(
    (i) => i.expiryDate && new Date(i.expiryDate) < new Date()
  ).length;
  const totalValue = items.reduce(
    (sum, i) => sum + (parseFloat(i.price) || 0) * (Number(i.quantity) || 0),
    0
  );

  const filteredItems = items.filter((i) =>
    i.name?.toLowerCase().includes(search.toLowerCase())
  );

  // Manejo formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const openNew = () => {
    setEditingId(null);
    setForm({
      name: "",
      category: "",
      quantity: "",
      price: "",
      minStock: "",
      provider: "",
      purchaseDate: "",
      expiryDate: "",
    });
    setShowModal(true);
    setClosingModal(false);
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setForm({
      name: item.name ?? "",
      category: item.category ?? "",
      quantity: item.quantity != null ? String(item.quantity) : "",
      price: item.price != null ? String(item.price) : "",
      minStock: item.minStock != null ? String(item.minStock) : "",
      provider: item.provider ?? "",
      purchaseDate: item.purchaseDate ? item.purchaseDate.substring(0, 10) : "",
      expiryDate: item.expiryDate ? item.expiryDate.substring(0, 10) : "",
    });
    setShowModal(true);
    setClosingModal(false);
  };

  const handleCancel = () => {
    setClosingModal(true);
    setTimeout(() => {
      setShowModal(false);
      setEditingId(null);
      setForm({
        name: "",
        category: "",
        quantity: "",
        price: "",
        minStock: "",
        provider: "",
        purchaseDate: "",
        expiryDate: "",
      });
      setClosingModal(false);
    }, 300);
  };

  // Guardar producto (crear o actualizar)
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const qStr = sanitizeIntegerString(String(form.quantity).trim());
      const pStr = sanitizeFloatString(String(form.price).trim());
      const msStr = sanitizeIntegerString(String(form.minStock).trim());

      const payload = {
        name: form.name.trim(),
        category: form.category.trim(),
        quantity: qStr === "" ? 0 : parseInt(qStr, 10),
        price: pStr === "" ? 0 : parseFloat(pStr),
        minStock: msStr === "" ? 0 : parseInt(msStr, 10),
        provider: form.provider.trim() || "",
        purchaseDate: form.purchaseDate || null,
        expiryDate: form.expiryDate || null,
      };

      if (editingId) {
        await updateProduct(editingId, payload);
      } else {
        await createProduct(payload);
      }

      setItems(await getProducts());
      handleCancel();
    } catch (err) {
      console.error("❌ Error guardando producto:", err);
      alert("Error guardando producto: " + err.message);
    }
  };

  // Eliminar producto
  const confirmDelete = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
    setClosingDeleteModal(false);
  };

  const handleDeleteConfirmed = async () => {
    try {
      await deleteProduct(itemToDelete._id);
      setItems(await getProducts());
      closeDeleteModal();
    } catch (err) {
      console.error("❌ Error eliminando producto:", err);
      alert("Error eliminando producto: " + err.message);
    }
  };

  const closeDeleteModal = () => {
    setClosingDeleteModal(true);
    setTimeout(() => {
      setShowDeleteModal(false);
      setItemToDelete(null);
      setClosingDeleteModal(false);
    }, 300);
  };

  return (
    <div className="inventory-container">
      <div className="inventory-content">
        <h2>Inventario</h2>
        <p className="subtitle">Gestión de medicamentos y productos médicos.</p>

        {/* Resumen */}
        <div className="summary-cards">
          <div className="card info">
            <div className="icon blue">
              <ClipboardList className="icon-inner" />
            </div>
            <div>
              <h3>{totalProducts}</h3>
              <p>Total de productos</p>
            </div>
          </div>
          <div className="card warning">
            <div className="icon orange">
              <AlertTriangle className="icon-inner" />
            </div>
            <div>
              <h3>{stockLow}</h3>
              <p>Stock Bajo</p>
            </div>
          </div>
          <div className="card danger">
            <div className="icon red">
              <CalendarDays className="icon-inner" />
            </div>
            <div>
              <h3>{expired}</h3>
              <p>Vencidos</p>
            </div>
          </div>
          <div className="card success">
            <div className="icon green">
              <Stethoscope className="icon-inner" />
            </div>
            <div>
              <h3>L. {totalValue.toFixed(2)}</h3>
              <p>Valor total</p>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <input
            type="text"
            placeholder="Buscar productos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="inventory-btn add" onClick={openNew}>
            + Nuevo Producto
          </button>
        </div>

        {/* Tabla */}
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Cantidad</th>
              <th>Precio Unidad</th>
              <th>Proveedor</th>
              <th>Vencimiento</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan="8">No hay productos registrados</td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const isLow = Number(item.quantity) <= Number(item.minStock);
                const isExpired =
                  item.expiryDate && new Date(item.expiryDate) < new Date();
                return (
                  <tr key={item._id}>
                    <td>{item.name}</td>
                    <td>{item.category}</td>
                    <td>{item.quantity}</td>
                    <td>L. {parseFloat(item.price || 0).toFixed(2)}</td>
                    <td>{item.provider || "—"}</td>
                    <td className={isExpired ? "expired" : ""}>
                      {item.expiryDate ? item.expiryDate.substring(0, 10) : "—"}
                    </td>
                    <td>
                      {isExpired ? (
                        <span className="status danger">Vencido</span>
                      ) : isLow ? (
                        <span className="status warning">Stock bajo</span>
                      ) : (
                        <span className="status success">Disponible</span>
                      )}
                    </td>
                    <td className="inventory-actions">
                      <div className="action-buttons">
                        <button
                          className="action-btn edit"
                          onClick={() => handleEdit(item)}
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={() => confirmDelete(item)}
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Crear/Editar */}
      {showModal && (
        <div
          className={`inventory-modal-overlay ${closingModal ? "closing" : "active"}`}
          onClick={(e) =>
            e.target.classList.contains("inventory-modal-overlay") && handleCancel()
          }
        >
          <div className={`inventory-modal ${closingModal ? "closing" : "active"}`}>
            <h3>{editingId ? "Editar producto" : "Registrar nuevo producto"}</h3>
            <form className="modal-form" onSubmit={handleSave}>
              <div className="form-row">
                <label>Nombre </label>
                <input name="name" value={form.name} onChange={handleChange} required />
              </div>
              <div className="form-row">
                <label>Categoría </label>
                <input name="category" value={form.category} onChange={handleChange} required />
              </div>
              <div className="form-row">
                <label>Cantidad </label>
                <input
                  name="quantity"
                  type="number"
                  inputMode="numeric"
                  value={form.quantity}
                  onChange={handleChange}
                  required
                  min="1"
                />
              </div>
              <div className="form-row">
                <label>Precio (Lps) </label>
                <input
                  name="price"
                  type="number"
                  inputMode="decimal"
                  value={form.price}
                  onChange={handleChange}
                  required
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="form-row">
                <label>Stock mínimo </label>
                <input
                  name="minStock"
                  type="number"
                  inputMode="numeric"
                  value={form.minStock}
                  onChange={handleChange}
                  required
                  min="0"
                />
              </div>
              <div className="form-row">
                <label>Proveedor</label>
                <input name="provider" value={form.provider} onChange={handleChange} />
              </div>
              <div className="form-row">
                <label>Fecha de compra</label>
                <input
                  name="purchaseDate"
                  type="date"
                  value={form.purchaseDate}
                  onChange={handleChange}
                />
              </div>
              <div className="form-row">
                <label>Fecha de vencimiento</label>
                <input
                  name="expiryDate"
                  type="date"
                  value={form.expiryDate}
                  onChange={handleChange}
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="inventory-btn add">
                  {editingId ? "Actualizar" : "Guardar"}
                </button>
                <button
                  type="button"
                  className="inventory-btn cancel"
                  onClick={handleCancel}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Eliminar */}
      {showDeleteModal && (
        <div
          className={`inventory-modal-overlay ${closingDeleteModal ? "closing" : "active"}`}
        >
          <div
            className={`inventory-delete-modal ${closingDeleteModal ? "closing" : "active"}`}
          >
            <h2>¿Eliminar producto?</h2>
            <p>
              ¿Estás seguro de que deseas eliminar el producto{" "}
              <strong>{itemToDelete?.name}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="modal-actions">
              <button className="btn-danger" onClick={handleDeleteConfirmed}>
                Sí, eliminar
              </button>
              <button className="btn-cancel-alt" onClick={closeDeleteModal}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;


