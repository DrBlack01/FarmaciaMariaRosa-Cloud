import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "./components/AdminSidebar";
import AdminProductos from "./components/AdminProductos";
import AdminCategorias from "./components/AdminCategorias";
import AdminClientes from "./components/AdminClientes";
import AdminLotes from "./components/AdminLotes";
import AdminReservas from "./components/AdminReservas";
import AdminEstadisticas from "./components/AdminEstadisticas";
import AdminMensajes from "./components/AdminMensajes";
import { useAuth } from "../../hooks/useAuth";


const Admin = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("productos");

  // Verificar autenticación
  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <>

      <div className="container-fluid py-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1 className="h3 mb-0">Panel de administración</h1>
          <button
            type="button"
            className="btn btn-outline-danger"
            onClick={() => {
              logout();
              navigate("/", { replace: true });
            }}
          >
            <i className="bi bi-box-arrow-left me-2"></i>
            Salir del sistema
          </button>
        </div>

        {/* Botón para mostrar sidebar en móvil */}
        <button
          className="btn btn-outline-danger d-lg-none mb-3"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#adminSidebarNavMobile"
          aria-controls="adminSidebarNavMobile"
          aria-label="Menú administración"
        >
          <i className="bi bi-list"></i> Menú administración
        </button>

        <div className="admin-sidebar-layout d-flex">
          {/* Sidebar */}
          <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* Contenido principal */}
          <main className="admin-main-content w-100">
            {activeTab === "productos" && <AdminProductos />}
            {activeTab === "categorias" && <AdminCategorias />}
            {activeTab === "clientes" && <AdminClientes />}
            {activeTab === "lotes" && <AdminLotes />}
            {activeTab === "reservas" && <AdminReservas />}
            {activeTab === "estadisticas" && <AdminEstadisticas />}
            {activeTab === "mensajes" && <AdminMensajes />}
          </main>
        </div>
      </div>

    </>
  );
};

export default Admin;
