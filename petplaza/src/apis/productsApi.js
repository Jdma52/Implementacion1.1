const BASE_URL = "http://localhost:5000/api/products";

// Obtener todos los productos desde el backend (inventario)
export async function getProducts() {
  const res = await fetch(BASE_URL);
  if (!res.ok) throw new Error("Error obteniendo productos");
  return res.json();
}
