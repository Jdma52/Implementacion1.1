import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import Users from "./components/Users";
import Dueños from "./components/Dueños";
import Mascotas from "./components/Mascotas";
import Citas from "./components/Citas";
import MedicalRecords from "./components/MedicalRecords"; 
import Facturacion from "./components/Facturacion";
import Inventory from "./components/Inventory"; 
import Reports from "./components/Reports";

function App() {
  const [user, setUser] = useState(null);

  const handleLogin = (data) => {
    setUser({
      full_name: "Administrador PetPlaza",
      role: "admin",
      usuario: data.usuario,
    });
  };

  const handleLogout = () => {
    setUser(null);
  };

  // Layout principal (Navbar + Sidebar + Outlet)
  const Layout = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Navbar user={user} onLogout={handleLogout} />
      <div style={{ display: "flex", flex: 1 }}>
        <Sidebar user={user} />
        <main style={{ marginLeft: "250px", padding: "2rem", flex: 1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );

  return (
    <BrowserRouter>
      {!user ? (
        <Login onSubmit={handleLogin} />
      ) : (
        <Routes>
          {/* Todas las rutas usan el Layout */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="users" element={<Users user={user} />} />
            <Route path="owners" element={<Dueños />} />
            <Route path="pets" element={<Mascotas />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="appointments" element={<Citas />} />
            <Route path="medical-records" element={<MedicalRecords />} />
            <Route path="Facturacion" element={<Facturacion />} />
            <Route path="reports" element={<Reports user={user} />} />
          </Route>
        </Routes>
      )}
    </BrowserRouter>
  );
}

export default App;