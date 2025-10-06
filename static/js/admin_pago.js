// ================== VARIABLES GLOBALES ==================
let pagos = [];
let pagosFiltrados = null;
let pagoEditandoId = null;

const tabla = document.querySelector("#tablaDocumentos tbody");
const paginacion = document.getElementById("paginacionContainer");

// Modales
const modalDetalle = crearModal();
const modalFormulario = crearModalFormulario();

let paginaActual = 1;
const elementosPorPagina = 10;

// ================== FUNCIONES ==================

// Renderizar tabla
function renderTabla() {
  tabla.innerHTML = "";

  const lista = pagosFiltrados ?? pagos;

  const inicio = (paginaActual - 1) * elementosPorPagina;
  const fin = inicio + elementosPorPagina;
  const pagosPagina = lista.slice(inicio, fin);

  pagosPagina.forEach((pago, index) => {
    const esActivo = pago.estado === "activo";
    const botonColor = esActivo ? "btn-orange" : "btn-success";
    const rotacion = esActivo ? "" : "transform: rotate(180deg);";

    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td class="col-id">${inicio + index + 1}</td>
      <td class="col-monto">${pago.monto}</td>
      <td class="col-fechaPago">${pago.fechaPago}</td>
      <td class="col-numTarjeta">${pago.numTarjeta}</td>
      <td class="col-estadoPago">${pago.estadoPago}</td>
      <td class="col-metodoPago">${pago.metodoPago}</td>
      <td class="col-descuento">${pago.descuento}</td>
      <td class="col-reserva">${pago.reservaId}</td>
      <td class="col-acciones">
        <div class="d-flex justify-content-center flex-wrap gap-1">
          <button class="btn btn-info btn-sm" onclick="verPago(${pago.id})" title="Ver">
            <img src="/static/img/ojo.png" alt="ver">
          </button>
          <button class="btn btn-warning btn-sm" onclick="editarPago(${pago.id})" title="Editar">
            <img src="/static/img/lapiz.png" alt="editar">
          </button>
          <button class="btn ${botonColor} btn-sm" onclick="darDeBaja(${pago.id})" title="${esActivo ? 'Dar de baja' : 'Dar de alta'}">
            <img src="/static/img/flecha-hacia-abajo.png" alt="estado" style="${rotacion}">
          </button>
          <button class="btn btn-danger btn-sm" onclick="eliminarPago(${pago.id})" title="Eliminar">
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
  const totalPaginas = Math.ceil(pagos.length / elementosPorPagina);
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

  for (let i = start; i <= end; i++) {
    ul.appendChild(crearItem(i, paginaActual === i));
  }

  ul.appendChild(crearItem(paginaActual + 1, false, paginaActual === totalPaginas, ">"));
  paginacion.appendChild(ul);
}

function cambiarPagina(pagina) {
  if (pagina < 1 || pagina > Math.ceil(pagos.length / elementosPorPagina)) return;
  paginaActual = pagina;
  renderTabla();
}

// ================== CRUD ==================
function agregarPago(monto, fechaPago, numTarjeta, estadoPago, metodoPago, descuento, reservaId) {
  pagos.push({
    id: Date.now(),
    monto,
    fechaPago,
    numTarjeta,
    estadoPago,
    metodoPago,
    descuento,
    reservaId,
    estado: "activo",
  });
  renderTabla();
}

function editarPago(id) {
  const pago = pagos.find((p) => p.id === id);
  if (!pago) return;
  abrirModalFormulario("editar", pago);
}

function eliminarPago(id) {
  const pago = pagos.find((p) => p.id === id);
  if (!pago) return;
  if (!confirm(`¿Seguro que deseas eliminar el pago con código ${pago.id}?`)) return;
  pagos = pagos.filter((p) => p.id !== id);
  renderTabla();
}

function darDeBaja(id) {
  const pago = pagos.find((p) => p.id === id);
  if (!pago) return;
  pago.estado = pago.estado === "activo" ? "inactivo" : "activo";
  renderTabla();
}

function verPago(id) {
  const pago = pagos.find((p) => p.id === id);
  if (!pago) return;
  abrirModalFormulario("ver", pago);
}

// ================== MODALES ==================
function crearModal() {
  const modalHTML = document.createElement("div");
  modalHTML.innerHTML = `
    <div class="modal" id="modalDetalle">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Detalle del Pago</h5>
            <button type="button" class="btn-cerrar" onclick="cerrarModal('modalDetalle')">&times;</button>
          </div>
          <div class="modal-body" id="modalDetalleContenido"></div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modalHTML);
  return document.getElementById("modalDetalle");
}

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
            <form id="formModalPago">
              <div class="mb-3">
                <label for="modalMonto" class="form-label">Monto</label>
                <input type="number" id="modalMonto" class="form-control" required>
              </div>
              <div class="mb-3">
                <label for="modalFechaPago" class="form-label">Fecha de Pago</label>
                <input type="date" id="modalFechaPago" class="form-control" required>
              </div>
              <div class="mb-3">
                <label for="modalNumTarjeta" class="form-label">Número de Tarjeta</label>
                <input type="text" id="modalNumTarjeta" class="form-control" required>
              </div>
              <div class="mb-3">
                <label for="modalEstadoPago" class="form-label">Estado del Pago</label>
                <input type="text" id="modalEstadoPago" class="form-control" required>
              </div>
              <div class="mb-3">
                <label for="modalMetodoPago" class="form-label">Método de Pago</label>
                <input type="text" id="modalMetodoPago" class="form-control" required>
              </div>
              <div class="mb-3">
                <label for="modalDescuento" class="form-label">Descuento</label>
                <input type="text" id="modalDescuento" class="form-control" required>
              </div>
              <div class="mb-3">
                <label for="modalReserva" class="form-label">ID de Reserva</label>
                <input type="text" id="modalReserva" class="form-control" required>
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

function abrirModalFormulario(modo, pago = null) {
  const titulo = document.getElementById("modalFormularioTitulo");
  const inputs = {
    monto: document.getElementById("modalMonto"),
    fechaPago: document.getElementById("modalFechaPago"),
    numTarjeta: document.getElementById("modalNumTarjeta"),
    estadoPago: document.getElementById("modalEstadoPago"),
    metodoPago: document.getElementById("modalMetodoPago"),
    descuento: document.getElementById("modalDescuento"),
    reserva: document.getElementById("modalReserva")
  };
  const botonGuardar = document.getElementById("btnGuardar");
  const form = document.getElementById("formModalPago");
  const modalFooter = document.querySelector("#modalFormulario .modal-footer");

  modalFooter.innerHTML = "";
  Object.values(inputs).forEach(input => input.disabled = false);

  if (modo === "agregar") {
    titulo.textContent = "Agregar Pago";
    Object.values(inputs).forEach(input => input.value = "");

    modalFooter.appendChild(botonGuardar);
    form.onsubmit = (e) => {
      e.preventDefault();
      agregarPago(
        inputs.monto.value.trim(),
        inputs.fechaPago.value.trim(),
        inputs.numTarjeta.value.trim(),
        inputs.estadoPago.value.trim(),
        inputs.metodoPago.value.trim(),
        inputs.descuento.value.trim(),
        inputs.reserva.value.trim()
      );
      cerrarModal("modalFormulario");
    };
  } else if (modo === "editar" && pago) {
    titulo.textContent = "Editar Pago";
    inputs.monto.value = pago.monto;
    inputs.fechaPago.value = pago.fechaPago;
    inputs.numTarjeta.value = pago.numTarjeta;
    inputs.estadoPago.value = pago.estadoPago;
    inputs.metodoPago.value = pago.metodoPago;
    inputs.descuento.value = pago.descuento;
    inputs.reserva.value = pago.reservaId;

    modalFooter.appendChild(botonGuardar);
    form.onsubmit = (e) => {
      e.preventDefault();
      pago.monto = inputs.monto.value.trim();
      pago.fechaPago = inputs.fechaPago.value.trim();
      pago.numTarjeta = inputs.numTarjeta.value.trim();
      pago.estadoPago = inputs.estadoPago.value.trim();
      pago.metodoPago = inputs.metodoPago.value.trim();
      pago.descuento = inputs.descuento.value.trim();
      pago.reservaId = inputs.reserva.value.trim();
      cerrarModal("modalFormulario");
      renderTabla();
    };
  } else if (modo === "ver" && pago) {
    titulo.textContent = "Detalle del Pago";
    inputs.monto.value = pago.monto;
    inputs.fechaPago.value = pago.fechaPago;
    inputs.numTarjeta.value = pago.numTarjeta;
    inputs.estadoPago.value = pago.estadoPago;
    inputs.metodoPago.value = pago.metodoPago;
    inputs.descuento.value = pago.descuento;
    inputs.reserva.value = pago.reservaId;
    Object.values(inputs).forEach(input => input.disabled = true);

    modalFooter.appendChild(botonGuardar);
    botonGuardar.onclick = () => cerrarModal("modalFormulario");
  }

  abrirModal("modalFormulario");
}

// ================== BUSQUEDA ==================
const inputBuscar = document.getElementById("inputDocumento");
const btnBuscar = document.getElementById("btn_buscar");

btnBuscar.addEventListener("click", () => {
  const termino = inputBuscar.value.trim().toLowerCase();
  pagosFiltrados =
    termino === ""
      ? null
      : pagos.filter((p) => p.id.toString().includes(termino));
  paginaActual = 1;
  renderTabla();
});

// ================== EVENTO FORM PRINCIPAL ==================
document.getElementById("formDocumento").addEventListener("submit", (e) => {
  e.preventDefault();
  abrirModalFormulario("agregar");
});

// ================== DATOS DE EJEMPLO ==================
pagos = [
  { id: 1, monto: 120.50, fechaPago: "2025-10-01", numTarjeta: "**** **** **** 1234", estadoPago: "Completado", metodoPago: "Tarjeta", descuento: "10%", reservaId: "R001", estado: "activo" },
  { id: 2, monto: 80.00, fechaPago: "2025-10-03", numTarjeta: "**** **** **** 5678", estadoPago: "Pendiente", metodoPago: "Efectivo", descuento: "0%", reservaId: "R002", estado: "activo" },
  { id: 3, monto: 150.75, fechaPago: "2025-10-05", numTarjeta: "**** **** **** 9876", estadoPago: "Cancelado", metodoPago: "Tarjeta", descuento: "5%", reservaId: "R003", estado: "inactivo" },
];

renderTabla();
