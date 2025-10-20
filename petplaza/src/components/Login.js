// src/components/Login.js
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import "../CSS/Login.css";
import logo from "../assets/logo.jpeg";
import {
  loginApi,
  verifyOtpApi,
  sendRecoveryLinkApi,
  resetPasswordByLinkApi,
} from "../apis/authApi";
import { Eye, EyeOff, CheckCircle2, MailCheck, ShieldCheck } from "lucide-react";

/* === Expresiones para validar usuario/correo/teléfono === */
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const phoneRegex = /^\+?\d{8,15}$/;
const usernameRegex = /^[a-zA-Z0-9_.-]{3,}$/;

const Login = ({ onSubmit }) => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState("LOGIN"); // LOGIN | OTP | RECOVER | SENT | RESET | SUCCESS
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [blockedUntil, setBlockedUntil] = useState(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [countdown, setCountdown] = useState(0);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  // Detectar si hay token en la URL -> cambiar a vista RESET
  useEffect(() => {
    if (token) setStep("RESET");
  }, [token]);

  /* ==========================
     VALIDACIONES
     ========================== */
  const validateIdentifier = () => {
    if (!identifier.trim()) {
      setError("Debes ingresar tu usuario, correo o teléfono.");
      return false;
    }
    const isEmail = emailRegex.test(identifier);
    const isPhone = phoneRegex.test(identifier);
    const isUsername = usernameRegex.test(identifier);
    if (!isEmail && !isPhone && !isUsername) {
      setError("Formato inválido. Usa usuario, correo o teléfono válido.");
      return false;
    }
    return true;
  };

  const validateLoginFields = () => {
    if (!validateIdentifier()) return false;
    if (!password.trim()) {
      setError("La contraseña es obligatoria.");
      return false;
    }
    return true;
  };

  /* ==========================
     BLOQUEO POR INTENTOS
     ========================== */
  useEffect(() => {
    if (blockedUntil) {
      const interval = setInterval(() => {
        const remaining = Math.max(
          0,
          Math.floor((blockedUntil - Date.now()) / 1000)
        );
        setCountdown(remaining);
        if (remaining <= 0) {
          setBlockedUntil(null);
          setFailedAttempts(0);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [blockedUntil]);

  const handleFailedLogin = () => {
    const next = failedAttempts + 1;
    setFailedAttempts(next);
    if (next >= 7) {
      const blockTime = Date.now() + 60 * 60 * 1000;
      setBlockedUntil(blockTime);
      setError("Demasiados intentos fallidos. Intenta de nuevo en 1 hora.");
    } else {
      setError(`Credenciales incorrectas. Intento ${next}/7.`);
    }
  };

  /* ==========================
     LOGIN PRINCIPAL
     ========================== */
  const handleLogin = async (e) => {
    e.preventDefault();
    if (blockedUntil && Date.now() < blockedUntil) {
      setError("Cuenta bloqueada temporalmente. Espera unos minutos.");
      return;
    }

    setError("");
    setInfo("");
    if (!validateLoginFields()) return;

    try {
      setLoading(true);
      const data = await loginApi({ identifier, password });
      if (data.step === "2FA_REQUIRED") {
        setStep("OTP");
        setInfo("Se ha enviado un código OTP a tu correo.");
      } else {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        if (onSubmit) onSubmit(data); // ✅ mostrará el Dashboard
      }
    } catch {
      handleFailedLogin();
    } finally {
      setLoading(false);
    }
  };

  /* ==========================
     VERIFICAR OTP (2FA)
     ========================== */
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.length !== 4) {
      setError("Ingresa el código OTP de 4 dígitos.");
      return;
    }

    try {
      setLoading(true);
      const data = await verifyOtpApi({ identifier, otpCode });

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);

      // ✅ Envía los datos al App.js para abrir el Dashboard
      if (onSubmit) onSubmit(data);
    } catch (err) {
      setError(err.message || "Código OTP incorrecto.");
    } finally {
      setLoading(false);
    }
  };

  /* ==========================
     REENVIAR OTP
     ========================== */
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    try {
      setResendCooldown(60);
      setInfo("Nuevo código enviado a tu correo.");
      await loginApi({ identifier, password }); // reutiliza endpoint
    } catch {
      setError("No se pudo reenviar el código. Intenta más tarde.");
    }
  };

  // Cooldown del botón de reenviar
  useEffect(() => {
    if (resendCooldown > 0) {
      const interval = setInterval(
        () => setResendCooldown((prev) => Math.max(prev - 1, 0)),
        1000
      );
      return () => clearInterval(interval);
    }
  }, [resendCooldown]);

  /* ==========================
     ENVIAR ENLACE DE RECUPERACIÓN
     ========================== */
  const handleSendRecoveryLink = async (e) => {
    e.preventDefault();
    if (!validateIdentifier()) return;
    setError("");
    setInfo("");

    try {
      setLoading(true);
      const data = await sendRecoveryLinkApi({ identifier });
      setInfo(data.mensaje || "Hemos enviado un enlace a tu correo.");
      setStep("SENT");
    } catch (err) {
      setError(
        err.message || "No se pudo enviar el enlace. Verifica tus datos."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ==========================
     RESTABLECER CONTRASEÑA
     ========================== */
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!newPassword || !confirmPassword)
      return setError("Todos los campos son obligatorios.");
    if (newPassword !== confirmPassword)
      return setError("Las contraseñas no coinciden.");
    if (newPassword.length < 8)
      return setError("Debe tener al menos 8 caracteres.");

    try {
      setLoading(true);
      await resetPasswordByLinkApi({ token, newPassword });
      setStep("SUCCESS");
    } catch (err) {
      setError(err.message || "Error al restablecer contraseña.");
    } finally {
      setLoading(false);
    }
  };

  /* ==========================
     INTERFAZ (RENDER)
     ========================== */
  return (
    <div className="login-wrapper">
      <div className="login-bg">
        <div className="login-card">
          <div className="login-logo-wrapper">
            <img
              src={logo}
              alt="Logo PetPlaza"
              className={`login-logo ${
                step === "SUCCESS" || step === "OTP" ? "spin-logo" : ""
              }`}
            />
          </div>
          <h1 className="login-title">PETPLAZA</h1>
          <p className="login-subtitle">HOSPIVET</p>

          {/* === ÉXITO === */}
          {step === "SUCCESS" && (
            <div className="login-form" style={{ textAlign: "center" }}>
              <CheckCircle2
                size={64}
                color="#10b981"
                style={{ margin: "0 auto 1rem" }}
              />
              <p className="login-success-text">
                ¡Operación completada con éxito!
              </p>
              <p style={{ color: "#475569" }}>Puedes iniciar sesión ahora.</p>
              <button
                className="login-button"
                onClick={() => setStep("LOGIN")}
              >
                Volver al inicio
              </button>
            </div>
          )}

          {/* === ENLACE ENVIADO === */}
          {step === "SENT" && (
            <div className="login-form" style={{ textAlign: "center" }}>
              <MailCheck
                size={56}
                color="#10b981"
                style={{ margin: "0 auto 1rem" }}
              />
              <p
                style={{
                  color: "#16a34a",
                  fontWeight: "600",
                  marginBottom: "0.5rem",
                }}
              >
                Hemos enviado un enlace seguro a tu correo.
              </p>
              <p style={{ color: "#334155", fontSize: "0.95rem" }}>
                Revisa tu bandeja de entrada y sigue las instrucciones para
                restablecer tu contraseña.
              </p>
              <button
                type="button"
                className="login-button"
                onClick={() => setStep("LOGIN")}
              >
                Volver al inicio
              </button>
            </div>
          )}

          {/* === OTP === */}
          {step === "OTP" && (
            <form onSubmit={handleVerifyOtp} className="login-form">
              <div style={{ textAlign: "center" }}>
                <ShieldCheck
                  size={58}
                  color="#2563eb"
                  style={{ margin: "0 auto 1rem" }}
                />
                <p style={{ fontWeight: "600", marginBottom: "0.5rem" }}>
                  Verificación en dos pasos
                </p>
                <p style={{ color: "#475569", marginBottom: "1rem" }}>
                  Ingresa el código de <strong>4 dígitos</strong> enviado a tu
                  correo.
                </p>
              </div>

              <input
                type="text"
                className="login-input"
                value={otpCode}
                onChange={(e) =>
                  setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                placeholder="Código OTP (4 dígitos)"
                maxLength={4}
                required
              />

              {error && <div className="login-error">{error}</div>}
              {info && <div className="login-success">{info}</div>}

              <button type="submit" className="login-button" disabled={loading}>
                {loading ? "Verificando..." : "Verificar Código"}
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                className={`btn-link elegant-link ${
                  resendCooldown > 0 ? "disabled" : ""
                }`}
                disabled={resendCooldown > 0 || loading}
              >
                {resendCooldown > 0
                  ? `Reenviar código en ${resendCooldown}s`
                  : "Reenviar código"}
              </button>

              <button
                type="button"
                className="btn-link elegant-link"
                onClick={() => setStep("LOGIN")}
              >
                ← Volver al inicio
              </button>
            </form>
          )}

          {/* === LOGIN === */}
          {step === "LOGIN" && (
            <form onSubmit={handleLogin} className="login-form">
              <label className="login-label">
                Usuario / Correo / Teléfono
                <input
                  type="text"
                  className="login-input"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Ej: admin, admin@correo.com o +50488586201"
                  required
                />
              </label>

              <label className="login-label">
                Contraseña
                <div className="password-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="login-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="********"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="pw-toggle-btn"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>

              {error && <div className="login-error">{error}</div>}
              {info && <div className="login-success">{info}</div>}

              <button type="submit" className="login-button" disabled={loading}>
                {loading ? "Iniciando..." : "Iniciar Sesión"}
              </button>

              <div className="login-footer">
                <button
                  type="button"
                  className="btn-link elegant-link"
                  onClick={() => setStep("RECOVER")}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </form>
          )}

          {/* === RECUPERAR CONTRASEÑA === */}
          {step === "RECOVER" && (
            <form onSubmit={handleSendRecoveryLink} className="login-form">
              <p className="login-desc">
                Restablece tu contraseña por correo electrónico.
              </p>
              <label className="login-label">
                Usuario / Correo / Teléfono
                <input
                  type="text"
                  className="login-input"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Ej: usuario, correo o +50488586201"
                  required
                />
              </label>
              {error && <div className="login-error">{error}</div>}
              {info && <div className="login-success">{info}</div>}
              <button type="submit" className="login-button" disabled={loading}>
                {loading ? "Enviando..." : "Enviar enlace"}
              </button>
              <button
                type="button"
                className="btn-link elegant-link"
                onClick={() => setStep("LOGIN")}
              >
                ← Volver al inicio
              </button>
            </form>
          )}

          {/* === RESTABLECER CONTRASEÑA === */}
          {step === "RESET" && (
            <form onSubmit={handleResetPassword} className="login-form">
              <p className="login-desc">Ingresa tu nueva contraseña:</p>

              <label className="login-label">
                Nueva Contraseña
                <div className="password-wrapper">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    className="login-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="********"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="pw-toggle-btn"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>

              <label className="login-label">
                Confirmar Contraseña
                <div className="password-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="login-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="********"
                    required
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    className="pw-toggle-btn"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </label>

              {error && <div className="login-error">{error}</div>}
              {info && <div className="login-success">{info}</div>}

              <button type="submit" className="login-button" disabled={loading}>
                {loading ? "Guardando..." : "Guardar Contraseña"}
              </button>
              <button
                type="button"
                className="btn-link elegant-link"
                onClick={() => setStep("LOGIN")}
              >
                ← Volver al inicio
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
