// src/apis/authApi.js
const BASE_URL = "http://localhost:5000/api/auth";

export async function loginApi({ username, password }) {
  const res = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || "Error en login");
  return data;
}

export async function verifyOtpApi({ username, otpCode }) {
  const res = await fetch(`${BASE_URL}/verify-2fa`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, otpCode }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || "Error en verificación");
  return data;
}

export async function registerApi(formData) {
  const res = await fetch(`${BASE_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || "Error en registro");
  return data;
}
