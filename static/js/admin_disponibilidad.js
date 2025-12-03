const tabla = document.querySelector("#tablaDisponibilidad tbody");
const paginacion = document.getElementById("paginacionContainer");
const inputBusqueda = document.getElementById("inputBusqueda");

let datos = [];
let datosFiltrados = null;
let paginaActual = 1;
const elemPorPagina = 7;
let idEdicion = null;
let listaPersonal = []; // Para el select del modal

document.addEventListener("DOMContentLoaded", () => {
    crearModalHTML(); 
    cargarCombos();   
    cargarDatos();    

    // Búsqueda en tiempo real
    inputBusqueda.addEventListener("input", () => filtrar(inputBusqueda.value));
    
    document.getElementById("btn_buscar").addEventListener("click", () => filtrar(inputBusqueda.value));
    document.getElementById("btn_nuevo").addEventListener("click", () => abrirModal('agregar'));
    
    configurarSugerencias();
});

// ================== API ==================
async function requestAPI(url, method = "GET", body = null) {
    try {
        const opts = { method, headers: { "Content-Type": "application/json" } };
        if (body) opts.body = JSON.stringify(body);
        const res = await fetch(url, opts);
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Error en la solicitud");
        }
        return await res.json();
    } catch (e) {
        alert(e.message);
        return null;
    }
}

async function cargarCombos() {
    const res = await requestAPI("/api/disponibilidad/combos");
    if (res) listaPersonal = res;
}

async function cargarDatos() {
    const res = await requestAPI("/api/disponibilidad/");
    if (res) {
        datos = res;
        datosFiltrados = null;
        paginaActual = 1;
        renderTabla();
    }
}

// ================== TABLA ==================
function renderTabla() {
    tabla.innerHTML = "";
    const lista = datosFiltrados || datos;
    if (lista.length === 0) {
        tabla.innerHTML = '<tr><td colspan="7" style="text-align:center">No hay horarios registrados</td></tr>';
        paginacion.innerHTML = "";
        return;
    }
    const inicio = (paginaActual - 1) * elemPorPagina;
    const items = lista.slice(inicio, inicio + elemPorPagina);
    
    items.forEach((d, i) => {
        // Estado
        const esActivo = d.estado;
        const btnColor = esActivo ? "btn-orange" : "btn-success";
        const btnIconRot = esActivo ? "" : "transform: rotate(180deg);";
        const btnTitle = esActivo ? "Dar de baja" : "Dar de alta";

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="col-id">${inicio + i + 1}</td>
            <td class="col-nombre">${d.nombrePersonal}</td>
            <td class="col-cargo">${d.cargo}</td>
            <td class="col-parroquia">${d.parroquia}</td>
            <td class="col-dia">${d.dia}</td>
            <td class="col-horas">${d.inicio} - ${d.fin}</td>
            <td class="col-acciones">
                <div style="display:flex; justify-content:center; gap:5px;">
                    <button class="btn btn-info" onclick="ver(${d.id})" title="Ver detalle">
                        <img src="/static/img/ojo.png" alt="ver">
                    </button>
                    <button class="btn btn-warning" onclick="editar(${d.id})" title="Editar">
                        <img src="/static/img/lapiz.png" alt="editar">
                    </button>
                    <button class="btn ${btnColor}" onclick="cambiarEstado(${d.id}, ${esActivo})" title="${btnTitle}">
                        <img src="/static/img/flecha-hacia-abajo.png" style="${btnIconRot}" alt="estado">
                    </button>
                    <button class="btn btn-danger" onclick="eliminar(${d.id})" title="Eliminar">
                        <img src="/static/img/x.png" alt="eliminar">
                    </button>
                </div>
            </td>
        `;
        tabla.appendChild(tr);
    });
    renderPaginacion(lista.length);
}

function renderPaginacion(totalElementos) {
    paginacion.innerHTML = "";
    const totalPaginas = Math.ceil(totalElementos / elemPorPagina);
    
    // Caso 1: Si hay 1 página o menos, no mostrar nada
    if (totalPaginas <= 1) return;

    const ul = document.createElement("ul");
    ul.className = "pagination";

    const crearBtn = (texto, page, activo = false, deshabilitado = false) => {
        const li = document.createElement("li");
        li.className = `page-item ${activo ? "active" : ""} ${deshabilitado ? "disabled" : ""}`;
        const btn = document.createElement("button");
        btn.className = "page-link";
        btn.innerHTML = texto;
        if (!activo && !deshabilitado) {
            btn.onclick = () => { paginaActual = page; renderTabla(); };
        }
        li.appendChild(btn);
        ul.appendChild(li);
    };

    // Botón Anterior
    crearBtn("&laquo;", paginaActual - 1, false, paginaActual === 1);

    // --- LÓGICA INTELIGENTE ---
    
    // Caso 2: Pocas páginas (Menos de 7). Mostrar TODAS sin puntos (...)
    if (totalPaginas <= 7) {
        for (let i = 1; i <= totalPaginas; i++) {
            crearBtn(i, i, paginaActual === i);
        }
    } 
    // Caso 3: Muchas páginas. Usar recortes (...)
    else {
        const radio = 1;
        const rangoInicio = Math.max(1, paginaActual - radio);
        const rangoFin = Math.min(totalPaginas, paginaActual + radio);

        // Siempre mostrar la 1
        if (rangoInicio > 1) {
            crearBtn("1", 1, paginaActual === 1);
            if (rangoInicio > 2) crearBtn("...", null, false, true);
        }

        // Rango central
        for (let i = rangoInicio; i <= rangoFin; i++) {
            crearBtn(i, i, paginaActual === i);
        }

        // Siempre mostrar la última
        if (rangoFin < totalPaginas) {
            if (rangoFin < totalPaginas - 1) crearBtn("...", null, false, true);
            crearBtn(totalPaginas, totalPaginas, paginaActual === totalPaginas);
        }
    }

    // Botón Siguiente
    crearBtn("&raquo;", paginaActual + 1, false, paginaActual === totalPaginas);

    paginacion.appendChild(ul);
}

// ================== FILTRO ==================
function filtrar(txt) {
    txt = txt.toLowerCase().trim();
    if (!txt) { datosFiltrados = null; } 
    else {
        // Filtrar por inicio del nombre del personal
        datosFiltrados = datos.filter(d => d.nombrePersonal.toLowerCase().startsWith(txt));
    }
    paginaActual = 1;
    renderTabla();
    document.getElementById("sugerenciasContainer").style.display = "none";
}

function configurarSugerencias() {
    const cont = document.createElement("div");
    cont.id = "sugerenciasContainer";
    inputBusqueda.parentNode.appendChild(cont);
    
    inputBusqueda.addEventListener("input", () => {
        const txt = inputBusqueda.value.toLowerCase().trim();
        cont.innerHTML = "";
        
        if (!txt) { 
            cont.style.display = "none"; 
            return; 
        }
        
        // 1. Filtramos los datos que coinciden
        const coincidencias = datos.filter(d => d.nombrePersonal.toLowerCase().startsWith(txt));
        
        // 2. Creamos un SET para guardar nombres ya mostrados y evitar duplicados
        const nombresVistos = new Set();
        const sugerenciasUnicas = [];

        coincidencias.forEach(item => {
            if (!nombresVistos.has(item.nombrePersonal)) {
                nombresVistos.add(item.nombrePersonal);
                sugerenciasUnicas.push(item);
            }
        });

        // 3. Si no hay nada, ocultar
        if (sugerenciasUnicas.length === 0) { 
            cont.style.display = "none"; 
            return; 
        }
        
        // 4. Mostrar solo los únicos (máximo 5)
        sugerenciasUnicas.slice(0, 5).forEach(s => {
            const div = document.createElement("div");
            div.className = "sugerencia-item";
            div.textContent = s.nombrePersonal;
            
            div.onclick = () => { 
                inputBusqueda.value = s.nombrePersonal; 
                filtrar(s.nombrePersonal); // Esto filtrará la tabla y mostrará TODAS las filas de esa persona
            };
            cont.appendChild(div);
        });
        
        cont.style.display = "block";
    });

    document.addEventListener("click", (e) => { 
        if (!cont.contains(e.target) && e.target !== inputBusqueda) {
            cont.style.display = "none"; 
        }
    });
}

// ================== CRUD Y MODAL ==================
function crearModalHTML() {
    const div = document.createElement("div");
    div.innerHTML = `
    <div id="modalForm" class="modal">
        <div class="modal-dialog">
            <div class="modal-header">
                <h5 id="modalTitulo">Gestionar Horario</h5>
                <button class="btn-cerrar" onclick="cerrarModal()">&times;</button>
            </div>
            <div class="modal-body">
                <form id="formDisp">
                    <label>Personal Asignado</label>
                    <select id="selPersonal" class="form-control"></select>
                    
                    <label>Día Semana</label>
                    <select id="selDia" class="form-control">
                        <option value="Lunes">Lunes</option>
                        <option value="Martes">Martes</option>
                        <option value="Miércoles">Miércoles</option>
                        <option value="Jueves">Jueves</option>
                        <option value="Viernes">Viernes</option>
                        <option value="Sábado">Sábado</option>
                        <option value="Domingo">Domingo</option>
                    </select>

                    <label>Hora Inicio</label>
                    <input type="time" id="inpInicio" class="form-control">

                    <label>Hora Fin</label>
                    <input type="time" id="inpFin" class="form-control">
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn-modal btn-secondary" onclick="cerrarModal()">Cancelar</button>
                <button class="btn-modal btn-primary" id="btnGuardarModal" onclick="guardar()">Guardar</button>
            </div>
        </div>
    </div>`;
    document.body.appendChild(div);
}

function llenarSelect() {
    const sel = document.getElementById("selPersonal");
    sel.innerHTML = "";
    listaPersonal.forEach(p => sel.add(new Option(p.texto, p.id)));
}

function abrirModal(modo, obj = null) {
    const modal = document.getElementById("modalForm");
    const titulo = document.getElementById("modalTitulo");
    const btnGuardar = document.getElementById("btnGuardarModal");
    const form = document.getElementById("formDisp");
    
    // Asegurar selects cargados
    llenarSelect();
    
    // Resetear estados
    form.querySelectorAll("input, select").forEach(el => el.disabled = false);
    btnGuardar.style.display = "inline-block";

    if (modo === 'agregar') {
        idEdicion = null;
        titulo.textContent = "Nuevo Horario";
        form.reset();
    } else if (modo === 'editar' && obj) {
        idEdicion = obj.id;
        titulo.textContent = "Editar Horario";
        cargarDatosModal(obj);
    } else if (modo === 'ver' && obj) {
        titulo.textContent = "Detalle Horario";
        cargarDatosModal(obj);
        form.querySelectorAll("input, select").forEach(el => el.disabled = true);
        btnGuardar.style.display = "none";
    }
    modal.classList.add("activo");
}

function cargarDatosModal(obj) {
    document.getElementById("selPersonal").value = obj.idPP;
    document.getElementById("selDia").value = obj.dia;
    document.getElementById("inpInicio").value = obj.inicio;
    document.getElementById("inpFin").value = obj.fin;
}

function cerrarModal() { document.getElementById("modalForm").classList.remove("activo"); }

window.editar = function(id) {
    const obj = datos.find(x => x.id === id);
    if (obj) abrirModal('editar', obj);
};

window.ver = function(id) {
    const obj = datos.find(x => x.id === id);
    if (obj) abrirModal('ver', obj);
};

window.cambiarEstado = async function(id, estadoActual) {
    const nuevo = !estadoActual;
    if(!confirm(`¿Desea cambiar el estado a ${nuevo ? 'Activo' : 'Inactivo'}?`)) return;
    const res = await requestAPI(`/api/disponibilidad/estado/${id}`, "PATCH", { estado: nuevo });
    if(res) cargarDatos();
};

window.eliminar = async function(id) {
    if (!confirm("¿Eliminar este horario?")) return;
    const res = await requestAPI(`/api/disponibilidad/eliminar/${id}`, "DELETE");
    if (res) cargarDatos();
};

window.guardar = async function() {
    const body = {
        idPP: document.getElementById("selPersonal").value,
        dia: document.getElementById("selDia").value,
        inicio: document.getElementById("inpInicio").value,
        fin: document.getElementById("inpFin").value
    };

    if (!body.idPP || !body.dia || !body.inicio || !body.fin) {
        alert("Complete todos los campos"); return;
    }

    let url = "/api/disponibilidad/guardar";
    let method = "POST";

    if (idEdicion) {
        url = `/api/disponibilidad/actualizar/${idEdicion}`;
        method = "PUT";
    }

    const res = await requestAPI(url, method, body);
    if (res) {
        cerrarModal();
        cargarDatos();
    }
};