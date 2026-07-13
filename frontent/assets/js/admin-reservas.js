document.addEventListener("DOMContentLoaded", () => {
  // Verificar autenticación
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  const token = localStorage.getItem("jwtToken"); // ✅ OBTENER TOKEN REAL
  
  console.log('🔐 Token JWT:', token ? '✅ Presente' : '❌ Faltante');
  
  if (!user || !token) {
    window.location.href = "../index.html";
    return;
  }

  // Referencias a elementos DOM
  const reservasTable = document.getElementById("reservasTable");
  const searchClienteInput = document.getElementById("searchClienteInput");
  const statusFilter = document.getElementById("statusFilter");
  const btnCompletarReserva = document.getElementById("btnCompletarReserva");
  const btnCancelarReserva = document.getElementById("btnCancelarReserva");

  let reservas = [];
  let reservaActual = null;

  // Cargar reservas al iniciar
  cargarReservas();

  // Event Listeners
  searchClienteInput.addEventListener("input", filtrarReservas);
  statusFilter.addEventListener("change", filtrarReservas);
  btnCompletarReserva.addEventListener("click", completarReserva);
  btnCancelarReserva.addEventListener("click", cancelarReserva);

  // Funciones
  async function cargarReservas() {
    try {
      console.log('📦 Cargando reservas desde: http://127.0.0.1:8081/api/reservas');
      
      const response = await fetch((window.API_BASE_URL || "http://127.0.0.1:8081") + "/api/reservas", {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // ✅ ENVIAR TOKEN REAL
        }
      });

      console.log('📡 Respuesta del servidor:', response.status, response.statusText);

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Acceso denegado. No tienes permisos para ver reservas.');
        } else if (response.status === 401) {
          throw new Error('Token inválido o expirado. Por favor inicia sesión nuevamente.');
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Reservas cargadas:', data);

      // Procesar las reservas
      reservas = await Promise.all(
        data.map(async (reserva) => {
          try {
            let cliente = reserva.cliente;
            if (!cliente && reserva.idCliente) {
              const clienteResponse = await fetch(
                `${window.API_BASE_URL || "http://127.0.0.1:8081"}/api/clientes/${reserva.idCliente}`,
                {
                  headers: {
                    'Authorization': `Bearer ${token}` // ✅ TOKEN REAL
                  }
                }
              );
              if (!clienteResponse.ok)
                throw new Error(`Error al cargar cliente ${reserva.idCliente}`);
              cliente = await clienteResponse.json();
            }

            const detalles = await Promise.all(
              reserva.detalles.map(async (detalle) => {
                let producto = detalle.producto;
                if (!producto && detalle.idProducto) {
                  const productoResponse = await fetch(
                    `${window.API_BASE_URL || "http://127.0.0.1:8081"}/api/productos/${detalle.idProducto}`,
                    {
                      headers: {
                        'Authorization': `Bearer ${token}` // ✅ TOKEN REAL
                      }
                    }
                  );
                  if (!productoResponse.ok)
                    throw new Error(`Error al cargar producto ${detalle.idProducto}`);
                  producto = await productoResponse.json();
                }
                return { ...detalle, producto };
              })
            );

            return { ...reserva, cliente, detalles };
          } catch (error) {
            console.error(`Error al cargar datos para reserva ${reserva.idReserva}:`, error);
            return {
              ...reserva,
              cliente: reserva.cliente || {
                nombre: "Desconocido",
                email: "",
                telefono: "",
              },
              detalles: reserva.detalles.map((d) => ({
                ...d,
                producto: d.producto || { nombre: "Producto desconocido" },
              })),
            };
          }
        })
      );

      mostrarReservas(reservas);
      
    } catch (error) {
      console.error("❌ Error cargando reservas:", error);
      mostrarErrorEnTabla(error.message);
    }
  }

  function mostrarErrorEnTabla(mensaje) {
    const tbody = reservasTable.querySelector("tbody");
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center text-danger py-4">
            <i class="bi bi-exclamation-triangle display-4"></i>
            <h5 class="mt-2">Error al cargar reservas</h5>
            <p class="text-muted">${mensaje}</p>
            <button class="btn btn-primary mt-2" onclick="location.reload()">
              <i class="bi bi-arrow-clockwise"></i> Reintentar
            </button>
          </td>
        </tr>
      `;
    }
  }

  function mostrarReservas(reservasArray) {
    const tbody = reservasTable.querySelector("tbody");
    tbody.innerHTML = "";

    if (!reservasArray || reservasArray.length === 0) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td colspan="7" class="text-center py-4">
                <div class="d-flex flex-column align-items-center">
                    <i class="bi bi-inbox text-muted" style="font-size: 3rem;"></i>
                    <p class="h5 mt-3 mb-0 text-muted">No hay reservas disponibles</p>
                    <p class="text-muted">Las reservas realizadas por los clientes aparecerán aquí</p>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
        return;
    }

    // Ordenar reservas: primero por estado (pendiente > completada > cancelada), luego por fecha más reciente
    const reservasOrdenadas = [...reservasArray].sort((a, b) => {
        const ordenEstados = {
            'pendiente': 1,
            'completada': 2, 
            'cancelada': 3
        };
        
        const estadoA = normalizeEstado(a.estado);
        const estadoB = normalizeEstado(b.estado);
        
        if (ordenEstados[estadoA] !== ordenEstados[estadoB]) {
            return ordenEstados[estadoA] - ordenEstados[estadoB];
        }
        
        // Si tienen el mismo estado, ordenar por fecha más reciente primero
        const fechaA = new Date(a.fechaReserva);
        const fechaB = new Date(b.fechaReserva);
        return fechaB - fechaA;
    });

    reservasOrdenadas.forEach((reserva) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${reserva.numeroReserva || reserva.idReserva}</td>
            <td>${reserva.cliente.nombre}</td>
            <td>${new Date(reserva.fechaReserva).toLocaleString()}</td>
            <td>
                <span class="badge bg-${getEstadoColor(reserva.estado)}">${normalizeEstado(reserva.estado)}</span>
            </td>
            <td>S/ ${reserva.total.toFixed(2)}</td>
            <td>${reserva.detalles.length} productos</td>
            <td>
                <button class="btn btn-sm btn-info" onclick="verDetalles(${reserva.idReserva})">
                    <i class="bi bi-eye"></i> Ver
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
  }

  function normalizeEstado(estado) {
    switch (estado.toUpperCase()) {
      case "PENDIENTE":
        return "pendiente";
      case "ENTREGADA":
        return "completada";
      case "CANCELADA":
        return "cancelada";
      default:
        return estado.toLowerCase();
    }
  }

  function getEstadoColor(estado) {
    switch (normalizeEstado(estado)) {
      case "pendiente":
        return "warning";
      case "completada":
        return "success";
      case "cancelada":
        return "danger";
      default:
        return "secondary";
    }
  }

  window.verDetalles = (reservaId) => {
    reservaActual = reservas.find((r) => r.idReserva === reservaId);
    if (!reservaActual) return;

    // Actualizar información en el modal
    document.getElementById("modalClienteNombre").textContent = `Cliente: ${reservaActual.cliente.nombre}`;
    document.getElementById("modalClienteEmail").textContent = `Email: ${reservaActual.cliente.email || "No especificado"}`;
    document.getElementById("modalClienteTelefono").textContent = `Teléfono: ${reservaActual.cliente.telefono || "No especificado"}`;

    document.getElementById("modalReservaId").textContent = `ID Reserva: ${reservaActual.numeroReserva || reservaActual.idReserva}`;
    document.getElementById("modalReservaEstado").textContent = `Estado: ${normalizeEstado(reservaActual.estado)}`;

    let fechaText = `Fecha: ${new Date(reservaActual.fechaReserva).toLocaleString()}`;
    if (reservaActual.fechaLimiteRetiro) {
      fechaText += `\nLímite de retiro: ${new Date(reservaActual.fechaLimiteRetiro).toLocaleString()}`;
    }
    if (reservaActual.fechaEntrega) {
      fechaText += `\nEntregada: ${new Date(reservaActual.fechaEntrega).toLocaleString()}`;
    }
    document.getElementById("modalReservaFecha").textContent = fechaText;

    // Mostrar productos
    const productosTableBody = document.getElementById("modalProductosTable");
    productosTableBody.innerHTML = "";

    reservaActual.detalles.forEach((detalle) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
                <td>${detalle.producto.nombre}</td>
                <td>${detalle.cantidad}</td>
                <td>S/ ${detalle.precioUnitario.toFixed(2)}</td>
                <td>S/ ${(detalle.cantidad * detalle.precioUnitario).toFixed(2)}</td>
            `;
      productosTableBody.appendChild(tr);
    });

    document.getElementById("modalTotal").textContent = `S/ ${reservaActual.total.toFixed(2)}`;

    // Habilitar/deshabilitar botones según el estado
    btnCompletarReserva.style.display = normalizeEstado(reservaActual.estado) === "pendiente" ? "block" : "none";
    btnCancelarReserva.style.display = normalizeEstado(reservaActual.estado) === "pendiente" ? "block" : "none";

    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById("reservaModal"));
    modal.show();
  };

  function filtrarReservas() {
    const searchTerm = searchClienteInput.value.toLowerCase();
    const statusValue = statusFilter.value.toLowerCase();

    if (!reservas || reservas.length === 0) {
        mostrarReservas([]);
        return;
    }

    const reservasFiltradas = reservas.filter((reserva) => {
        const matchesSearch = reserva.cliente.nombre.toLowerCase().includes(searchTerm);
        const matchesStatus = statusValue === 'all' || normalizeEstado(reserva.estado) === statusValue;
        return matchesSearch && matchesStatus;
    });

    mostrarReservas(reservasFiltradas);
  }

  async function completarReserva() {
    if (!reservaActual) return;

    try {
      console.log("Completando reserva:", reservaActual);

      const payload = {
        idReserva: reservaActual.idReserva,
        numeroReserva: reservaActual.numeroReserva,
        cliente: {
          idCliente: reservaActual.cliente.idCliente,
        },
        estado: "ENTREGADA",
        total: reservaActual.total,
        fechaReserva: reservaActual.fechaReserva,
        fechaLimiteRetiro: reservaActual.fechaLimiteRetiro,
        fechaEntrega: new Date().toISOString(),
        notasCliente: reservaActual.notasCliente || "",
        notasFarmacia: reservaActual.notasFarmacia || "",
        metodoNotificacion: reservaActual.metodoNotificacion || "EMAIL",
        idUsuarioAtencion: null,
        detalles: reservaActual.detalles.map((d) => ({
          idReserva: reservaActual.idReserva,
          producto: {
            idProducto: d.producto.idProducto,
          },
          cantidad: d.cantidad,
          precioUnitario: d.precioUnitario,
          subtotal: d.precioUnitario * d.cantidad,
          disponible: d.disponible !== undefined ? d.disponible : true,
          notas: d.notas || "",
        })),
      };

      console.log("Payload enviado:", payload);

      const response = await fetch(
        `${window.API_BASE_URL || "http://127.0.0.1:8081"}/api/reservas/${reservaActual.idReserva}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}` // ✅ TOKEN REAL
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error del servidor:", errorData);
        throw new Error(errorData.message || "Error al completar la reserva");
      }

      const result = await response.json();
      console.log("Reserva completada:", result);

      alert("Reserva completada exitosamente");
      await cargarReservas();
      bootstrap.Modal.getInstance(document.getElementById("reservaModal")).hide();
    } catch (error) {
      console.error("Error:", error);
      alert("Error al completar la reserva: " + error.message);
    }
  }

  async function cancelarReserva() {
    if (!reservaActual) return;

    if (!confirm("¿Está seguro de que desea cancelar esta reserva?")) {
      return;
    }

    try {
      const payload = {
        idReserva: reservaActual.idReserva,
        numeroReserva: reservaActual.numeroReserva,
        cliente: {
          idCliente: reservaActual.cliente.idCliente,
        },
        estado: "CANCELADA",
        total: reservaActual.total,
        fechaReserva: reservaActual.fechaReserva,
        fechaLimiteRetiro: reservaActual.fechaLimiteRetiro,
        fechaEntrega: reservaActual.fechaEntrega,
        notasCliente: reservaActual.notasCliente || "",
        notasFarmacia: reservaActual.notasFarmacia || "",
        metodoNotificacion: reservaActual.metodoNotificacion || "EMAIL",
        idUsuarioAtencion: null,
        detalles: reservaActual.detalles.map((d) => ({
          idReserva: reservaActual.idReserva,
          producto: {
            idProducto: d.producto.idProducto,
          },
          cantidad: d.cantidad,
          precioUnitario: d.precioUnitario,
          subtotal: d.precioUnitario * d.cantidad,
          disponible: d.disponible !== undefined ? d.disponible : true,
          notas: d.notas || "",
        })),
      };

      console.log("Payload para cancelar:", payload);

      const response = await fetch(
        `${window.API_BASE_URL || "http://127.0.0.1:8081"}/api/reservas/${reservaActual.idReserva}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}` // ✅ TOKEN REAL
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error del servidor:", errorData);
        throw new Error(errorData.message || "Error al cancelar la reserva");
      }

      await response.json();
      alert("Reserva cancelada exitosamente");
      await cargarReservas();
      bootstrap.Modal.getInstance(document.getElementById("reservaModal")).hide();
    } catch (error) {
      console.error("Error:", error);
      alert("Error al cancelar la reserva: " + error.message);
    }
  }
});