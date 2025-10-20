// facturasApi.js

import axios from "axios";

// Ruta base del backend (puedes ajustar el puerto si es diferente)
const API = process.env.REACT_APP_API || "http://localhost:5000/api/facturas";

// ===============================
// 📦 OBTENER TODAS LAS FACTURAS
// ===============================
export const getFacturas = async () => {
  try {
    const res = await axios.get(API);
    return res.data;
  } catch (error) {
    console.error("❌ Error en getFacturas:", error);
    throw new Error("Error obteniendo facturas");
  }
};

// ===============================
// 🧾 CREAR NUEVA FACTURA
// ===============================
export const createFactura = async (data) => {
  try {
    const res = await axios.post(API, data, {
      headers: { "Content-Type": "application/json" },
    });
    return res.data;
  } catch (error) {
    console.error("❌ Error en createFactura:", error);
    const msg = error.response?.data?.mensaje || "Error creando factura";
    throw new Error(msg);
  }
};

// ===============================
// 🔍 OBTENER FACTURA POR ID
// ===============================
export const getFacturaById = async (id) => {
  try {
    const res = await axios.get(`${API}/${id}`);
    return res.data;
  } catch (error) {
    console.error("❌ Error en getFacturaById:", error);
    const msg = error.response?.data?.mensaje || "Error obteniendo factura";
    throw new Error(msg);
  }
};

// ===============================
// 🗑️ ELIMINAR FACTURA
// ===============================
export const deleteFactura = async (id) => {
  try {
    const res = await axios.delete(`${API}/${id}`);
    return res.data;
  } catch (error) {
    console.error("❌ Error en deleteFactura:", error);
    const msg = error.response?.data?.mensaje || "Error eliminando factura";
    throw new Error(msg);
  }
};

// ===============================
// 🔄 ACTUALIZAR ESTADO (Pagado/Pendiente)
// ===============================
export const updateFacturaEstado = async (id, estado) => {
  try {
    const res = await axios.put(`${API}/${id}/estado`, { estado });
    return res.data;
  } catch (error) {
    console.error("❌ Error en updateFacturaEstado:", error);
    const msg =
      error.response?.data?.mensaje ||
      "Error actualizando el estado de la factura";
    throw new Error(msg);
  }
};

