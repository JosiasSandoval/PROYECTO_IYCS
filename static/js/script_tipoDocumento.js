let documentos = [
  { id: 1, nombre: "Documento Nacional de Identidad", abreviatura: "DNI", estado: "activo" },
  { id: 2, nombre: "Pasaporte", abreviatura: "PASS", estado: "activo" },
  { id: 3, nombre: "Licencia de Conducir", abreviatura: "LDC", estado: "activo" },
  { id: 4, nombre: "Cédula", abreviatura: "CED", estado: "activo" },
  { id: 5, nombre: "Carnet", abreviatura: "CRN", estado: "activo" },
  { id: 6, nombre: "Partida de Nacimiento", abreviatura: "PDN", estado: "activo" },
  { id: 7, nombre: "Certificado", abreviatura: "CERT", estado: "activo" },
  { id: 8, nombre: "Cédula", abreviatura: "CED", estado: "activo" },
  { id: 9, nombre: "Carnet", abreviatura: "CRN", estado: "activo" },
  { id: 10, nombre: "Partida de Nacimiento", abreviatura: "PDN", estado: "activo" },
  { id: 11, nombre: "Certificado", abreviatura: "CERT", estado: "activo" },
  { id: 12, nombre: "Documento Nacional de Identidad", abreviatura: "DNI", estado: "activo" },
  { id: 13, nombre: "Pasaporte", abreviatura: "PASS", estado: "activo" },
  { id: 14, nombre: "Licencia de Conducir", abreviatura: "LDC", estado: "activo" },
  { id: 15, nombre: "Cédula", abreviatura: "CED", estado: "activo" },
  { id: 16, nombre: "Carnet", abreviatura: "CRN", estado: "activo" },
  { id: 17, nombre: "Partida de Nacimiento", abreviatura: "PDN", estado: "activo" },
  { id: 18, nombre: "Certificado", abreviatura: "CERT", estado: "activo" },
  { id: 19, nombre: "Cédula", abreviatura: "CED", estado: "activo" },
  { id: 20, nombre: "Carnet", abreviatura: "CRN", estado: "activo" },
  { id: 21, nombre: "Partida de Nacimiento", abreviatura: "PDN", estado: "activo" },
  { id: 22, nombre: "Certificado", abreviatura: "CERT", estado: "activo" },
  { id: 23, nombre: "Documento Nacional de Identidad", abreviatura: "DNI", estado: "activo" },
  { id: 24, nombre: "Pasaporte", abreviatura: "PASS", estado: "activo" },
  { id: 25, nombre: "Licencia de Conducir", abreviatura: "LDC", estado: "activo" },
  { id: 26, nombre: "Cédula", abreviatura: "CED", estado: "activo" },
  { id: 27, nombre: "Carnet", abreviatura: "CRN", estado: "activo" },
  { id: 28, nombre: "Partida de Nacimiento", abreviatura: "PDN", estado: "activo" },
  { id: 29, nombre: "Certificado", abreviatura: "CERT", estado: "activo" },
  { id: 30, nombre: "Cédula", abreviatura: "CED", estado: "activo" },
  { id: 31, nombre: "Carnet", abreviatura: "CRN", estado: "activo" },
  { id: 32, nombre: "Partida de Nacimiento", abreviatura: "PDN", estado: "activo" },
  { id: 33, nombre: "Certificado", abreviatura: "CERT", estado: "activo" },
  { id: 34, nombre: "Documento Nacional de Identidad", abreviatura: "DNI", estado: "activo" },
  { id: 35, nombre: "Pasaporte", abreviatura: "PASS", estado: "activo" },
  { id: 36, nombre: "Licencia de Conducir", abreviatura: "LDC", estado: "activo" },
  { id: 37, nombre: "Cédula", abreviatura: "CED", estado: "activo" },
  { id: 38, nombre: "Carnet", abreviatura: "CRN", estado: "activo" },
  { id: 39, nombre: "Partida de Nacimiento", abreviatura: "PDN", estado: "activo" },
  { id: 40, nombre: "Certificado", abreviatura: "CERT", estado: "activo" },
  { id: 41, nombre: "Cédula", abreviatura: "CED", estado: "activo" },
  { id: 42, nombre: "Carnet", abreviatura: "CRN", estado: "activo" },
  { id: 43, nombre: "Partida de Nacimiento", abreviatura: "PDN", estado: "activo" },
  { id: 44, nombre: "Certificado", abreviatura: "CERT", estado: "activo" },
  { id: 45, nombre: "Documento Nacional de Identidad", abreviatura: "DNI", estado: "activo" },
  { id: 46, nombre: "Pasaporte", abreviatura: "PASS", estado: "activo" },
  { id: 47, nombre: "Licencia de Conducir", abreviatura: "LDC", estado: "activo" },
  { id: 48, nombre: "Cédula", abreviatura: "CED", estado: "activo" },
  { id: 49, nombre: "Carnet", abreviatura: "CRN", estado: "activo" },
  { id: 50, nombre: "Partida de Nacimiento", abreviatura: "PDN", estado: "activo" },
  { id: 51, nombre: "Certificado", abreviatura: "CERT", estado: "activo" },
  { id: 52, nombre: "Cédula", abreviatura: "CED", estado: "activo" },
  { id: 53, nombre: "Carnet", abreviatura: "CRN", estado: "activo" },
  { id: 54, nombre: "Partida de Nacimiento", abreviatura: "PDN", estado: "activo" },
  { id: 55, nombre: "Certificado", abreviatura: "CERT", estado: "activo" },
  { id: 56, nombre: "Documento Nacional de Identidad", abreviatura: "DNI", estado: "activo" },
  { id: 57, nombre: "Pasaporte", abreviatura: "PASS", estado: "activo" },
  { id: 58, nombre: "Licencia de Conducir", abreviatura: "LDC", estado: "activo" },
  { id: 59, nombre: "Cédula", abreviatura: "CED", estado: "activo" },
  { id: 60, nombre: "Carnet", abreviatura: "CRN", estado: "activo" },
  { id: 61, nombre: "Partida de Nacimiento", abreviatura: "PDN", estado: "activo" },
  { id: 62, nombre: "Certificado", abreviatura: "CERT", estado: "activo" },
  { id: 63, nombre: "Cédula", abreviatura: "CED", estado: "activo" },
  { id: 64, nombre: "Carnet", abreviatura: "CRN", estado: "activo" },
  { id: 65, nombre: "Partida de Nacimiento", abreviatura: "PDN", estado: "activo" },
  { id: 66, nombre: "Certificado", abreviatura: "CERT", estado: "activo" },
  { id: 67, nombre: "Documento Nacional de Identidad", abreviatura: "DNI", estado: "activo" },
  { id: 68, nombre: "Pasaporte", abreviatura: "PASS", estado: "activo" },
  { id: 69, nombre: "Licencia de Conducir", abreviatura: "LDC", estado: "activo" },
  { id: 70, nombre: "Cédula", abreviatura: "CED", estado: "activo" },
  { id: 71, nombre: "Carnet", abreviatura: "CRN", estado: "activo" },
  { id: 72, nombre: "Partida de Nacimiento", abreviatura: "PDN", estado: "activo" },
  { id: 73, nombre: "Certificado", abreviatura: "CERT", estado: "activo" },
  { id: 74, nombre: "Cédula", abreviatura: "CED", estado: "activo" },
  { id: 75, nombre: "Carnet", abreviatura: "CRN", estado: "activo" },
  { id: 76, nombre: "Partida de Nacimiento", abreviatura: "PDN", estado: "activo" },
  { id: 77, nombre: "Certificado", abreviatura: "CERT", estado: "activo" },
  { id: 78, nombre: "Documento Nacional de Identidad", abreviatura: "DNI", estado: "activo" },
  { id: 79, nombre: "Pasaporte", abreviatura: "PASS", estado: "activo" },
  { id: 80, nombre: "Licencia de Conducir", abreviatura: "LDC", estado: "activo" },
  { id: 81, nombre: "Cédula", abreviatura: "CED", estado: "activo" },
  { id: 82, nombre: "Carnet", abreviatura: "CRN", estado: "activo" },
  { id: 83, nombre: "Partida de Nacimiento", abreviatura: "PDN", estado: "activo" },
  { id: 84, nombre: "Certificado", abreviatura: "CERT", estado: "activo" },
  { id: 85, nombre: "Cédula", abreviatura: "CED", estado: "activo" },
  { id: 86, nombre: "Carnet", abreviatura: "CRN", estado: "activo" },
  { id: 87, nombre: "Partida de Nacimiento", abreviatura: "PDN", estado: "activo" },
  { id: 88, nombre: "Certificado", abreviatura: "CERT", estado: "activo" },
  { id: 89, nombre: "Documento Nacional de Identidad", abreviatura: "DNI", estado: "activo" },
  { id: 90, nombre: "Pasaporte", abreviatura: "PASS", estado: "activo" },
  { id: 91, nombre: "Licencia de Conducir", abreviatura: "LDC", estado: "activo" },
  { id: 92, nombre: "Cédula", abreviatura: "CED", estado: "activo" },
  { id: 93, nombre: "Carnet", abreviatura: "CRN", estado: "activo" },
  { id: 94, nombre: "Partida de Nacimiento", abreviatura: "PDN", estado: "activo" },
  { id: 95, nombre: "Certificado", abreviatura: "CERT", estado: "activo" },
  { id: 96, nombre: "Cédula", abreviatura: "CED", estado: "activo" },
  { id: 97, nombre: "Carnet", abreviatura: "CRN", estado: "activo" },
  { id: 98, nombre: "Partida de Nacimiento", abreviatura: "PDN", estado: "activo" },
  { id: 99, nombre: "Certificado", abreviatura: "CERT", estado: "activo" },
  { id: 100, nombre: "Documento Nacional de Identidad", abreviatura: "DNI", estado: "activo" },
  { id: 101, nombre: "Pasaporte", abreviatura: "PASS", estado: "activo" },
  { id: 102, nombre: "Licencia de Conducir", abreviatura: "LDC", estado: "activo" },
  { id: 103, nombre: "Cédula", abreviatura: "CED", estado: "activo" },
  { id: 104, nombre: "Carnet", abreviatura: "CRN", estado: "activo" },
  { id: 105, nombre: "Partida de Nacimiento", abreviatura: "PDN", estado: "activo" },
  { id: 106, nombre: "Certificado", abreviatura: "CERT", estado: "activo" },
  { id: 107, nombre: "Cédula", abreviatura: "CED", estado: "activo" },
  { id: 108, nombre: "Carnet", abreviatura: "CRN", estado: "activo" },
  { id: 109, nombre: "Partida de Nacimiento", abreviatura: "PDN", estado: "activo" },
  { id: 110, nombre: "Certificado", abreviatura: "CERT", estado: "activo" },
  { id: 111, nombre: "Documento Nacional de Identidad", abreviatura: "DNI", estado: "activo" },
  { id: 112, nombre: "Pasaporte", abreviatura: "PASS", estado: "activo" },
  { id: 113, nombre: "Licencia de Conducir", abreviatura: "LDC", estado: "activo" },
  { id: 114, nombre: "Cédula", abreviatura: "CED", estado: "activo" },
  { id: 115, nombre: "Carnet", abreviatura: "CRN", estado: "activo" },
  { id: 116, nombre: "Partida de Nacimiento", abreviatura: "PDN", estado: "activo" },
  { id: 117, nombre: "Certificado", abreviatura: "CERT", estado: "activo" },
  { id: 118, nombre: "Cédula", abreviatura: "CED", estado: "activo" },
  { id: 119, nombre: "Carnet", abreviatura: "CRN", estado: "activo" },
  { id: 120, nombre: "Partida de Nacimiento", abreviatura: "PDN", estado: "activo" },
  { id: 121, nombre: "Certificado", abreviatura: "CERT", estado: "activo" },
];
let documentosFiltrados = null; // <- lista filtrada temporal

const tabla = document.querySelector("#tablaDocumentos tbody");
const paginacion = document.getElementById("paginacionContainer");
const modalDetalle = crearModal();
const modalFormulario = crearModalFormulario();

let paginaActual = 1;
const elementosPorPagina = 10;

// Variable de ordenamiento
let ordenActual = { campo: null, ascendente: true };

function existeDocumento(nombre, abreviatura, idIgnorar = null) {
  return documentos.some(doc =>
    ((doc.nombre.toLowerCase() === nombre.toLowerCase()) ||
    (doc.abreviatura.toLowerCase() === abreviatura.toLowerCase())) &&
    doc.id !== idIgnorar
  );
}

// Renderizar tabla
function renderTabla() {
  tabla.innerHTML = "";

  // Usa la lista filtrada si existe, si no usa todos los documentos
  const lista = documentosFiltrados ?? documentos;

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
  const documentosPagina = lista.slice(inicio, fin);


  documentosPagina.forEach((doc, index) => {
    const esActivo = doc.estado === "activo";
    const botonColor = esActivo ? "btn-orange" : "btn-success";
    const rotacion = esActivo ? "" : "transform: rotate(180deg);";

    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td class="col-id text-center align-middle">${inicio + index + 1}</td>
      <td class="col-nombre text-start align-middle">${doc.nombre}</td>
      <td class="col-abreviatura text-center align-middle">${doc.abreviatura}</td>
      <td class="col-acciones text-center align-middle">
        <div class="d-flex justify-content-center flex-wrap gap-1">
          <button class="btn btn-info btn-sm" onclick="verDetalle(${doc.id})" title="Ver">
            <img src="imagenes/ojo.png" alt="ver">
          </button>
          <button class="btn btn-warning btn-sm" onclick="editarDocumento(${doc.id})" title="Editar">
            <img src="imagenes/lapiz.png" alt="editar">
          </button>
          <button class="btn ${botonColor} btn-sm" onclick="darDeBaja(${doc.id})" title="${esActivo ? 'Dar de baja' : 'Dar de alta'}">
            <img src="imagenes/flecha-hacia-abajo.png" alt="estado" style="${rotacion}">
          </button>
          <button class="btn btn-danger btn-sm" onclick="eliminarDocumento(${doc.id})" title="Eliminar">
            <img src="imagenes/x.png" alt="eliminar">
          </button>
        </div>
      </td>
    `;
    tabla.appendChild(fila);
  });

  renderPaginacion();
}

function renderPaginacion() {
  paginacion.innerHTML = "";
  const totalPaginas = Math.ceil(documentos.length / elementosPorPagina);
  if (totalPaginas <= 1) return;

  const ul = document.createElement("ul");
  ul.className = "pagination";

  const crearItem = (numero, activo = false, disabled = false, texto = null) => {
    const li = document.createElement("li");
    li.className = `page-item ${activo ? "active" : ""} ${disabled ? "disabled" : ""}`;
    li.innerHTML = `<button class="page-link" onclick="cambiarPagina(${numero})">${texto || numero}</button>`;
    return li;
  };

  ul.appendChild(crearItem(1, paginaActual === 1));
  if (paginaActual > 3) ul.appendChild(crearItem(null, false, true, '...'));

  const start = Math.max(2, paginaActual - 1);
  const end = Math.min(totalPaginas - 1, paginaActual + 1);

  for (let i = start; i <= end; i++) {
    if (i !== 1 && i !== totalPaginas) {
      ul.appendChild(crearItem(i, paginaActual === i));
    }
  }

  if (paginaActual < totalPaginas - 3) ul.appendChild(crearItem(null, false, true, '...'));
  if (totalPaginas > 3) ul.appendChild(crearItem(totalPaginas, paginaActual === totalPaginas));

  paginacion.appendChild(ul);
}

function cambiarPagina(pagina) {
  paginaActual = pagina;
  renderTabla();
}

// ----------------- AGREGAR DOCUMENTO -----------------
document.getElementById("formDocumento").addEventListener("submit", (e) => {
  e.preventDefault(); // evita refrescar
  abrirModalFormulario("agregar");
  renderTabla();
});

// ----------------- EDITAR DOCUMENTO -----------------
function editarDocumento(id) {
  const doc = documentos.find(d => d.id === id);
  if (!doc) return;
  abrirModalFormulario("editar", doc);
}

// ----------------- ELIMINAR -----------------
function eliminarDocumento(id) {
  const doc = documentos.find(d => d.id === id);
  if (!doc) return;

  documentoAEliminar = doc; 

  const mensaje = document.getElementById('modalEliminarMensaje');
  mensaje.textContent = `¿Está seguro de eliminar "${doc.nombre}"?`;

  modalEliminar.show();
  renderTabla();
  renderPaginacion();
}

// ----------------- DAR DE BAJA/ALTA -----------------
function darDeBaja(id) {
  const doc = documentos.find(d => d.id === id);
  if (!doc) return;
  doc.estado = doc.estado === "activo" ? "inactivo" : "activo";
  renderTabla();
}

// ----------------- VER DETALLE -----------------
function verDetalle(id) {
  const doc = documentos.find(d => d.id === id);
  if (!doc) return;
  abrirModalFormulario("ver", doc);
}


// ----------------- CREAR MODAL DETALLE -----------------
function crearModal() {
  const modalHTML = document.createElement("div");
  modalHTML.innerHTML = `
    <div class="modal fade" id="modalDetalle" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Detalle del documento</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body" id="modalDetalleContenido"></div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modalHTML);
  return new bootstrap.Modal(document.getElementById("modalDetalle"));
}

// ----------------- CREAR MODAL FORMULARIO (Agregar/Editar) -----------------
function crearModalFormulario() {
  const modalHTML = document.createElement("div");
  modalHTML.innerHTML = `
    <div class="modal fade" id="modalFormulario" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="modalFormularioTitulo"></h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form id="formModalDocumento">

              <!-- Nombre -->
              <div class="mb-3">
                <label for="modalNombre" class="form-label">Nombre del documento</label>
                <input type="text" id="modalNombre" class="form-control" required>
              </div>

              <!-- Abreviatura -->
              <div class="mb-3">
                <label for="modalAbreviatura" class="form-label">Abreviatura</label>
                <input type="text" id="modalAbreviatura" class="form-control" required>
              </div>

              <!-- Botón Guardar -->
              <div class="text-end">
                <button type="submit" class="btn btn-primary" id="btnGuardar">Aceptar</button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modalHTML);
  return new bootstrap.Modal(document.getElementById("modalFormulario"));
}

// ----------------- ABRIR MODAL FORMULARIO ----------------- 
function abrirModalFormulario(modo, doc = null) {
  const titulo = document.getElementById("modalFormularioTitulo");
  const inputNombre = document.getElementById("modalNombre");
  const inputAbreviatura = document.getElementById("modalAbreviatura");
  const botonGuardar = document.getElementById("btnGuardar");
  const form = document.getElementById("formModalDocumento");

  // Reset
  inputNombre.disabled = false;
  inputAbreviatura.disabled = false;
  botonGuardar.classList.remove("d-none");

  if (modo === "agregar") {
    titulo.textContent = "Agregar documento";
    inputNombre.value = "";
    inputAbreviatura.value = "";

    form.onsubmit = (e) => {
      e.preventDefault();

      const nombre = inputNombre.value.trim();
      const abreviatura = inputAbreviatura.value.trim();

      if (!nombre || !abreviatura) {
        alert("Complete todos los campos");
        return;
      }

      const duplicado = documentos.some(d =>
        d.nombre.toLowerCase() === nombre.toLowerCase() ||
        d.abreviatura.toLowerCase() === abreviatura.toLowerCase()
      );

      if (duplicado) {
        alert("Ya existe un documento con ese nombre o abreviatura");
        return;
      }

      documentos.push({
        id: Date.now(),
        nombre,
        abreviatura,
        estado: "activo"
      });

      modalFormulario.hide();
      renderTabla();
    };

  } else if (modo === "editar" && doc) {
    titulo.textContent = "Editar documento";
    inputNombre.value = doc.nombre;
    inputAbreviatura.value = doc.abreviatura;

    form.onsubmit = (e) => {
      e.preventDefault();

      const nombre = inputNombre.value.trim();
      const abreviatura = inputAbreviatura.value.trim();

      if (!nombre || !abreviatura) {
        alert("Complete todos los campos");
        return;
      }

      const nombreDuplicado = documentos.some(d =>
        d.nombre.toLowerCase() === nombre.toLowerCase() && d.id !== doc.id
      );

      if (nombreDuplicado) {
        alert("Ya existe un documento con ese nombre");
        return;
      }

      // Actualiza el documento
      doc.nombre = nombre;
      doc.abreviatura = abreviatura;

      modalFormulario.hide();
      renderTabla();
    };

  } else if (modo === "ver" && doc) {
    titulo.textContent = "Detalle del documento";
    inputNombre.value = doc.nombre;
    inputAbreviatura.value = doc.abreviatura;

    inputNombre.disabled = true;
    inputAbreviatura.disabled = true;

    botonGuardar.classList.remove("d-none");

    form.onsubmit = (e) => {
      e.preventDefault();
      modalFormulario.hide();
    };
  }

  modalFormulario.show();
}

// ----------------- ORDENAMIENTO -----------------
document.querySelectorAll("#tablaDocumentos thead th").forEach((th, index) => {
  th.style.cursor = "pointer";
  th.addEventListener("click", () => {
    let campo;
    if (index === 1) campo = "nombre";
    else if (index === 2) campo = "abreviatura";
    
    else return;

    if (ordenActual.campo === campo) {
      ordenActual.ascendente = !ordenActual.ascendente;
    } else {
      ordenActual.campo = campo;
      ordenActual.ascendente = true;
    }
    renderTabla();
  });
});

// ---BUSCAR
const inputDocumento = document.getElementById("inputDocumento");
const btnBuscar = document.getElementById("btn_buscar");

btnBuscar.addEventListener("click", function () {
  const termino = inputDocumento.value.trim().toLowerCase();

  if (termino === "") {
    documentosFiltrados = null; // mostrar todos
  } else {
    documentosFiltrados = documentos.filter(
      (doc) =>
        doc.nombre.toLowerCase().includes(termino) ||
        doc.abreviatura.toLowerCase().includes(termino)
    );
  }

  paginaActual = 1;
  renderTabla();
});


renderTabla();