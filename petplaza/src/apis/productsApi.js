import axios from "axios";

const isLocal = typeof window !== "undefined" && window.location.hostname === "localhost";
const BASE_URL = isLocal ? "http://localhost:5000/api/products" : "/api/products";

const api = axios.create({
  baseURL: BASE_URL.replace("/api/products", ""),
  headers: { "Content-Type": "application/json" },
});

export const getProducts = async () => {
  try {
    const res = await api.get("/api/products");
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.error("❌ Error obteniendo productos:", err);
    return [];
  }
};

export const createProduct = async (data) => (await api.post("/api/products", data)).data;
export const updateProduct = async (id, data) => (await api.put(`/api/products/${id}`, data)).data;
export const deleteProduct = async (id) => (await api.delete(`/api/products/${id}`)).data;
