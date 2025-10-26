const BASE_URL = "http://localhost:5000/api/pets";

// 📌 Obtener todas las mascotas (con filtro opcional)
export async function getPets(filter = "") {
  const url = filter ? `${BASE_URL}?filter=${encodeURIComponent(filter)}` : BASE_URL;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Error obteniendo mascotas");
  return res.json();
}

// 📌 Registrar nueva mascota
export async function createPet(petData) {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(petData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || "Error creando mascota");
  return data;
}

// 📌 Actualizar mascota
export async function updatePet(id, petData) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(petData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || "Error actualizando mascota");
  return data;
}

// 📌 Eliminar mascota
export async function deletePet(id) {
  const res = await fetch(`${BASE_URL}/${id}`, { method: "DELETE" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || "Error eliminando mascota");
  return data;
}
