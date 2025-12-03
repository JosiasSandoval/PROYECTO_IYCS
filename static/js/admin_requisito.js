const tabla = document.querySelector("#tablaRequisitos tbody");
const paginacion = document.getElementById("paginacionContainer");
const inputBusqueda = document.getElementById("inputBusqueda");

let datos = [];
let datosFiltrados = null;
let paginaActual = 1;
const elemPorPagina = 7;
let idEdicion = null;

document.addEventListener("DOMContentLoaded", () => {
    crearModalHTML(); 
    cargarDatos();    

    // Prevenir recarga del form
    document.getElementById("formBusqueda").addEventListener("submit", (e) => e.preventDefault());

    inputBusqueda.addEventListener("input", () => filtrar(inputBusqueda.value));
    document.getElementById("btn_buscar").addEventListener("click", () => filtrar(inputBusqueda.value));
    document.getElementById("btn_nuevo").addEventListener("click", () => abrirModal('agregar'));
    
    configurarSugerencias();
});

// ================== API (Versión Segura) ==================
async function requestAPI(url, method = "GET", body = null) {
    try {
        const opts = { method, headers: { "Content-Type": "application/json" } };
        if (body) opts.body = JSON.stringify(body);
        
        const res = await fetch(url, opts);
        const text = await res.text();
        
        let data;
        try { data = JSON.parse(text); } 
        catch (err) { throw new Error(`Error del servidor: ${res.status}`); }

        if (!res.ok) throw new Error(data.error || data.mensaje || "Error en la solicitud");
        return data;
    } catch (e) {
        console.error(e);
        alert(e.message);
        return null;
    }
}

async function cargarDatos() {
    // Apuntamos a tu ruta existente
    const res = await requestAPI("/api/requisito/requisito");
    if (res && res.datos) {
        datos = res.datos;
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
        tabla.innerHTML = '<tr><td colspan="5" style="text-align:center">No hay requisitos registrados</td></tr>';
        paginacion.innerHTML = "";
        return;
    }

    const inicio = (paginaActual - 1) * elemPorPagina;
    const items = lista.slice(inicio, inicio + elemPorPagina);
    
    items.forEach((d, i) => {
        const esActivo = d.estadoRequisito; // Nombre exacto que viene de tu controlador
        const btnColor = esActivo ? "btn-orange" : "btn-success"; 
        const btnIconRot = esActivo ? "" : "transform: rotate(180deg);";
        const btnTitle = esActivo ? "Dar de baja" : "Dar de alta";

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="col-id">${inicio + i + 1}</td>
            <td class="col-nombre">${d.nombRequisito}</td>
            <td class="col-fecha">${d.f_requisito || ''}</td>
            <td class="col-desc">${d.descripcion}</td>
            <td class="col-acciones">
                <div style="display:flex; justify-content:center; gap:5px;">
                    <button class="btn btn-info" onclick="ver(${d.idRequisito})" title="Ver detalle">
                        <img src="/static/img/ojo.png" alt="ver">
                    </button>
                    <button class="btn btn-warning" onclick="editar(${d.idRequisito})" title="Editar">
                        <img src="/static/img/lapiz.png" alt="editar">
                    </button>
                    <button class="btn ${btnColor}" onclick="cambiarEstado(${d.idRequisito}, ${esActivo})" title="${btnTitle}">
                        <img src="/static/img/flecha-hacia-abajo.png" style="${btnIconRot}" alt="estado">
                    </button>
                    <button class="btn btn-danger" onclick="eliminar(${d.idRequisito})" title="Eliminar">
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
        if(!act && !dis) b.onclick = () => { paginaActual = p; renderTabla(); };
        li.appendChild(b); ul.appendChild(li);
    };

    crearBtn("&laquo;", paginaActual - 1, false, paginaActual === 1);
    for (let i = 1; i <= pags; i++) crearBtn(i, i, paginaActual === i);
    crearBtn("&raquo;", paginaActual + 1, false, paginaActual === pags);
    
    paginacion.appendChild(ul);
}

// ================== FILTROS ==================
function filtrar(txt) {
    txt = txt.toLowerCase().trim();
    if (!txt) { datosFiltrados = null; } 
    else {
        datosFiltrados = datos.filter(d => d.nombRequisito.toLowerCase().startsWith(txt));
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
        
        const sugs = datos.filter(d => d.nombRequisito.toLowerCase().startsWith(txt)).slice(0, 5);
        if (sugs.length === 0) { cont.style.display = "none"; return; }
        
        sugs.forEach(s => {
            const div = document.createElement("div");
            div.className = "sugerencia-item";
            div.textContent = s.nombRequisito;
            div.onclick = () => { inputBusqueda.value = s.nombRequisito; filtrar(s.nombRequisito); };
            cont.appendChild(div);
        });
        cont.style.display = "block";
    });
    document.addEventListener("click", (e) => { if (!cont.contains(e.target) && e.target !== inputBusqueda) cont.style.display = "none"; });
}

// ================== CRUD Y MODAL ==================
function crearModalHTML() {
    const div = document.createElement("div");
    // MODAL ESTÁNDAR
    div.innerHTML = `
    <div id="modalForm" class="modal">
        <div class="modal-dialog">
            <div class="modal-header">
                <h5 id="modalTitulo">Gestionar Requisito</h5>
                <button type="button" class="btn-cerrar" onclick="cerrarModal()">&times;</button>
            </div>
            <div class="modal-body">
                <form id="formReq" onsubmit="event.preventDefault()">
                    <label>Nombre del Requisito <span class="text-danger">*</span></label>
                    <input type="text" id="inpNombre" class="form-control" required>
                    
                    <label>Fecha Registro <span class="text-danger">*</span></label>
                    <input type="date" id="inpFecha" class="form-control" required>
                    
                    <label>Descripción</label>
                    <textarea id="inpDesc" class="form-control" rows="3"></textarea>
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

function abrirModal(modo, obj = null) {
    const modal = document.getElementById("modalForm");
    const titulo = document.getElementById("modalTitulo");
    const btnGuardar = document.getElementById("btnGuardarModal");
    const form = document.getElementById("formReq");
    
    form.querySelectorAll("input, textarea").forEach(el => el.disabled = false);
    btnGuardar.style.display = "inline-block";

    if (modo === 'agregar') {
        idEdicion = null;
        titulo.textContent = "Nuevo Requisito";
        form.reset();
        document.getElementById("inpFecha").value = new Date().toISOString().split('T')[0];
    } else if (modo === 'editar' && obj) {
        idEdicion = obj.idRequisito;
        titulo.textContent = "Editar Requisito";
        cargarDatosModal(obj);
    } else if (modo === 'ver' && obj) {
        titulo.textContent = "Detalle Requisito";
        cargarDatosModal(obj);
        form.querySelectorAll("input, textarea").forEach(el => el.disabled = true);
        btnGuardar.style.display = "none";
    }
    modal.classList.add("activo");
}

function cargarDatosModal(obj) {
    document.getElementById("inpNombre").value = obj.nombRequisito;
    document.getElementById("inpFecha").value = obj.f_requisito;
    document.getElementById("inpDesc").value = obj.descripcion !== "---" ? obj.descripcion : "";
}

function cerrarModal() { document.getElementById("modalForm").classList.remove("activo"); }

window.editar = function(id) { const obj = datos.find(x => x.idRequisito === id); if (obj) abrirModal('editar', obj); };
window.ver = function(id) { const obj = datos.find(x => x.idRequisito === id); if (obj) abrirModal('ver', obj); };

window.cambiarEstado = async function(id, estadoActual) {
    const nuevo = !estadoActual;
    const res = await requestAPI(`/api/requisito/cambiar_estado_requisito/${id}`, "PUT", { estado: nuevo });
    if(res) cargarDatos();
};

window.eliminar = async function(id) {
    if (!confirm("¿Eliminar este requisito?")) return;
    const res = await requestAPI(`/api/requisito/eliminar_requisito/${id}`, "DELETE");
    if (res) cargarDatos();
};

window.guardar = async function() {
    const body = {
        nombRequisito: document.getElementById("inpNombre").value,
        f_requisito: document.getElementById("inpFecha").value,
        descripcion: document.getElementById("inpDesc").value
    };

    if (!body.nombRequisito || !body.f_requisito) {
        alert("El nombre y la fecha son obligatorios"); return;
    }

    let url = "/api/requisito/registrar_requisito";
    let method = "POST";

    if (idEdicion) {
        url = `/api/requisito/modificar_requisito/${idEdicion}`;
        method = "PUT";
    }

    const res = await requestAPI(url, method, body);
    if (res) { cerrarModal(); cargarDatos(); }
};