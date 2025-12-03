const tabla = document.querySelector("#tablaDocumentos tbody");
const paginacion = document.getElementById("paginacionContainer");
const inputBusqueda = document.getElementById("inputBusqueda");

let datos = [];
let datosFiltrados = null;
let paginaActual = 1;
const elemPorPagina = 7;
let idEdicion = null;

// Combos
let listaReservas = [];
let listaRequisitos = [];

document.addEventListener("DOMContentLoaded", () => {
    crearModalHTML(); 
    cargarCombos();   
    cargarDatos();    

    // CORRECCIÓN: Evitar recarga al dar Enter en el buscador
    document.getElementById("formBusqueda").addEventListener("submit", (e) => e.preventDefault());

    inputBusqueda.addEventListener("input", () => filtrar(inputBusqueda.value));
    
    document.getElementById("btn_buscar").addEventListener("click", () => filtrar(inputBusqueda.value));
    document.getElementById("btn_nuevo").addEventListener("click", () => abrirModal('agregar'));
    
    configurarSugerencias();
});

// ================== API (MEJORADA) ==================
async function requestAPI(url, method = "GET", body = null) {
    try {
        const opts = { method, headers: { "Content-Type": "application/json" } };
        if (body) opts.body = JSON.stringify(body);
        
        const res = await fetch(url, opts);
        
        // CORRECCIÓN: Leer como texto primero para detectar errores HTML
        const text = await res.text(); 
        
        let data;
        try { 
            data = JSON.parse(text); 
        } catch (err) { 
            console.error("Error del servidor (No es JSON):", text);
            throw new Error(`Error del servidor: ${res.status} ${res.statusText}`); 
        }

        if (!res.ok) throw new Error(data.error || data.mensaje || "Error en la solicitud");
        return data;
    } catch (e) {
        console.error(e);
        alert(e.message);
        return null;
    }
}

async function cargarCombos() {
    const res = await requestAPI("/api/documento/combos");
    if (res) {
        listaReservas = res.reservas;
        listaRequisitos = res.requisitos;
        llenarSelectsModal();
    }
}

async function cargarDatos() {
    const res = await requestAPI("/api/documento/");
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
        tabla.innerHTML = '<tr><td colspan="6" style="text-align:center">No hay documentos registrados</td></tr>';
        paginacion.innerHTML = "";
        return;
    }
    const inicio = (paginaActual - 1) * elemPorPagina;
    const items = lista.slice(inicio, inicio + elemPorPagina);
    
    items.forEach((d, i) => {
        const esAprobado = d.aprobado;
        const btnColor = esAprobado ? "btn-success" : "btn-orange"; 
        const btnIconRot = esAprobado ? "" : "transform: rotate(180deg);";
        const btnTitle = esAprobado ? "Desaprobar" : "Aprobar";

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="col-id">${inicio + i + 1}</td>
            <td class="col-solicitante">${d.solicitante}</td>
            <td class="col-requisito">${d.requisito}</td>
            <td class="col-estado">${d.estadoCumplimiento}</td>
            <td class="col-obs">${d.observacion}</td>
            <td class="col-acciones">
                <div style="display:flex; justify-content:center; gap:5px;">
                    <button class="btn btn-info" onclick="ver(${d.id})" title="Ver detalle">
                        <img src="/static/img/ojo.png" alt="ver">
                    </button>
                    <button class="btn btn-warning" onclick="editar(${d.id})" title="Editar">
                        <img src="/static/img/lapiz.png" alt="editar">
                    </button>
                    <button class="btn ${btnColor}" onclick="cambiarAprobacion(${d.id}, ${esAprobado})" title="${btnTitle}">
                        <img src="/static/img/flecha-hacia-abajo.png" style="${btnIconRot}" alt="aprobar">
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

function renderPaginacion(total) {
    paginacion.innerHTML = "";
    const pags = Math.ceil(total / elemPorPagina);
    
    if (pags <= 1) return;

    const ul = document.createElement("ul");
    ul.className = "pagination";

    const crearBtn = (txt, p, act=false, dis=false) => {
        const li = document.createElement("li");
        li.className = `page-item ${act ? "active" : ""} ${dis ? "disabled" : ""}`;
        const b = document.createElement("button");
        b.className = "page-link"; b.innerHTML = txt;
        if (!act && !dis) b.onclick = () => { paginaActual = p; renderTabla(); };
        li.appendChild(b); ul.appendChild(li);
    };

    crearBtn("&laquo;", paginaActual - 1, false, paginaActual === 1);
    
    if (pags <= 7) {
        for (let i = 1; i <= pags; i++) crearBtn(i, i, paginaActual === i);
    } else {
        const rad = 1;
        const ini = Math.max(1, paginaActual - rad);
        const fin = Math.min(pags, paginaActual + rad);
        if (ini > 1) { crearBtn("1", 1); if (ini > 2) crearBtn("...", null, false, true); }
        for (let i = ini; i <= fin; i++) crearBtn(i, i, paginaActual === i);
        if (fin < pags) { if (fin < pags - 1) crearBtn("...", null, false, true); crearBtn(pags, pags); }
    }
    crearBtn("&raquo;", paginaActual + 1, false, paginaActual === pags);
    paginacion.appendChild(ul);
}

// ================== FILTROS ==================
function filtrar(txt) {
    txt = txt.toLowerCase().trim();
    if (!txt) { datosFiltrados = null; } 
    else {
        // CORRECCIÓN: Usar startsWith para ser consistente
        datosFiltrados = datos.filter(d => 
            d.solicitante.toLowerCase().startsWith(txt) || 
            d.requisito.toLowerCase().startsWith(txt)
        );
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
        if (!txt) { cont.style.display = "none"; return; }
        
        const coincidencias = datos.filter(d => d.solicitante.toLowerCase().startsWith(txt) || d.requisito.toLowerCase().startsWith(txt));
        const unicos = new Set();
        const mostrar = [];
        
        coincidencias.forEach(item => {
            const label = `${item.solicitante} - ${item.requisito}`;
            if (!unicos.has(label)) { unicos.add(label); mostrar.push(item); }
        });

        if (mostrar.length === 0) { cont.style.display = "none"; return; }
        
        mostrar.slice(0, 5).forEach(s => {
            const div = document.createElement("div");
            div.className = "sugerencia-item";
            div.textContent = `${s.solicitante} - ${s.requisito}`;
            div.onclick = () => { inputBusqueda.value = s.solicitante; filtrar(s.solicitante); };
            cont.appendChild(div);
        });
        cont.style.display = "block";
    });
    document.addEventListener("click", (e) => { if (!cont.contains(e.target) && e.target !== inputBusqueda) cont.style.display = "none"; });
}

// ================== CRUD & MODAL (CORREGIDO) ==================
function crearModalHTML() {
    const div = document.createElement("div");
    // CORRECCIÓN: onsubmit="event.preventDefault()" y type="button"
    div.innerHTML = `
    <div id="modalForm" class="modal">
        <div class="modal-dialog">
            <div class="modal-header">
                <h5 id="modalTitulo">Gestionar Documento</h5>
                <button type="button" class="btn-cerrar" onclick="cerrarModal()">&times;</button>
            </div>
            <div class="modal-body">
                <form id="formDoc" onsubmit="event.preventDefault()">
                    <label>Reserva (Solicitante)</label>
                    <select id="selReserva" class="form-control"></select>
                    
                    <label>Requisito (Acto)</label>
                    <select id="selRequisito" class="form-control"></select>
                    
                    <label>Estado Cumplimiento</label>
                    <select id="selEstado" class="form-control">
                        <option value="Pendiente">Pendiente</option>
                        <option value="Entregado">Entregado</option>
                        <option value="Aprobado">Aprobado</option>
                        <option value="Rechazado">Rechazado</option>
                    </select>

                    <label>Observación</label>
                    <input type="text" id="inpObs" class="form-control">

                    <label>Vigencia (Opcional)</label>
                    <input type="date" id="inpVigencia" class="form-control">
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn-modal btn-secondary" onclick="cerrarModal()">Cancelar</button>
                <button type="button" class="btn-modal btn-primary" id="btnGuardarModal" onclick="guardar()">Guardar</button>
            </div>
        </div>
    </div>`;
    document.body.appendChild(div);
}

function llenarSelectsModal() {
    const selRes = document.getElementById("selReserva");
    const selReq = document.getElementById("selRequisito");
    selRes.innerHTML = ""; selReq.innerHTML = "";
    listaReservas.forEach(r => selRes.add(new Option(r.texto, r.id)));
    listaRequisitos.forEach(req => selReq.add(new Option(req.texto, req.id)));
}

function abrirModal(modo, obj = null) {
    const modal = document.getElementById("modalForm");
    const titulo = document.getElementById("modalTitulo");
    const btnGuardar = document.getElementById("btnGuardarModal");
    const form = document.getElementById("formDoc");
    
    llenarSelectsModal();
    form.querySelectorAll("input, select").forEach(el => el.disabled = false);
    btnGuardar.style.display = "inline-block";

    if (modo === 'agregar') {
        idEdicion = null;
        titulo.textContent = "Nuevo Documento";
        form.reset();
    } else if (modo === 'editar' && obj) {
        idEdicion = obj.id;
        titulo.textContent = "Editar Documento";
        cargarDatosModal(obj);
    } else if (modo === 'ver' && obj) {
        titulo.textContent = "Detalle Documento";
        cargarDatosModal(obj);
        form.querySelectorAll("input, select").forEach(el => el.disabled = true);
        btnGuardar.style.display = "none";
    }
    modal.classList.add("activo");
}

function cargarDatosModal(obj) {
    document.getElementById("selReserva").value = obj.idReserva;
    document.getElementById("selRequisito").value = obj.idActoRequisito;
    document.getElementById("selEstado").value = obj.estadoCumplimiento;
    document.getElementById("inpObs").value = obj.observacion !== "---" ? obj.observacion : "";
    document.getElementById("inpVigencia").value = obj.vigencia;
}

function cerrarModal() { document.getElementById("modalForm").classList.remove("activo"); }

window.editar = function(id) { const obj = datos.find(x => x.id === id); if (obj) abrirModal('editar', obj); };
window.ver = function(id) { const obj = datos.find(x => x.id === id); if (obj) abrirModal('ver', obj); };

window.cambiarAprobacion = async function(id, estadoActual) {
    const nuevo = !estadoActual;
    if(!confirm(`¿Desea cambiar la aprobación a ${nuevo ? 'APROBADO' : 'NO APROBADO'}?`)) return;
    const res = await requestAPI(`/api/documento/aprobacion/${id}`, "PATCH", { aprobado: nuevo });
    if(res) cargarDatos();
};

window.eliminar = async function(id) {
    if (!confirm("¿Eliminar este registro?")) return;
    const res = await requestAPI(`/api/documento/eliminar/${id}`, "DELETE");
    if (res) cargarDatos();
};

window.guardar = async function() {
    const body = {
        idReserva: document.getElementById("selReserva").value,
        idActoReq: document.getElementById("selRequisito").value,
        estado: document.getElementById("selEstado").value,
        observacion: document.getElementById("inpObs").value,
        vigencia: document.getElementById("inpVigencia").value
    };

    if (!body.idReserva || !body.idActoReq || !body.estado) {
        alert("Complete los campos obligatorios"); return;
    }

    let url = "/api/documento/guardar";
    let method = "POST";

    if (idEdicion) {
        url = `/api/documento/actualizar/${idEdicion}`;
        method = "PUT";
    }

    const res = await requestAPI(url, method, body);
    if (res) { cerrarModal(); cargarDatos(); }
};