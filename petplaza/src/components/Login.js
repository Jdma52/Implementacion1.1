// src/components/Login.js
import React, { useState } from "react";
import "../CSS/Login.css";
import logo from "../assets/logo.jpeg";
import { loginApi, verifyOtpApi } from "../apis/authApi";

function Login({ onSubmit }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState("LOGIN");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const data = await loginApi({ username, password });
      if (data.step === "2FA_REQUIRED") {
        setStep("OTP");
      } else {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        if (onSubmit) onSubmit(data);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const data = await verifyOtpApi({ username, otpCode });
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      if (onSubmit) onSubmit(data);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-bg">
        <div className="login-card">
          <div className="login-logo-wrapper">
            <img src={logo} alt="Logo PetPlaza" className="login-logo" />
          </div>
          <h1 className="login-title">PETPLAZA</h1>
          <p className="login-subtitle">HOSPIVET</p>

          {step === "LOGIN" && (
            <form onSubmit={handleLogin} className="login-form">
              <label className="login-label">
                Usuario
                <input
                  type="text"
                  className="login-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </label>
              <label className="login-label">
                Contraseña
                <input
                  type="password"
                  className="login-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>
              {error && <div className="login-error">{error}</div>}
              <button type="submit" className="login-button">
                Iniciar Sesión
              </button>
            </form>
          )}

          {step === "OTP" && (
            <form onSubmit={handleVerifyOtp} className="login-form">
              <label className="login-label">
                Código OTP
                <input
                  type="text"
                  className="login-input"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  required
                />
              </label>
              {error && <div className="login-error">{error}</div>}
              <button type="submit" className="login-button">
                Validar Código
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;