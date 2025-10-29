// facturasApi.js
import axios from "axios";
const BASE_URL = "/api/facturas";

// ===============================
// OBTENER TODAS LAS FACTURAS
// ===============================
export const getFacturas = async () => {
  try {
    const res = await axios.get(BASE_URL);
    return res.data;
  } catch (error) {
    console.error("❌ Error en getFacturas:", error);
    throw new Error("Error obteniendo facturas");
  }
};

// ===============================
// CREAR NUEVA FACTURA
// ===============================
export const createFactura = async (data) => {
  try {
    const res = await axios.post(BASE_URL, data, {
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
// OBTENER FACTURA POR ID
// ===============================
export const getFacturaById = async (id) => {
  try {
    const res = await axios.get(`${BASE_URL}/${id}`);
    return res.data;
  } catch (error) {
    console.error("❌ Error en getFacturaById:", error);
    const msg = error.response?.data?.mensaje || "Error obteniendo factura";
    throw new Error(msg);
  }
};

// ===============================
// ELIMINAR FACTURA
// ===============================
export const deleteFactura = async (id) => {
  try {
    const res = await axios.delete(`${BASE_URL}/${id}`);
    return res.data;
  } catch (error) {
    console.error("❌ Error en deleteFactura:", error);
    const msg = error.response?.data?.mensaje || "Error eliminando factura";
    throw new Error(msg);
  }
};

// ===============================
// ACTUALIZAR ESTADO (Pagado/Pendiente)
// ===============================
export const updateFacturaEstado = async (id, estado) => {
  try {
    const res = await axios.put(`${BASE_URL}/${id}/estado`, { estado });
    return res.data;
  } catch (error) {
    console.error("❌ Error en updateFacturaEstado:", error);
    const msg =
      error.response?.data?.mensaje ||
      "Error actualizando el estado de la factura";
    throw new Error(msg);
  }
};

// ===============================
//  ACTUALIZAR FACTURA COMPLETA
// ===============================
export const updateFactura = async (id, data) => {
  try {
    const res = await axios.put(`${BASE_URL}/${id}`, data, {
      headers: { "Content-Type": "application/json" },
    });
    return res.data;
  } catch (error) {
    console.error("❌ Error en updateFactura:", error);
    const msg = error.response?.data?.mensaje || "Error actualizando factura";
    throw new Error(msg);
  }
};


