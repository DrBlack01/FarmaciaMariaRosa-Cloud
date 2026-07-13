// ../assets/js/admin-estadisticas.js
document.addEventListener('DOMContentLoaded', () => {
  const API_BASE = (window.API_BASE_URL || 'http://127.0.0.1:8081') + '/api';
  const btnReload = document.getElementById('btnReloadStats');
  const lastUpdatedEl = document.getElementById('lastUpdated');

  // ✅ OBTENER TOKEN JWT
  const token = localStorage.getItem('jwtToken');
  const user = JSON.parse(localStorage.getItem('loggedInUser') || 'null');
  
  console.log('🔐 Token JWT para estadísticas:', token ? '✅ Presente' : '❌ Faltante');
  console.log('👤 Usuario:', user?.email, '| Rol:', user?.role);

  // Verificar autenticación y permisos
  if (!user || !token) {
    console.error('❌ Usuario no autenticado');
    window.location.href = "../index.html";
    return;
  }

  // Canvas elements
  const ctxProducts = document.getElementById('chartProductsByCategory').getContext('2d');
  const ctxStock = document.getElementById('chartStockByCategory').getContext('2d');
  const ctxRes = document.getElementById('chartReservationsByDay').getContext('2d');
  const ctxClients = document.getElementById('chartTopClients').getContext('2d');

  // Chart instances to destroy before re-creating
  const charts = {
    products: null,
    stock: null,
    reservations: null,
    clients: null
  };

  btnReload.addEventListener('click', loadAndRender);

  // initial load
  loadAndRender();

  async function loadAndRender() {
    try {
      btnReload.disabled = true;
      btnReload.textContent = 'Cargando...';

      // ✅ HEADERS CON TOKEN JWT
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      console.log('📦 Iniciando carga de datos...');

      // parallel fetches with authentication
      const [catsRes, prodsRes, reservasRes, clientesRes] = await Promise.all([
        fetch(`${API_BASE}/categorias`, { headers }),
        fetch(`${API_BASE}/productos`, { headers }),
        fetch(`${API_BASE}/reservas`, { headers }),
        fetch(`${API_BASE}/clientes`, { headers })
      ]);

      // ✅ DEBUG DETALLADO DE RESPUESTAS
      console.log('📡 Respuestas recibidas:', {
        categorias: { status: catsRes.status, ok: catsRes.ok },
        productos: { status: prodsRes.status, ok: prodsRes.ok },
        reservas: { status: reservasRes.status, ok: reservasRes.ok },
        clientes: { status: clientesRes.status, ok: clientesRes.ok }
      });

      // ✅ MEJOR MANEJO DE ERRORES
      if (!catsRes.ok) {
        const errorText = await catsRes.text();
        throw new Error(`Error categorías (${catsRes.status}): ${errorText}`);
      }
      if (!prodsRes.ok) {
        const errorText = await prodsRes.text();
        throw new Error(`Error productos (${prodsRes.status}): ${errorText}`);
      }
      if (!reservasRes.ok) {
        const errorText = await reservasRes.text();
        throw new Error(`Error reservas (${reservasRes.status}): ${errorText}`);
      }
      if (!clientesRes.ok) {
        const errorText = await clientesRes.text();
        throw new Error(`Error clientes (${clientesRes.status}): ${errorText}`);
      }

      // ✅ PARSEAR RESPUESTAS Y VERIFICAR ESTRUCTURA
      const categorias = await catsRes.json();
      const productosData = await prodsRes.json();
      const reservas = await reservasRes.json();
      const clientes = await clientesRes.json();

      // ✅ DEBUG DE ESTRUCTURA DE DATOS
      console.log('🔍 Estructura de datos recibidos:', {
        categorias: Array.isArray(categorias) ? `Array[${categorias.length}]` : typeof categorias,
        productos: Array.isArray(productosData) ? `Array[${productosData.length}]` : typeof productosData,
        reservas: Array.isArray(reservas) ? `Array[${reservas.length}]` : typeof reservas,
        clientes: Array.isArray(clientes) ? `Array[${clientes.length}]` : typeof clientes
      });

      console.log('🔍 Muestra de datos productos:', productosData);

      // ✅ NORMALIZAR DATOS - MANEJAR DIFERENTES ESTRUCTURAS DE RESPUESTA
      const productos = normalizarProductos(productosData);
      const categoriasNormalizadas = normalizarCategorias(categorias);

      console.log('📊 Datos normalizados:', {
        categorias: categoriasNormalizadas.length,
        productos: productos.length,
        reservas: reservas.length,
        clientes: clientes.length
      });

      // ✅ VERIFICAR QUE TENEMOS DATOS VÁLIDOS
      if (!Array.isArray(productos) || productos.length === 0) {
        console.warn('⚠️ No hay productos para mostrar');
      }

      if (!Array.isArray(categoriasNormalizadas) || categoriasNormalizadas.length === 0) {
        console.warn('⚠️ No hay categorías para mostrar');
      }

      renderProductsByCategory(categoriasNormalizadas, productos);
      renderStockByCategory(categoriasNormalizadas, productos);
      renderReservationsByDay(reservas);
      renderTopClientsBySpending(reservas, clientes);

      lastUpdatedEl.textContent = new Date().toLocaleString();
      console.log('✅ Estadísticas cargadas exitosamente');
      
    } catch (err) {
      console.error('❌ Error cargando estadísticas:', err);
      
      // ✅ MOSTRAR ERROR EN INTERFAZ
      mostrarErrorEstadisticas(err.message);
      
    } finally {
      btnReload.disabled = false;
      btnReload.textContent = 'Recargar estadísticas';
    }
  }

  // ✅ FUNCIÓN PARA NORMALIZAR PRODUCTOS
  function normalizarProductos(productosData) {
    console.log('🔄 Normalizando productos:', productosData);
    
    // Si es un array, devolver directamente
    if (Array.isArray(productosData)) {
      return productosData;
    }
    
    // Si es un objeto con propiedad 'productos'
    if (productosData && typeof productosData === 'object' && Array.isArray(productosData.productos)) {
      return productosData.productos;
    }
    
    // Si es un objeto con propiedad 'data'
    if (productosData && typeof productosData === 'object' && Array.isArray(productosData.data)) {
      return productosData.data;
    }
    
    // Si es un objeto con propiedad 'content' (paginación)
    if (productosData && typeof productosData === 'object' && Array.isArray(productosData.content)) {
      return productosData.content;
    }
    
    // Si no reconocemos la estructura, devolver array vacío
    console.warn('❌ Estructura de productos no reconocida:', productosData);
    return [];
  }

  // ✅ FUNCIÓN PARA NORMALIZAR CATEGORÍAS
  function normalizarCategorias(categoriasData) {
    console.log('🔄 Normalizando categorías:', categoriasData);
    
    // Si es un array, devolver directamente
    if (Array.isArray(categoriasData)) {
      return categoriasData;
    }
    
    // Si es un objeto con propiedad 'categorias'
    if (categoriasData && typeof categoriasData === 'object' && Array.isArray(categoriasData.categorias)) {
      return categoriasData.categorias;
    }
    
    // Si es un objeto con propiedad 'data'
    if (categoriasData && typeof categoriasData === 'object' && Array.isArray(categoriasData.data)) {
      return categoriasData.data;
    }
    
    // Si no reconocemos la estructura, devolver array vacío
    console.warn('❌ Estructura de categorías no reconocida:', categoriasData);
    return [];
  }

  // ✅ FUNCIÓN PARA MOSTRAR ERRORES EN INTERFAZ
  function mostrarErrorEstadisticas(mensaje) {
    const containers = [
      'chartProductsByCategory',
      'chartStockByCategory', 
      'chartReservationsByDay',
      'chartTopClients'
    ];
    
    containers.forEach(containerId => {
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = `
          <div class="text-center text-danger p-4">
            <i class="bi bi-exclamation-triangle display-4"></i>
            <p class="mt-2">Error al cargar datos</p>
            <small class="text-muted">${mensaje}</small>
          </div>
        `;
      }
    });
  }

  // ---------- Helpers y renderers ----------

  function destroyChart(ref) {
    if (ref && typeof ref.destroy === 'function') ref.destroy();
  }

  function randomPalette(n) {
    const base = [
      '#42a5f5', '#66bb6a', '#ff7043', '#ab47bc', '#ffa726', '#26a69a',
      '#ef5350', '#7e57c2', '#8d6e63', '#29b6f6', '#9ccc65', '#f06292'
    ];
    const out = [];
    for (let i = 0; i < n; i++) out.push(base[i % base.length]);
    return out;
  }

  function renderProductsByCategory(categorias, productos) {
    console.log('📊 Renderizando productos por categoría:', { categorias, productos });
    
    // Si no hay productos, mostrar mensaje
    if (!Array.isArray(productos) || productos.length === 0) {
      console.warn('⚠️ No hay productos para renderizar');
      mostrarMensajeSinDatos('chartProductsByCategory', 'No hay productos disponibles');
      return;
    }

    // count of products per category
    const map = {};
    categorias.forEach(c => { 
      if (c && c.nombre) {
        map[c.nombre] = 0; 
      }
    });
    
    productos.forEach(p => {
      if (!p) return;
      
      const catName = p.categoriaNombre || 
                     (categorias.find(c => c && c.idCategoria === p.idCategoria)?.nombre) || 
                     'Sin categoría';
      map[catName] = (map[catName] || 0) + 1;
    });

    const labels = Object.keys(map);
    const data = Object.values(map);

    // Si no hay datos, mostrar mensaje
    if (labels.length === 0 || data.every(val => val === 0)) {
      mostrarMensajeSinDatos('chartProductsByCategory', 'No hay datos para mostrar');
      return;
    }

    destroyChart(charts.products);
    charts.products = new Chart(ctxProducts, {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: randomPalette(labels.length)
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: { enabled: true },
          title: {
            display: true,
            text: 'Productos por Categoría'
          }
        }
      }
    });
  }

  function renderStockByCategory(categorias, productos) {
    console.log('📊 Renderizando stock por categoría:', { categorias, productos });
    
    // Si no hay productos, mostrar mensaje
    if (!Array.isArray(productos) || productos.length === 0) {
      console.warn('⚠️ No hay productos para renderizar stock');
      mostrarMensajeSinDatos('chartStockByCategory', 'No hay productos disponibles');
      return;
    }

    // sum stockActual grouped by category
    const stockMap = {};
    categorias.forEach(c => { 
      if (c && c.nombre) {
        stockMap[c.nombre] = 0; 
      }
    });
    
    productos.forEach(p => {
      if (!p) return;
      
      const catName = p.categoriaNombre || 
                     (categorias.find(c => c && c.idCategoria === p.idCategoria)?.nombre) || 
                     'Sin categoría';
      const stock = Number(p.stockActual || 0);
      stockMap[catName] = (stockMap[catName] || 0) + stock;
    });

    const labels = Object.keys(stockMap);
    const data = Object.values(stockMap);

    // Si no hay datos, mostrar mensaje
    if (labels.length === 0 || data.every(val => val === 0)) {
      mostrarMensajeSinDatos('chartStockByCategory', 'No hay datos de stock para mostrar');
      return;
    }

    destroyChart(charts.stock);
    charts.stock = new Chart(ctxStock, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Stock total',
          data,
          backgroundColor: randomPalette(labels.length),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: { 
          legend: { display: false }, 
          tooltip: { enabled: true },
          title: {
            display: true,
            text: 'Stock por Categoría'
          }
        },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
      }
    });
  }

  // ✅ FUNCIÓN PARA MOSTRAR MENSAJE SIN DATOS
  function mostrarMensajeSinDatos(containerId, mensaje) {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `
        <div class="text-center text-muted p-4">
          <i class="bi bi-info-circle display-4"></i>
          <p class="mt-2">${mensaje}</p>
        </div>
      `;
    }
  }

  // ... (las funciones renderReservationsByDay y renderTopClientsBySpending se mantienen igual)
  function renderReservationsByDay(reservas) {
    if (!Array.isArray(reservas) || reservas.length === 0) {
      mostrarMensajeSinDatos('chartReservationsByDay', 'No hay reservas disponibles');
      return;
    }

    // group reservations by date (day)
    const map = {};
    reservas.forEach(r => {
      if (!r) return;
      const d = r.fechaReserva ? new Date(r.fechaReserva) : null;
      const key = d ? d.toISOString().slice(0, 10) : 'Sin fecha';
      map[key] = (map[key] || 0) + 1;
    });

    const keys = Object.keys(map).filter(k => k !== 'Sin fecha').sort();
    if (map['Sin fecha']) keys.push('Sin fecha');
    const data = keys.map(k => map[k]);

    destroyChart(charts.reservations);
    charts.reservations = new Chart(ctxRes, {
      type: 'line',
      data: {
        labels: keys,
        datasets: [{
          label: 'Reservas por día',
          data,
          tension: 0.25,
          fill: true,
          backgroundColor: 'rgba(66,165,245,0.12)',
          borderColor: '#42a5f5',
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        plugins: { 
          legend: { display: false }, 
          tooltip: { enabled: true },
          title: {
            display: true,
            text: 'Reservas por Día'
          }
        },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
      }
    });
  }

  function renderTopClientsBySpending(reservas, clientes) {
    if (!Array.isArray(reservas) || reservas.length === 0) {
      mostrarMensajeSinDatos('chartTopClients', 'No hay reservas disponibles');
      return;
    }

    // Calculate total spent per cliente
    const spendMap = {};
    reservas.forEach(r => {
      if (!r) return;
      const cliente = r.cliente;
      const id = cliente?.idCliente ?? cliente?.dni ?? 'Sin cliente';
      spendMap[id] = (spendMap[id] || 0) + Number(r.total || 0);
    });

    // Map ids to names using clientes array
    const result = Object.keys(spendMap).map(id => {
      const cli = clientes.find(c => String(c.idCliente) === String(id));
      return {
        id,
        name: cli ? `${cli.nombre}` : String(id),
        total: spendMap[id]
      };
    });

    result.sort((a, b) => b.total - a.total);
    const top = result.slice(0, 10);

    const labels = top.map(r => r.name);
    const data = top.map(r => Number(r.total.toFixed(2)));

    destroyChart(charts.clients);
    charts.clients = new Chart(ctxClients, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Gasto total (S/.)',
          data,
          backgroundColor: randomPalette(labels.length)
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: { 
          legend: { display: false }, 
          tooltip: { enabled: true },
          title: {
            display: true,
            text: 'Top Clientes por Gasto'
          }
        },
        scales: { x: { beginAtZero: true, ticks: { precision: 0 } } }
      }
    });
  }
});