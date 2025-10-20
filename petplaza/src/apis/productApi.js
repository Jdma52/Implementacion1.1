import axios from "axios";

const API_URL = "http://localhost:5000/api/products";

// Obtener todos los productos
export const getProducts = async () => {
  const res = await axios.get(API_URL);
  return res.data;
};

// Crear un producto
export const createProduct = async (data) => {
  const res = await axios.post(API_URL, data);
  return res.data;
};

// Actualizar un producto
export const updateProduct = async (id, data) => {
  const res = await axios.put(`${API_URL}/${id}`, data);
  return res.data;
};

// Eliminar un producto
export const deleteProduct = async (id) => {
  const res = await axios.delete(`${API_URL}/${id}`);
  return res.data;
};
