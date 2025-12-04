// ================== VARIABLES GLOBALES ==================
let esAdminGlobal = true;
let idParroquiaUsuario = null;

let reservas = [];
let reservasFiltradas = null;
let reservaEditandoId = null;

const tabla = document.querySelector("#tablaReservas tbody");
const paginacion = document.getElementById("paginacionContainer");
const inputBusqueda = document.getElementById("inputBusqueda");
const sugerenciasContainer = document.createElement("div");

let paginaActual = 1;
const elementosPorPagina = 10;

// ============ DETECCIÓN TIPO DE ADMIN ============
async function detectarTipoAdmin() {
    try {
        const res = await fetch('/api/auth/get_session_data');
        const data = await res.json();
        esAdminGlobal = data.es_admin_global || false;
        idParroquiaUsuario = data.idParroquia || null;
        console.log('Tipo Admin:', esAdminGlobal ? 'Global' : 'Local', 'Parroquia:', idParroquiaUsuario);
        mostrarBadgeAdmin();
    } catch (err) {
        console.error('Error detectando tipo admin:', err);
    }
}

function mostrarBadgeAdmin() {
    const contenedor = document.querySelector('.card-header h4') || document.querySelector('h4');
    if (!contenedor) return;
    
    const badge = document.createElement('span');
    badge.className = `badge ${esAdminGlobal ? 'bg-success' : 'bg-warning text-dark'} ms-2`;
    badge.textContent = esAdminGlobal ? '🌐 Admin Global' : '📍 Admin Local';
    badge.style.fontSize = '0.75rem';
    contenedor.appendChild(badge);
    
    if (!esAdminGlobal) {
        const nota = document.createElement('small');
        nota.className = 'text-muted d-block mt-1';
        nota.textContent = 'Solo puedes ver reservas de tu parroquia';
        contenedor.appendChild(nota);
    }
}

// ================== INICIALIZACIÓN ==================
document.addEventListener("DOMContentLoaded", async () => {
    console.log("Iniciando Admin Reserva...");
    
    // 0. Detectar tipo de admin
    await detectarTipoAdmin();
    
    // 1. Crear modal en el DOM
    crearModalHTML(); 
    
    // 2. Configurar sugerencias de búsqueda
    configurarSugerenciasHTML(); 
    
    // 3. Cargar datos
    cargarReservasAPI(); 

    // 4. Evento buscar
    const btnBuscar = document.getElementById("btn_buscar");
    if(btnBuscar) btnBuscar.addEventListener("click", filtrarReservas);
    
    if(inputBusqueda) inputBusqueda.addEventListener("input", manejarInputBusqueda);
    
    // 5. Evento AGREGAR (El botón +) - CORREGIDO CON NUEVO ID
    const btnAgregar = document.getElementById("btn_agregar_reserva");
    if(btnAgregar) {
        console.log("Botón agregar encontrado");
        // Ocultar para admin local
        if (!esAdminGlobal) {
            btnAgregar.style.display = 'none';
        }
        // Aseguramos que no envíe formulario
        btnAgregar.type = "button"; 
        btnAgregar.addEventListener("click", (e) => {
            console.log("Click en agregar nueva reserva");
            e.preventDefault(); 
            e.stopPropagation();
            agregarReserva(); 
        });
    } else {
        console.error("ERROR CRÍTICO: No se encontró el botón con ID 'btn_agregar_reserva' en el HTML.");
    }
});

// ================== API ==================
async function cargarReservasAPI() {
    try {
        const res = await fetch('/api/reserva/admin/listado');
        const data = await res.json();
        
        if (data.success) {
            reservas = data.datos;
            renderTabla();
        } else {
            console.error("Error en datos:", data.mensaje);
        }
    } catch (error) {
        console.error("Error API:", error);
        tabla.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px; color:red;">Error de conexión con el servidor.</td></tr>';
    }
}

async function guardarCambiosAPI() {
    // Si no hay ID editando, significa que estamos CREANDO
    if(!reservaEditandoId) {
        alert("La creación de reservas desde admin está en construcción. Use la vista de feligrés.");
        return;
    }

    const id = reservaEditandoId;
    const fecha = document.getElementById('modalFecha').value;
    const hora = document.getElementById('modalHora').value;
    const mencion = document.getElementById('modalMencion').value;

    try {
        const res = await fetch(`/api/reserva/reprogramar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                idReserva: id, 
                fecha: fecha, 
                hora: hora, 
                observaciones: mencion 
            })
        });
        const data = await res.json();
        
        if (data.ok) {
            alert("Reserva actualizada correctamente");
            cerrarModal();
            cargarReservasAPI();
        } else {
            alert("Error: " + data.mensaje);
        }
    } catch (e) {
        console.error(e);
        alert("Error al guardar");
    }
}

async function cancelarReservaAPI(id) {
    if (!confirm("¿Estás seguro de CANCELAR esta reserva? Esta acción no se puede deshacer fácilmente.")) return;

    try {
        const res = await fetch(`/api/reserva/cambiar_estado/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accion: 'cancelar' })
        });
        const data = await res.json();
        if (data.ok) {
            alert("Reserva cancelada.");
            cargarReservasAPI();
            // Auto-actualizar el calendario si está disponible
            if (typeof window.recargarCalendario === 'function') {
                window.recargarCalendario();
            }
        } else {
            alert("Error: " + data.mensaje);
        }
    } catch (e) {
        console.error(e);
    }
}

// ================== LOGICA DE TABLA ==================
function renderTabla() {
    tabla.innerHTML = "";
    const lista = reservasFiltradas ?? reservas;

    if (lista.length === 0) {
        tabla.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 20px;">No se encontraron reservas.</td></tr>';
        paginacion.innerHTML = "";
        return;
    }

    lista.sort((a, b) => new Date(b.f_reserva) - new Date(a.f_reserva));

    const inicio = (paginaActual - 1) * elementosPorPagina;
    const fin = inicio + elementosPorPagina;
    const pageData = lista.slice(inicio, fin);

    pageData.forEach((r, i) => {
        // Botones según tipo de admin
        let botonesAccion = `
            <button class="btn-sm btn-info" onclick="verReserva(${r.idReserva})" title="Ver Detalles">
                <img src="/static/img/ojo.png" alt="ver">
            </button>
        `;
        
        // Solo admin global puede editar y cancelar
        if (esAdminGlobal) {
            botonesAccion += `
                <button class="btn-sm btn-warning" onclick="editarReserva(${r.idReserva})" title="Editar Fecha/Hora">
                    <img src="/static/img/lapiz.png" alt="editar">
                </button>
                ${r.estadoReserva !== 'CANCELADO' ? 
                    `<button class="btn-sm btn-danger" onclick="cancelarReservaAPI(${r.idReserva})" title="Cancelar Reserva">
                        <img src="/static/img/x.png" alt="cancelar">
                    </button>` : 
                    `<button class="btn-sm btn-secondary" disabled title="Ya cancelado">
                        <img src="/static/img/x.png" alt="cancelado" style="filter: grayscale(100%);">
                    </button>`
                }
            `;
        }
        
        const row = document.createElement("tr");
        row.innerHTML = `
            <td class="col-id">${inicio + i + 1}</td>
            <td class="col-solicitante">${r.solicitante || 'Anónimo'}</td>
            <td class="col-acto">${r.nombreActo || '---'}</td>
            <td class="col-fecha">${r.f_reserva} <br> <small>${r.h_reserva}</small></td>
            <td class="col-parroquia">${r.nombreParroquia || ''}</td>
            <td class="col-estado"><span class="estado-texto">${r.estadoReserva}</span></td>
            <td class="col-acciones">
                ${botonesAccion}
            </td>
        `;
        tabla.appendChild(row);
    });

    renderPaginacion(lista.length);
}

// ================== PAGINACIÓN ==================
function renderPaginacion(totalItems) {
    paginacion.innerHTML = "";
    const totalPaginas = Math.ceil(totalItems / elementosPorPagina);
    if (totalPaginas <= 1) return;

    const ul = document.createElement("ul");
    ul.className = "pagination";

    const crearBtn = (pag, texto, activo = false) => {
        const li = document.createElement("li");
        li.className = `page-item ${activo ? 'active' : ''}`;
        li.innerHTML = `<button class="page-link">${texto}</button>`;
        li.onclick = () => { paginaActual = pag; renderTabla(); };
        return li;
    };

    if (paginaActual > 1) ul.appendChild(crearBtn(paginaActual - 1, "<"));
    
    let start = Math.max(1, paginaActual - 2);
    let end = Math.min(totalPaginas, paginaActual + 2);

    for (let i = start; i <= end; i++) {
        ul.appendChild(crearBtn(i, i, i === paginaActual));
    }

    if (paginaActual < totalPaginas) ul.appendChild(crearBtn(paginaActual + 1, ">"));

    paginacion.appendChild(ul);
}

// ================== BÚSQUEDA Y SUGERENCIAS ==================
function configurarSugerenciasHTML() {
    sugerenciasContainer.id = "sugerenciasContainer";
    const group = document.querySelector(".input-group-search");
    if(group) group.appendChild(sugerenciasContainer);
    
    document.addEventListener("click", (e) => {
        if (group && !group.contains(e.target)) {
            sugerenciasContainer.style.display = "none";
        }
    });
}

function manejarInputBusqueda(e) {
    const termino = e.target.value.toLowerCase();
    sugerenciasContainer.innerHTML = "";
    
    if (termino.length < 1) {
        sugerenciasContainer.style.display = "none";
        reservasFiltradas = null;
        renderTabla();
        return;
    }

    const matches = reservas.filter(r => r.solicitante && r.solicitante.toLowerCase().includes(termino));
    const nombresUnicos = [...new Set(matches.map(r => r.solicitante))].slice(0, 5);

    if (nombresUnicos.length > 0) {
        nombresUnicos.forEach(nombre => {
            const div = document.createElement("div");
            div.className = "sugerencia-item";
            div.textContent = nombre;
            div.onclick = () => {
                if(inputBusqueda) inputBusqueda.value = nombre;
                sugerenciasContainer.style.display = "none";
                filtrarReservas();
            };
            sugerenciasContainer.appendChild(div);
        });
        sugerenciasContainer.style.display = "block";
    } else {
        sugerenciasContainer.style.display = "none";
    }
}

function filtrarReservas() {
    if(!inputBusqueda) return;
    const termino = inputBusqueda.value.toLowerCase();
    if (!termino) {
        reservasFiltradas = null;
    } else {
        reservasFiltradas = reservas.filter(r => 
            (r.solicitante && r.solicitante.toLowerCase().includes(termino)) ||
            (r.nombreActo && r.nombreActo.toLowerCase().includes(termino))
        );
    }
    paginaActual = 1;
    renderTabla();
}

// ================== MODAL ==================
function crearModalHTML() {
    if(document.getElementById("modalReservaAdmin")) return;

    const html = `
    <div id="modalReservaAdmin" class="modal">
        <div class="modal-dialog">
            <div class="modal-header">
                <h5 class="modal-title" id="modalTitulo">Editar Reserva</h5>
                <button type="button" class="btn-cerrar" onclick="cerrarModal()">&times;</button>
            </div>
            <div class="modal-body">
                <form id="formModalAdmin">
                    <div class="mb-3">
                        <label class="form-label">Solicitante</label>
                        <input type="text" id="modalSolicitante" class="form-control" disabled placeholder="Seleccionar usuario (en construcción)">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Acto</label>
                        <input type="text" id="modalActo" class="form-control" disabled placeholder="Seleccionar acto (en construcción)">
                    </div>
                    <div class="form-row">
                        <div class="form-col">
                            <label class="form-label">Fecha</label>
                            <input type="date" id="modalFecha" class="form-control">
                        </div>
                        <div class="form-col">
                            <label class="form-label">Hora</label>
                            <input type="time" id="modalHora" class="form-control">
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Observaciones / Mención</label>
                        <textarea id="modalMencion" class="form-control" rows="3"></textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn-modal btn-secondary" onclick="cerrarModal()">Cerrar</button>
                <button id="btnGuardarModal" class="btn-modal btn-primary" onclick="guardarCambiosAPI()">Guardar Cambios</button>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
}

function abrirModal() {
    const m = document.getElementById("modalReservaAdmin");
    if(m) {
        m.classList.add("activo");
        m.style.display = "flex"; // Asegurar que se muestre
    } else {
        console.error("No se encontró el modal para abrir");
    }
}

function cerrarModal() {
    const m = document.getElementById("modalReservaAdmin");
    if(m) {
        m.classList.remove("activo");
        setTimeout(() => m.style.display = "none", 300); // Esperar transición si hubiera
    }
}

function agregarReserva() {
    console.log("Abriendo modal de agregar...");
    reservaEditandoId = null;
    
    // Asegurar que el modal exista
    if(!document.getElementById("modalReservaAdmin")) crearModalHTML();
    
    const titulo = document.getElementById("modalTitulo");
    if(titulo) titulo.textContent = "Nueva Reserva";
    
    try {
        document.getElementById("modalSolicitante").value = "";
        document.getElementById("modalActo").value = "";
        document.getElementById("modalFecha").value = "";
        document.getElementById("modalHora").value = "";
        document.getElementById("modalMencion").value = "";
        
        document.getElementById("modalSolicitante").disabled = false;
        document.getElementById("modalActo").disabled = false; 
        document.getElementById("modalFecha").disabled = false;
        document.getElementById("modalHora").disabled = false;
        document.getElementById("modalMencion").disabled = false;
        document.getElementById("btnGuardarModal").style.display = "block";
        
        abrirModal();
    } catch(e) {
        console.error("Error al preparar modal:", e);
    }
}

function editarReserva(id) {
    const r = reservas.find(x => x.idReserva === id);
    if (!r) return;
    
    // Asegurar que el modal exista
    if(!document.getElementById("modalReservaAdmin")) crearModalHTML();

    reservaEditandoId = id;
    document.getElementById("modalTitulo").textContent = "Editar Reserva"; 
    
    document.getElementById("modalSolicitante").value = r.solicitante;
    document.getElementById("modalActo").value = r.nombreActo;
    document.getElementById("modalFecha").value = r.f_reserva;
    document.getElementById("modalHora").value = r.h_reserva;
    document.getElementById("modalMencion").value = r.mencion || "";
    
    document.getElementById("modalSolicitante").disabled = true;
    document.getElementById("modalActo").disabled = true;
    document.getElementById("modalFecha").disabled = false;
    document.getElementById("modalHora").disabled = false;
    document.getElementById("modalMencion").disabled = false;
    document.getElementById("btnGuardarModal").style.display = "block";

    abrirModal();
}

function verReserva(id) {
    editarReserva(id);
    document.getElementById("modalTitulo").textContent = "Detalle de Reserva";
    
    document.getElementById("modalFecha").disabled = true;
    document.getElementById("modalHora").disabled = true;
    document.getElementById("modalMencion").disabled = true;
    document.getElementById("btnGuardarModal").style.display = "none";
}

