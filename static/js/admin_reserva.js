// ================== VARIABLES GLOBALES ==================
let reservas = [];
let reservasFiltradas = null;

const tabla = document.querySelector("#tablaDocumentos tbody");
const paginacion = document.getElementById("paginacionContainer");

// Modales
const modalFormulario = crearModalFormulario();

let paginaActual = 1;
const elementosPorPagina = 10;
let ordenActual = { campo: null, ascendente: true };

// ================== FUNCIONES ==================
// Renderizar tabla
function renderTabla() {
  tabla.innerHTML = "";

  const lista = reservasFiltradas ?? reservas;

  // Ordenar si aplica
  if (ordenActual.campo) {
    lista.sort((a, b) => {
      const campo = ordenActual.campo;
      const valorA = a[campo] ? a[campo].toString().toLowerCase() : "";
      const valorB = b[campo] ? b[campo].toString().toLowerCase() : "";
      if (valorA < valorB) return ordenActual.ascendente ? -1 : 1;
      if (valorA > valorB) return ordenActual.ascendente ? 1 : -1;
      return 0;
    });
  }

  const inicio = (paginaActual - 1) * elementosPorPagina;
  const fin = inicio + elementosPorPagina;
  const reservasPagina = lista.slice(inicio, fin);

  reservasPagina.forEach((res, index) => {
    const esActivo = res.estado === "activo";
    const botonColor = esActivo ? "btn-orange" : "btn-success";
    const rotacion = esActivo ? "" : "transform: rotate(180deg);";

    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td class="col-id">${inicio + index + 1}</td>
      <td class="col-dirigido">${res.dirigido}</td>
      <td class="col-dirigido">${res.dirigido2}</td>
      <td class="col-f_reserva">${res.f_reserva}</td>
      <td class="col-f_acto">${res.f_acto}</td>
      <td class="col-acto">${res.acto}</td>
      <td class="col-observaciones">${res.observaciones}</td>
      <td class="col-acciones">
        <div class="d-flex justify-content-center flex-wrap gap-1">
          <button class="btn btn-info btn-sm" onclick="verReserva(${res.id})" title="Ver">
            <img src="/static/img/ojo.png" alt="ver">
          </button>
          <button class="btn btn-warning btn-sm" onclick="editarReserva(${res.id})" title="Editar">
            <img src="/static/img/lapiz.png" alt="editar">
          </button>
          <button class="btn ${botonColor} btn-sm" onclick="darDeBaja(${res.id})" title="${esActivo ? 'Dar de baja' : 'Dar de alta'}">
            <img src="/static/img/flecha-hacia-abajo.png" alt="estado" style="${rotacion}">
          </button>
          <button class="btn btn-danger btn-sm" onclick="eliminarReserva(${res.id})" title="Eliminar">
            <img src="/static/img/x.png" alt="eliminar">
          </button>
        </div>
      </td>
    `;
    tabla.appendChild(fila);
  });

  renderPaginacion();
}

// ================== PAGINACIÓN ==================
function renderPaginacion() {
  paginacion.innerHTML = "";
  const totalPaginas = Math.ceil(reservas.length / elementosPorPagina);
  if (totalPaginas <= 1) return;

  const ul = document.createElement("ul");
  ul.className = "pagination";

  const crearItem = (numero, activo = false, disabled = false, texto = null) => {
    const li = document.createElement("li");
    li.className = `page-item ${activo ? "active" : ""} ${disabled ? "disabled" : ""}`;
    li.innerHTML = `<button class="page-link" onclick="cambiarPagina(${numero})">${texto || numero}</button>`;
    return li;
  };

  ul.appendChild(crearItem(paginaActual - 1, false, paginaActual === 1, "<"));

  const start = Math.max(1, paginaActual - 2);
  const end = Math.min(totalPaginas, paginaActual + 2);

  if (start > 1) {
    ul.appendChild(crearItem(1, paginaActual === 1));
    if (start > 2) ul.appendChild(crearItem(null, false, true, "..."));
  }

  for (let i = start; i <= end; i++) {
    ul.appendChild(crearItem(i, paginaActual === i));
  }

  if (end < totalPaginas) {
    if (end < totalPaginas - 1) ul.appendChild(crearItem(null, false, true, "..."));
    ul.appendChild(crearItem(totalPaginas, paginaActual === totalPaginas));
  }

  ul.appendChild(crearItem(paginaActual + 1, false, paginaActual === totalPaginas, ">"));

  paginacion.appendChild(ul);
}

function cambiarPagina(pagina) {
  if (pagina < 1 || pagina > Math.ceil(reservas.length / elementosPorPagina)) return;
  paginaActual = pagina;
  renderTabla();
}

// ================== CRUD ==================
function agregarReserva(dirigido, dirigido2, f_reserva, f_acto, acto, observaciones) {
  reservas.push({
    id: Date.now(),
    dirigido,
    dirigido2,
    f_reserva,
    f_acto,
    acto,
    observaciones,
    estado: "activo",
  });
  renderTabla();
}

function editarReserva(id) {
  const res = reservas.find((r) => r.id === id);
  if (!res) return;
  abrirModalFormulario("editar", res);
}

function eliminarReserva(id) {
  const res = reservas.find((r) => r.id === id);
  if (!res) return;
  if (!confirm(`¿Seguro que deseas eliminar la reserva de "${res.dirigido}"?`)) return;
  reservas = reservas.filter((r) => r.id !== id);
  renderTabla();
}

function darDeBaja(id) {
  const res = reservas.find((r) => r.id === id);
  if (!res) return;
  res.estado = res.estado === "activo" ? "inactivo" : "activo";
  renderTabla();
}

function verReserva(id) {
  const res = reservas.find((r) => r.id === id);
  if (!res) return;
  abrirModalFormulario("ver", res);
}

// ================== MODALES ==================
function crearModalFormulario() {
  const modalHTML = document.createElement("div");
  modalHTML.innerHTML = `
    <div class="modal" id="modalFormulario">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="modalFormularioTitulo"></h5>
            <button type="button" class="btn-cerrar" onclick="cerrarModal('modalFormulario')">&times;</button>
          </div>
          <div class="modal-body">
            <form id="formModalReserva">

              <div class="mb-3">
                <label for="modalDirigido" class="form-label">Dirigido</label>
                <input type="text" id="modalDirigido" class="form-control" required>
              </div>

              <div class="mb-3">
                <label for="modalDirigido2" class="form-label">Dirigido 2</label>
                <input type="text" id="modalDirigido2" class="form-control" required>
              </div>

              <div class="mb-3">
                <label for="modalFechaReserva" class="form-label">Fecha reserva</label>
                <input type="date" id="modalFechaReserva" class="form-control" required>
              </div>

              <div class="mb-3">
                <label for="modalFechaActo" class="form-label">Fecha acto</label>
                <input type="date" id="modalFechaActo" class="form-control" required>
              </div>

              <div class="mb-3">
                <label for="modalActo" class="form-label">Acto</label>
                <input type="text" id="modalActo" class="form-control" required>
              </div>

              <div class="mb-3">
                <label for="modalObservaciones" class="form-label">Observaciones</label>
                <textarea id="modalObservaciones" class="form-control" rows="3"></textarea>
              </div>

              <div class="modal-footer">
                <button type="submit" class="btn btn-modal btn-modal-primary" id="btnGuardar">Aceptar</button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modalHTML);
  return document.getElementById("modalFormulario");
}

function abrirModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add("activo");
}

function cerrarModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove("activo");
}

function abrirModalFormulario(modo, res = null) {
  const titulo = document.getElementById("modalFormularioTitulo");
  const inputDirigido = document.getElementById("modalDirigido");
  const inputDirigido2 = document.getElementById("modalDirigido2");
  const inputFechaReserva = document.getElementById("modalFechaReserva");
  const inputFechaActo = document.getElementById("modalFechaActo");
  const inputActo = document.getElementById("modalActo");
  const inputObservaciones = document.getElementById("modalObservaciones");
  const botonGuardar = document.getElementById("btnGuardar");
  const form = document.getElementById("formModalReserva");
  const modalFooter = document.querySelector("#modalFormulario .modal-footer");

  modalFooter.innerHTML = "";
  inputDirigido.disabled = false;
  inputDirigido2.disabled = false;
  inputFechaReserva.disabled = false;
  inputFechaActo.disabled = false;
  inputActo.disabled = false;
  inputObservaciones.disabled = false;

  if (modo === "agregar") {
    titulo.textContent = "Agregar reserva";
    inputDirigido.value = "";
    inputDirigido2.value = "";
    inputFechaReserva.value = "";
    inputFechaActo.value = "";
    inputActo.value = "";
    inputObservaciones.value = "";

    modalFooter.appendChild(botonGuardar);
    form.onsubmit = (e) => {
      e.preventDefault();
      agregarReserva(
        inputDirigido.value.trim(),
        inputDirigido2.value.trim(),
        inputFechaReserva.value,
        inputFechaActo.value,
        inputActo.value.trim(),
        inputObservaciones.value.trim()
      );
      cerrarModal("modalFormulario");
    };
  } else if (modo === "editar" && res) {
    titulo.textContent = "Editar reserva";
    inputDirigido.value = res.dirigido;
    inputDirigido2.value = res.dirigido2;
    inputFechaReserva.value = res.f_reserva;
    inputFechaActo.value = res.f_acto;
    inputActo.value = res.acto;
    inputObservaciones.value = res.observaciones;

    modalFooter.appendChild(botonGuardar);
    form.onsubmit = (e) => {
      e.preventDefault();
      res.dirigido = inputDirigido.value.trim();
      res.dirigido2 = inputDirigido2.value.trim();
      res.f_reserva = inputFechaReserva.value;
      res.f_acto = inputFechaActo.value;
      res.acto = inputActo.value.trim();
      res.observaciones = inputObservaciones.value.trim();
      cerrarModal("modalFormulario");
      renderTabla();
    };
  } else if (modo === "ver" && res) {
    titulo.textContent = "Detalle de reserva";
    inputDirigido.value = res.dirigido;
    inputDirigido2.value = res.dirigido2;
    inputFechaReserva.value = res.f_reserva;
    inputFechaActo.value = res.f_acto;
    inputActo.value = res.acto;
    inputObservaciones.value = res.observaciones;
    inputDirigido.disabled = true;
    inputDirigido2.disabled = true;
    inputFechaReserva.disabled = true;
    inputFechaActo.disabled = true;
    inputActo.disabled = true;
    inputObservaciones.disabled = true;

    modalFooter.appendChild(botonGuardar);
    botonGuardar.textContent = "Cerrar";
    botonGuardar.onclick = () => cerrarModal("modalFormulario");
  }

  abrirModal("modalFormulario");
}

// ================== BUSQUEDA ==================
const inputReserva = document.getElementById("inputDocumento");
const btnBuscar = document.getElementById("btn_buscar");

btnBuscar.addEventListener("click", () => {
  const termino = inputReserva.value.trim().toLowerCase();
  reservasFiltradas =
    termino === ""
      ? null
      : reservas.filter((r) => r.dirigido.toLowerCase().includes(termino));
  paginaActual = 1;
  renderTabla();
});

// ================== EVENTO FORM PRINCIPAL ==================
document.getElementById("formDocumento").addEventListener("submit", (e) => {
  e.preventDefault();
  abrirModalFormulario("agregar");
});

// ================== DATOS DE EJEMPLO ==================
reservas = [
  {
    id: 1,
    dirigido: "Juan Pérez",
    dirigido2: "María López",
    f_reserva: "2025-10-01",
    f_acto: "2025-10-05",
    acto: "Misa de matrimonio",
    observaciones: "Confirmar con el sacerdote",
    estado: "activo",
  },
  {
    id: 2,
    dirigido: "Carlos Gómez",
    dirigido2: "Ana Torres",
    f_reserva: "2025-10-02",
    f_acto: "2025-10-06",
    acto: "Bautizo",
    observaciones: "Documentos completos",
    estado: "activo",
  }
];

renderTabla();
