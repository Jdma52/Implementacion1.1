// src/apis/ownersApi.js
const BASE_URL = "http://localhost:5000/api/owners";

// Obtener todos los dueños
export async function getOwners() {
  const res = await fetch(BASE_URL);
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || "Error obteniendo dueños");
  return data; // [{ _id, full_name, phone, email, dni, address }]
}

// Crear nuevo dueño
export async function createOwner(ownerData) {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ownerData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || "Error creando dueño");
  return data;
}

// Actualizar dueño
export async function updateOwner(id, ownerData) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ownerData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || "Error actualizando dueño");
  return data;
}

// Eliminar dueño
export async function deleteOwner(id) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || "Error eliminando dueño");
  return data;
}
