let listaAsignaciones = [];
let asignacionesFiltradas = null;
let editandoId = null;

// Variables globales para las listas de búsqueda
let todosPersonal = []; 
let todosCargos = [];   // Nueva variable para cargos

const tablaBody = document.querySelector("#tablaDocumentos tbody");
const paginacionContainer = document.getElementById("paginacionContainer");
const inputBusqueda = document.getElementById("inputDocumento");
const itemsPorPagina = 7;
let paginaActual = 1;

document.addEventListener("DOMContentLoaded", () => {
    crearModalHTML(); 
    
    // Configurar el buscador principal ANTES de cargar datos
    configurarBuscadorPrincipal();

    cargarDatos();    
    cargarCombos();   

    // Eventos generales
    document.getElementById("btn_buscar").addEventListener("click", filtrarDatos);
    inputBusqueda.addEventListener("keyup", (e) => { if(e.key === "Enter") filtrarDatos(); });

    document.getElementById("btn_guardar").addEventListener("click", (e) => {
        e.preventDefault();
        abrirModal(); // Modo crear por defecto
    });

    // Cerrar listas de sugerencias al hacer clic fuera
    document.addEventListener("click", (e) => {
        cerrarListaSiClicFuera(e, "listaPersonal", "busquedaPersonal");
        cerrarListaSiClicFuera(e, "listaCargo", "busquedaCargo");
        cerrarListaSiClicFuera(e, "listaBusquedaPrincipal", "inputDocumento");
    });
});

function cerrarListaSiClicFuera(e, idLista, idInput) {
    const lista = document.getElementById(idLista);
    const input = document.getElementById(idInput);
    if (lista && input && !lista.contains(e.target) && !input.contains(e.target)) {
        lista.classList.remove("active");
    }
}

// ================== LÓGICA BUSCADOR PRINCIPAL ==================
function configurarBuscadorPrincipal() {
    const input = document.getElementById("inputDocumento");
    if (!input) return;

    // Crear wrapper para la lista sin romper estilos
    const wrapper = document.createElement("div");
    wrapper.className = "search-container";
    
    // Mover input dentro del wrapper
    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);

    const lista = document.createElement("div");
    lista.id = "listaBusquedaPrincipal";
    lista.className = "dropdown-list";
    wrapper.appendChild(lista);

    const actualizarLista = () => {
        const texto = input.value.toLowerCase();
        lista.innerHTML = "";
        
        if (!listaAsignaciones || listaAsignaciones.length === 0) return;

        // Obtener nombres únicos de la tabla actual
        const nombresUnicos = [...new Set(listaAsignaciones.map(item => item.nombrePersonal))];

        let coincidencias;
        if (!texto) {
            coincidencias = nombresUnicos; 
        } else {
            coincidencias = nombresUnicos.filter(nombre => 
                nombre.toLowerCase().includes(texto)
            );
        }

        if (coincidencias.length === 0) {
            lista.classList.remove("active");
        } else {
            // Mostrar máximo 8
            coincidencias.slice(0, 8).forEach(nombre => {
                const item = document.createElement("div");
                item.className = "dropdown-item";
                item.textContent = nombre;
                
                // AL SELECCIONAR: Rellenar input y filtrar tabla
                item.addEventListener("click", () => {
                    input.value = nombre;
                    lista.classList.remove("active");
                    filtrarDatos(); 
                });
                
                lista.appendChild(item);
            });
            lista.classList.add("active");
        }
    };

    input.addEventListener("input", actualizarLista);
    input.addEventListener("focus", actualizarLista);
}

// ================== API Y DATOS ==================
async function cargarDatos() {
    try {
        const res = await fetch('/api/usuario/parroquia_personal/listar');
        const data = await res.json();
        if (data.success) {
            listaAsignaciones = data.datos;
            renderTabla();
        } else {
            mostrarAlerta("Error al cargar datos", "error");
        }
    } catch (err) { console.error(err); }
}

async function cargarCombos() {
    try {
        const res = await fetch('/api/usuario/parroquia_personal/combos');
        const data = await res.json();
        if (data.success) {
            todosPersonal = data.personal;
            todosCargos = data.cargos;
            
            llenarSelect("modalParroquia", data.parroquias);

            if (data.parroquias.length >= 1) {
                const selectParr = document.getElementById("modalParroquia");
                selectParr.value = data.parroquias[0].id;
            }
        }
    } catch (err) { console.error("Error combos:", err); }
}

function llenarSelect(idSelect, datos) {
    const sel = document.getElementById(idSelect);
    if(!sel) return;
    sel.innerHTML = ''; 
    datos.forEach(d => {
        const opt = document.createElement("option");
        opt.value = d.id;
        opt.textContent = d.nombre;
        sel.appendChild(opt);
    });
}

// ================== LÓGICA BUSCADOR GENÉRICO (PARA MODAL) ==================
function configurarBuscador(inputId, listId, hiddenId, getDataSource) {
    const input = document.getElementById(inputId);
    const lista = document.getElementById(listId);
    const hidden = document.getElementById(hiddenId);

    if (!input || !lista) return;

    const actualizarLista = (texto) => {
        if (input.disabled) return; // Si es solo lectura, no mostrar lista

        lista.innerHTML = "";
        const fuenteDatos = getDataSource(); 
        
        let coincidencias;

        if (!texto) {
            coincidencias = fuenteDatos; 
        } else {
            coincidencias = fuenteDatos.filter(item => 
                item.nombre.toLowerCase().startsWith(texto.toLowerCase())
            );
        }

        if (coincidencias.length === 0) {
            lista.innerHTML = '<div class="dropdown-item" style="cursor:default; color:#999;">No se encontraron resultados</div>';
        } else {
            coincidencias.slice(0, 50).forEach(itemData => { // Limitar renderizado
                const item = document.createElement("div");
                item.className = "dropdown-item";
                item.textContent = itemData.nombre;
                
                item.addEventListener("click", function() {
                    input.value = itemData.nombre; 
                    hidden.value = itemData.id;
                    lista.classList.remove("active");
                });
                
                lista.appendChild(item);
            });
        }
        lista.classList.add("active");
    };

    input.addEventListener("input", function() { actualizarLista(this.value); });
    input.addEventListener("focus", function() { actualizarLista(this.value); });
}

// ================== RENDERIZADO TABLA ==================
function renderTabla() {
    tablaBody.innerHTML = "";
    const lista = asignacionesFiltradas || listaAsignaciones;
    
    if (lista.length === 0) {
        tablaBody.innerHTML = '<tr><td colspan="6" style="text-align:center">No hay registros</td></tr>';
        return;
    }

    const inicio = (paginaActual - 1) * itemsPorPagina;
    const fin = inicio + itemsPorPagina;
    const paginados = lista.slice(inicio, fin);

    paginados.forEach((item, index) => {
        const esVigente = item.vigencia;
        const btnClase = esVigente ? "btn-orange" : "btn-success";
        const rotacion = esVigente ? "" : "transform: rotate(180deg)";
        const titleEstado = esVigente ? "Dar de baja" : "Activar";

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="col-id">${inicio + index + 1}</td>
            <td class="col-nombre">${item.nombrePersonal}</td>
            <td class="col-fechaInicio">${formatearFechaDisplay(item.f_inicio)}</td>
            <td class="col-fechaFinal">${formatearFechaDisplay(item.f_fin)}</td>
            <td class="col-cargo">${item.nombreCargo}</td>
            <td class="col-acciones">
                <div class="d-flex">
                    <!-- BOTÓN VER (AZUL) -->
                    <button class="btn btn-info" onclick="ver(${item.idParroquiaPersonal})" title="Ver Detalle">
                        <img src="/static/img/ojo.png">
                    </button>
                    <!-- BOTÓN EDITAR -->
                    <button class="btn btn-warning" onclick="editar(${item.idParroquiaPersonal})" title="Editar">
                        <img src="/static/img/lapiz.png">
                    </button>
                    <!-- BOTÓN ESTADO -->
                    <button class="btn ${btnClase}" onclick="cambiarEstado(${item.idParroquiaPersonal}, ${esVigente})" title="${titleEstado}">
                        <img src="/static/img/flecha-hacia-abajo.png" style="${rotacion}">
                    </button>
                    <!-- BOTÓN ELIMINAR -->
                    <button class="btn btn-danger" onclick="eliminar(${item.idParroquiaPersonal})" title="Eliminar">
                        <img src="/static/img/x.png">
                    </button>
                </div>
            </td>
        `;
        tablaBody.appendChild(tr);
    });

    renderPaginacion(lista.length);
}

function formatearFechaDisplay(fechaStr) {
    if (!fechaStr || fechaStr === 'None') return "-";
    const partes = fechaStr.split("-");
    if(partes.length !== 3) return fechaStr;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function filtrarDatos() {
    const term = inputBusqueda.value.toLowerCase().trim();
    if (!term) {
        asignacionesFiltradas = null;
    } else {
        asignacionesFiltradas = listaAsignaciones.filter(x => 
            (x.nombrePersonal || "").toLowerCase().includes(term) ||
            (x.nombreCargo || "").toLowerCase().includes(term)
        );
    }
    paginaActual = 1;
    renderTabla();
}

// ================== MODAL Y UTILIDADES ==================
function crearModalHTML() {
    const div = document.createElement("div");
    div.innerHTML = `
    <div class="modal" id="modalForm">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="modalTitulo">Nueva Asignación</h5>
            <button type="button" class="btn-cerrar" onclick="cerrarModal()">&times;</button>
          </div>
          <div class="modal-body">
            <form id="formModal" autocomplete="off">
                
                <!-- BUSCADOR PERSONAL -->
                <label class="form-label">Personal <span class="text-danger">*</span></label>
                <div class="search-container">
                    <input type="text" id="busquedaPersonal" class="form-control search-input" placeholder="Buscar personal...">
                    <input type="hidden" id="modalPersonal">
                    <div id="listaPersonal" class="dropdown-list"></div>
                </div>

                <!-- BUSCADOR CARGO -->
                <label class="form-label">Cargo <span class="text-danger">*</span></label>
                <div class="search-container">
                    <input type="text" id="busquedaCargo" class="form-control search-input" placeholder="Buscar cargo...">
                    <input type="hidden" id="modalCargo">
                    <div id="listaCargo" class="dropdown-list"></div>
                </div>

                <!-- PARROQUIA OCULTA -->
                <div style="display:none;">
                    <label class="form-label">Parroquia</label>
                    <select id="modalParroquia" class="form-control"></select>
                </div>

                <div style="display:flex; gap:10px;">
                    <div style="flex:1">
                        <label class="form-label">Fecha Inicio <span class="text-danger">*</span></label>
                        <input type="date" id="modalFInicio" class="form-control" required>
                    </div>
                    <div style="flex:1">
                        <label class="form-label">Fecha Fin</label>
                        <input type="date" id="modalFFin" class="form-control">
                    </div>
                </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn-modal btn-secondary" onclick="cerrarModal()">Cerrar</button>
            <button class="btn-modal btn-primary" id="btnGuardarModal" onclick="guardar()">Guardar</button>
          </div>
        </div>
      </div>
    </div>`;
    document.body.appendChild(div);
    
    // Inicializar buscadores
    configurarBuscador("busquedaPersonal", "listaPersonal", "modalPersonal", () => todosPersonal);
    configurarBuscador("busquedaCargo", "listaCargo", "modalCargo", () => todosCargos);
}

// Función unificada para abrir modal (Crear, Editar, Ver)
function abrirModal(id = null, modo = 'editar') {
    const modal = document.getElementById("modalForm");
    const titulo = document.getElementById("modalTitulo");
    const form = document.getElementById("formModal");
    const btnGuardar = document.getElementById("btnGuardarModal");
    
    form.reset();
    
    // Limpiar inputs visuales y ocultos
    document.getElementById("modalPersonal").value = ""; 
    document.getElementById("busquedaPersonal").value = "";
    document.getElementById("modalCargo").value = "";
    document.getElementById("busquedaCargo").value = "";

    // 1. Configurar estado de inputs (Habilitado/Deshabilitado)
    const inputs = form.querySelectorAll("input, select");
    const esSoloLectura = (modo === 'ver');
    
    inputs.forEach(input => {
        input.disabled = esSoloLectura;
    });

    // 2. Configurar botón guardar
    if (esSoloLectura) {
        btnGuardar.style.display = "none";
        titulo.textContent = "Detalle Asignación";
    } else {
        btnGuardar.style.display = "inline-block";
        titulo.textContent = id ? "Editar Asignación" : "Nueva Asignación";
    }

    // 3. Llenar datos si hay ID
    if (id) {
        editandoId = id;
        const item = listaAsignaciones.find(x => x.idParroquiaPersonal === id);
        if (item) {
            // Llenar datos de Personal
            document.getElementById("modalPersonal").value = item.idPersonal;
            document.getElementById("busquedaPersonal").value = item.nombrePersonal;
            
            // Llenar datos de Cargo
            document.getElementById("modalCargo").value = item.idCargo;
            document.getElementById("busquedaCargo").value = item.nombreCargo;

            // Parroquia y Fechas
            document.getElementById("modalParroquia").value = item.idParroquia;
            document.getElementById("modalFInicio").value = item.f_inicio; 
            document.getElementById("modalFFin").value = item.f_fin || "";
        }
    } else {
        editandoId = null;
        // Fecha inicio hoy por defecto (solo si no es ver)
        if (!esSoloLectura) {
            document.getElementById("modalFInicio").value = new Date().toISOString().split('T')[0];
        }
    }
    modal.classList.add("activo");
}

function cerrarModal() { document.getElementById("modalForm").classList.remove("activo"); }

// Exponer funciones globales
window.editar = function(id) { abrirModal(id, 'editar'); };
window.ver = function(id) { abrirModal(id, 'ver'); };

// ================== ACCIONES ==================
async function guardar() {
    const idPersonal = document.getElementById("modalPersonal").value;
    const idCargo = document.getElementById("modalCargo").value;
    const idParroquia = document.getElementById("modalParroquia").value;
    const f_inicio = document.getElementById("modalFInicio").value;
    const f_fin = document.getElementById("modalFFin").value || null;

    if (!idPersonal) {
        mostrarAlerta("Debe buscar y seleccionar un personal", "error");
        return;
    }
    if (!idCargo) {
        mostrarAlerta("Debe buscar y seleccionar un cargo", "error");
        return;
    }
    if (!idParroquia) {
        mostrarAlerta("Error: No tiene parroquia asignada", "error");
        return;
    }
    if (!f_inicio) {
        mostrarAlerta("Indique la fecha de inicio", "error");
        return;
    }

    const payload = { idPersonal, idCargo, idParroquia, f_inicio, f_fin };
    
    let url = "/api/usuario/parroquia_personal/guardar";
    let method = "POST";

    if (editandoId) {
        url = `/api/usuario/parroquia_personal/actualizar/${editandoId}`;
        method = "PUT";
    }

    try {
        const res = await fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        
        if (data.success) {
            mostrarAlerta(data.mensaje, "success");
            cerrarModal();
            cargarDatos();
        } else {
            mostrarAlerta(data.mensaje, "error");
        }
    } catch (e) { console.error(e); }
}

window.cambiarEstado = async function(id, estadoActual) {
    if (!confirm(`¿Seguro de cambiar el estado a ${!estadoActual ? 'VIGENTE' : 'NO VIGENTE'}?`)) return;
    try {
        const res = await fetch(`/api/usuario/parroquia_personal/estado/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ vigencia: !estadoActual })
        });
        const data = await res.json();
        if (data.success) {
            mostrarAlerta(data.mensaje, "success");
            cargarDatos();
        } else { mostrarAlerta("Error", "error"); }
    } catch(e) { console.error(e); }
};

window.eliminar = async function(id) {
    if(!confirm("¿Desea eliminar este registro permanentemente?")) return;
    try {
        const res = await fetch(`/api/usuario/parroquia_personal/eliminar/${id}`, { method: "DELETE" });
        const data = await res.json();
        if(data.success) {
            mostrarAlerta(data.mensaje, "success");
            cargarDatos();
        } else {
            mostrarAlerta(data.mensaje, "error");
        }
    } catch(e) { console.error(e); }
};

function mostrarAlerta(msg, tipo) {
    const div = document.createElement("div");
    div.className = `alerta-toast ${tipo}`;
    div.textContent = msg;
    document.body.appendChild(div);
    setTimeout(() => div.classList.add("mostrar"), 10);
    setTimeout(() => { div.classList.remove("mostrar"); setTimeout(() => div.remove(), 300); }, 3000);
}

function renderPaginacion(total) {
    paginacionContainer.innerHTML = "";
    const paginas = Math.ceil(total / itemsPorPagina);
    if(paginas <= 1) return;
    const ul = document.createElement("ul");
    ul.className = "pagination";
    for(let i=1; i<=paginas; i++) {
        const li = document.createElement("li");
        li.className = `page-item ${i === paginaActual ? 'active' : ''}`;
        li.innerHTML = `<span class="page-link">${i}</span>`;
        li.onclick = () => { paginaActual = i; renderTabla(); };
        ul.appendChild(li);
    }
    paginacionContainer.appendChild(ul);
}