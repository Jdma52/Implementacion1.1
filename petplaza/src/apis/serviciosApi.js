const BASE_URL = "http://localhost:5000/api/servicios";

export async function getServicios() {
  const res = await fetch(BASE_URL);
  if (!res.ok) throw new Error("Error obteniendo servicios");
  return res.json();
}
