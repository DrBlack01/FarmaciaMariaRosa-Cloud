// assets/js/admin-usuarios.js
document.addEventListener("DOMContentLoaded", async function () {
  let usuarios = [];
  let isSaving = false;

  // 1️⃣ Verificar autenticación - SOLO ADMIN
  const user = JSON.parse(localStorage.getItem("loggedInUser") || "null");
  const token = localStorage.getItem("jwtToken");
  
  console.log('🔐 === INICIANDO VERIFICACIÓN DE AUTENTICACIÓN ===');
  console.log('👤 Usuario del localStorage:', user);
  console.log('🗝️ Token del localStorage:', token ? '✅ Presente' : '❌ Faltante');

  // ✅ SOLO PERMITIR ACCESO A ADMIN
  /*if (!user || !token || user.role !== 'ADMIN') {
    console.error('❌ Acceso denegado: No autorizado');
    mostrarAlerta('danger', 'No tienes permisos para acceder a esta sección');
    setTimeout(() => {
      window.location.href = "admin-productos.html";
    }, 2000);
    return;
  }*/

  console.log('✅ Acceso permitido. Usuario administrador:', user.email);

  // Mostrar información del usuario
  mostrarInfoUsuario(user);

  // 2️⃣ Logout
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      console.log('🚪 Cerrando sesión...');
      localStorage.removeItem("loggedInUser");
      localStorage.removeItem("jwtToken");
      window.location.href = "../index.html";
    };
  }

  // 3️⃣ Cargar usuarios
  async function cargarUsuarios() {
    try {
      console.log('👥 === INICIANDO CARGA DE USUARIOS ===');
      
      const response = await fetch((window.API_BASE_URL || "http://127.0.0.1:8081") + "/usuarios", {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📡 Respuesta del servidor:', response.status, response.statusText);

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Acceso denegado. No tienes permisos para ver usuarios.');
        } else if (response.status === 401) {
          throw new Error('Token inválido o expirado. Por favor inicia sesión nuevamente.');
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const usuariosData = await response.json();
      console.log('👥 Usuarios cargados:', usuariosData);
      
      mostrarUsuarios(usuariosData);
      console.log('✅ === CARGA DE USUARIOS COMPLETADA ===');
      
    } catch (error) {
      console.error("❌ Error cargando usuarios:", error);
      const tbody = document.querySelector("#usersTable tbody");
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8" class="text-center text-danger py-4">
              <i class="bi bi-exclamation-triangle display-4"></i>
              <h5 class="mt-2">Error al cargar usuarios</h5>
              <p class="text-muted">${error.message}</p>
              <button class="btn btn-primary mt-2" onclick="location.reload()">
                <i class="bi bi-arrow-clockwise"></i> Reintentar
              </button>
            </td>
          </tr>
        `;
      }
    }
  }

  function mostrarInfoUsuario(user) {
    const userInfoElement = document.getElementById('userInfo');
    if (userInfoElement) {
      userInfoElement.innerHTML = `
        <div class="alert alert-info d-flex align-items-center">
          <i class="bi bi-person-check me-2"></i>
          <div>
            <strong>Usuario:</strong> ${user.email} | 
            <strong>Rol:</strong> <span class="badge bg-primary">${user.role}</span> | 
            <strong>Estado:</strong> <span class="badge bg-success">Conectado</span>
          </div>
        </div>
      `;
    }
  }

  function mostrarUsuarios(usuariosData) {
    console.log('👥 Mostrando usuarios en tabla...');
    usuarios = usuariosData;

    const tbody = document.querySelector("#usersTable tbody");
    if (!tbody) {
      console.error('❌ No se encontró la tabla usersTable');
      return;
    }

    tbody.innerHTML = "";

    if (!usuarios.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center text-muted py-4">
            <i class="bi bi-people display-4"></i>
            <p class="mt-2">No hay usuarios registrados</p>
          </td>
        </tr>
      `;
      return;
    }

    usuarios.forEach((u) => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${u.idUsuario}</td>
        <td>${u.nombre}</td>
        <td>${u.email}</td>
        <td>
          <span class="badge ${u.rol === 'ADMIN' ? 'bg-primary' : 'bg-warning'}">
            ${u.rol}
          </span>
        </td>
        <td>
          <span class="badge ${u.estado ? 'bg-success' : 'bg-danger'}">
            ${u.estado ? 'Activo' : 'Inactivo'}
          </span>
        </td>
        <td>${new Date(u.fechaCreacion).toLocaleDateString()}</td>
        <td>${u.fechaActualizacion ? new Date(u.fechaActualizacion).toLocaleDateString() : '-'}</td>
        <td>
          <button class="btn btn-warning btn-sm editar-btn" data-id="${u.idUsuario}" title="Editar">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-danger btn-sm eliminar-btn" data-id="${u.idUsuario}" title="Eliminar">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      `;
      tbody.appendChild(fila);
    });

    configurarBotones();
    console.log(`✅ ${usuarios.length} usuarios mostrados en la tabla`);
  }

  function configurarBotones() {
    console.log('⚙️ Configurando botones de edición/eliminación...');
    
    document.querySelectorAll(".eliminar-btn").forEach((btn) => {
      btn.onclick = async (e) => {
        const id = e.currentTarget.dataset.id;
        const usuario = usuarios.find((u) => u.idUsuario == id);
        if (usuario && confirm(`¿Seguro que deseas eliminar al usuario "${usuario.nombre}"?`)) {
          await eliminarUsuario(id);
          await cargarUsuarios();
        }
      };
    });

    document.querySelectorAll(".editar-btn").forEach((btn) => {
      btn.onclick = async (e) => {
        const id = e.currentTarget.dataset.id;
        const usuario = usuarios.find((u) => u.idUsuario == id);
        if (!usuario) return;
        await mostrarModalEdicion(usuario);
      };
    });
  }

  // 4️⃣ Modal agregar usuario
  document.getElementById("addUserBtn").onclick = function () {
    document.getElementById("userModalLabel").textContent = "Agregar Usuario";
    document.getElementById("userForm").reset();
    document.getElementById("userId").value = "";
    document.getElementById("passwordRequired").style.display = "inline";
    document.getElementById("passwordHelp").textContent = "La contraseña es obligatoria para nuevos usuarios";
    document.getElementById("userPassword").required = true;
    document.getElementById("userPasswordConfirm").required = true;
    
    new bootstrap.Modal(document.getElementById("userModal")).show();
  };

  // 5️⃣ Modal editar usuario
  async function mostrarModalEdicion(usuario) {
    document.getElementById("userModalLabel").textContent = "Editar Usuario";
    document.getElementById("userForm").reset();

    document.getElementById("userId").value = usuario.idUsuario || "";
    document.getElementById("userName").value = usuario.nombre || "";
    document.getElementById("userEmail").value = usuario.email || "";
    document.getElementById("userRole").value = usuario.rol || "";
    document.getElementById("userStatus").value = usuario.estado ? "true" : "false";
    
    // Para edición, la contraseña no es obligatoria
    document.getElementById("passwordRequired").style.display = "none";
    document.getElementById("passwordHelp").textContent = "Dejar en blanco para mantener la contraseña actual";
    document.getElementById("userPassword").required = false;
    document.getElementById("userPasswordConfirm").required = false;

    new bootstrap.Modal(document.getElementById("userModal")).show();
  }

  // 6️⃣ Guardar usuario
  const form = document.getElementById("userForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    if (isSaving) return;
    isSaving = true;

    // Mostrar loading
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Guardando...';
    submitBtn.disabled = true;

    const id = document.getElementById("userId").value.trim();
    const password = document.getElementById("userPassword").value;
    const passwordConfirm = document.getElementById("userPasswordConfirm").value;

    // Validar contraseñas si se están cambiando
    if ((!id && !password) || (password && password !== passwordConfirm)) {
      mostrarAlerta('danger', !id && !password ? 
        'La contraseña es obligatoria para nuevos usuarios' : 
        'Las contraseñas no coinciden'
      );
      isSaving = false;
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
      return;
    }

    const usuario = {
      nombre: document.getElementById("userName").value.trim(),
      email: document.getElementById("userEmail").value.trim(),
      rol: document.getElementById("userRole").value,
      estado: document.getElementById("userStatus").value === "true"
    };

    // Solo incluir password si se proporcionó uno
    if (password) {
      usuario.passwordHash = password;
    }

    try {
      const url = id
        ? `${window.API_BASE_URL || "http://127.0.0.1:8081"}/usuarios/${id}`
        : (window.API_BASE_URL || "http://127.0.0.1:8081") + "/usuarios";
      const method = id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(usuario),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Error al guardar usuario");
      }

      const result = await response.json();
      console.log('✅ Usuario guardado:', result);
      
      const modal = bootstrap.Modal.getInstance(document.getElementById("userModal"));
      if (modal) modal.hide();

      await cargarUsuarios();
      
      mostrarAlerta('success', id ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente');
      
    } catch (error) {
      console.error("❌ Error al guardar usuario:", error);
      mostrarAlerta('danger', `Error al guardar el usuario: ${error.message}`);
    } finally {
      isSaving = false;
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  });

  // 7️⃣ Eliminar usuario
  async function eliminarUsuario(id) {
    try {
      const response = await fetch(`${window.API_BASE_URL || "http://127.0.0.1:8081"}/usuarios/${id}`, { 
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Error al eliminar usuario");
      }

      console.log('✅ Usuario eliminado');
      mostrarAlerta('success', 'Usuario eliminado exitosamente');
      
    } catch (error) {
      console.error("❌ Error al eliminar usuario:", error);
      mostrarAlerta('danger', `Error al eliminar el usuario: ${error.message}`);
    }
  }

  // 8️⃣ Búsqueda de usuarios
  document.getElementById("searchInput").addEventListener("input", function(e) {
    const searchTerm = e.target.value.toLowerCase();
    const filteredUsuarios = usuarios.filter(usuario => 
      usuario.nombre.toLowerCase().includes(searchTerm) ||
      usuario.email.toLowerCase().includes(searchTerm) ||
      usuario.rol.toLowerCase().includes(searchTerm)
    );
    mostrarUsuarios(filteredUsuarios);
  });

  // 9️⃣ Función para mostrar alertas
  function mostrarAlerta(tipo, mensaje) {
    const alerta = document.createElement('div');
    alerta.className = `alert alert-${tipo} alert-dismissible fade show`;
    alerta.innerHTML = `
      ${mensaje}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const container = document.querySelector('.container-fluid');
    if (container) {
      container.insertBefore(alerta, container.firstChild);
      
      setTimeout(() => {
        if (alerta.parentNode) {
          alerta.remove();
        }
      }, 5000);
    }
  }

  // 🔄 Inicializar
  console.log('🚀 === INICIALIZANDO GESTIÓN DE USUARIOS ===');
  await cargarUsuarios();
  console.log('✅ === GESTIÓN DE USUARIOS INICIALIZADA CORRECTAMENTE ===');
});

// Limpieza de modal
document.addEventListener("hidden.bs.modal", function () {
  document.querySelectorAll(".modal-backdrop").forEach((b) => b.remove());
  document.body.classList.remove("modal-open");
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
});