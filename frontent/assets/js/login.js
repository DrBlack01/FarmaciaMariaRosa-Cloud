// ===== Login con backend =====
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");

if (loginForm) {
  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    loginError.style.display = "none";

    try {
      const response = await fetch((window.API_BASE_URL || "http://localhost:8081") + "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          passwordHash: password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // ✅ GUARDAR TOKEN Y DATOS CORRECTAMENTE
        localStorage.setItem("jwtToken", data.token); // Clave correcta: "jwtToken"
        localStorage.setItem("loggedInUser", JSON.stringify({
          email: data.email,
          role: data.rol,
          token: data.token
        }));
        
        console.log('✅ Login exitoso:', data);
        console.log('🔐 Token guardado:', data.token);
        console.log('👤 Usuario:', data.email, 'Rol:', data.rol);

        // Redirigir según el rol
        if (data.rol === 'ADMIN') {
          window.location.href = "./admin/admin-productos.html";
        } else {
          window.location.href = "./admin/admin-productos.html";
        }
      } else {
        const errorText = await response.text();
        loginError.textContent = errorText || "Credenciales inválidas";
        loginError.style.display = "block";
      }
    } catch (err) {
      console.error('❌ Error en login:', err);
      loginError.textContent = "No se pudo conectar con el servidor.";
      loginError.style.display = "block";
    }
  });
}

// ===== Registro con backend =====
const registerForm = document.getElementById("registerForm");
const registerError = document.getElementById("registerError");
const registerSuccess = document.getElementById("registerSuccess");

if (registerForm) {
  registerForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;
    const password2 = document.getElementById("registerPassword2").value;

    registerError.style.display = "none";
    registerSuccess.style.display = "none";

    if (password !== password2) {
      registerError.textContent = "Las contraseñas no coinciden.";
      registerError.style.display = "block";
      return;
    }

    try {
      const response = await fetch((window.API_BASE_URL || "http://localhost:8081") + "/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: email.split("@")[0],
          email: email,
          passwordHash: password,
        }),
      });

      if (response.ok) {
        registerSuccess.textContent = "¡Registro exitoso! Ahora puedes iniciar sesión.";
        registerSuccess.style.display = "block";
        registerForm.reset();
      } else {
        const errorText = await response.text();
        registerError.textContent = errorText || "Error en el registro.";
        registerError.style.display = "block";
      }
    } catch (err) {
      registerError.textContent = "No se pudo conectar con el servidor.";
      registerError.style.display = "block";
    }
  });
}