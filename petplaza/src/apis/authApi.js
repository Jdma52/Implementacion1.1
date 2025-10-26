// src/apis/authApi.js
const BASE_URL = "http://localhost:5000/api/auth";

/* ==========================================================
   🔐 LOGIN (acepta usuario / correo / teléfono)
   ========================================================== */
export async function loginApi({ identifier, password }) {
  const res = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || "Error en login");
  return data;
}

/* ==========================================================
   🔢 VERIFICAR OTP (2FA)
   ========================================================== */
export async function verifyOtpApi({ identifier, otpCode }) {
  const res = await fetch(`${BASE_URL}/verify-2fa`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, otpCode }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || "Error en verificación");
  return data;
}

/* ==========================================================
   🧾 REGISTRO (opcional si lo usas desde frontend)
   ========================================================== */
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

/* ==========================================================
   📩 ENVIAR ENLACE DE RECUPERACIÓN DE CONTRASEÑA
   ========================================================== */
export async function sendRecoveryLinkApi({ identifier }) {
  const res = await fetch(`${BASE_URL}/send-recovery-link`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || "Error al enviar enlace");
  return data;
}

/* ==========================================================
   🔁 RESTABLECER CONTRASEÑA DESDE EL ENLACE SEGURO
   ========================================================== */
export async function resetPasswordByLinkApi({ token, newPassword }) {
  const res = await fetch(`${BASE_URL}/reset-password-link`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || "Error al restablecer contraseña");
  return data;
}
