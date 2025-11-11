// =========================================================
// reserva_requisito.js - Lógica con Roles (Feligres/Secretaria/Admin) CORREGIDO Y UNIFICADO
// =========================================================

let archivosSeleccionados = {}; // Archivos temporales del Feligres

// ==============================
// FUNCIONES AUXILIARES
// ==============================
function obtenerRolUsuario() {
    return document.body.dataset.rol ? document.body.dataset.rol.toLowerCase() : 'feligres'; 
}

function volverPasoAnterior() {
    // 💡 Paso clave: Guardar el estado actual de los requisitos antes de salir
    guardarRequisitos();
    window.location.href = '/cliente/reserva_datos'; 
}

// Manejo de selección de archivo
function manejarCambioArchivo(event) {
    const input = event.target;
    const idRequisito = input.dataset.idRequisito;
    const archivo = input.files[0];
    const mensajeErrorEl = document.getElementById(`error-${idRequisito}`);
    
    if (mensajeErrorEl) mensajeErrorEl.remove();
    input.classList.remove('is-invalid');

    if (archivo) {
        const tipoArchivo = archivo.type;
        const tiposPermitidos = ['application/pdf', 'image/jpeg', 'image/jpg'];
        
        if (!tiposPermitidos.includes(tipoArchivo)) {
            input.classList.add('is-invalid');
            const errorDiv = document.createElement('div');
            errorDiv.className = 'invalid-feedback d-block';
            errorDiv.id = `error-${idRequisito}`;
            errorDiv.textContent = '⚠️ Solo se permiten archivos PDF, JPG o JPEG.';
            input.parentNode.insertBefore(errorDiv, input.nextSibling);

            delete archivosSeleccionados[idRequisito];
            input.value = ''; 
            return;
        }

        archivosSeleccionados[idRequisito] = {
            file: archivo,
            tipo: tipoArchivo.split('/')[1].toUpperCase()
        };
        console.log(`✅ Archivo válido para requisito ${idRequisito}: ${archivo.name}`);
    } else {
        delete archivosSeleccionados[idRequisito];
        console.log(`❌ Archivo deseleccionado para requisito ${idRequisito}.`);
    }
}

// ==============================
// GUARDAR REQUISITOS (Función de guardado independiente)
// ==============================
function guardarRequisitos() {
    const rol = obtenerRolUsuario();
    const requisitosContainer = document.getElementById('requisitos-lista');
    const reservaData = JSON.parse(sessionStorage.getItem('reserva') || '{}');
    reservaData.requisitos = reservaData.requisitos || {};
    const requisitosGuardados = reservaData.requisitos;
    let datosRequisitosNuevos = {};

    // Obtener la fecha de hoy en formato YYYY-MM-DD una sola vez
    const fechaHoy = new Date().toISOString().split('T')[0];

    // Función auxiliar para calcular la vigencia de PLAZO (Hoy + 7 días)
    const calcularVigenciaPlazo = () => {
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() + 7);
        return fechaLimite.toISOString().split('T')[0];
    };
    
    // Calcular el plazo de 7 días una sola vez (se usa siempre para vigencia)
    const plazoSieteDias = calcularVigenciaPlazo(); 


    if (rol === 'feligres') {
        const inputFiles = requisitosContainer.querySelectorAll('input[type="file"]');
        
        inputFiles.forEach(input => {
            const idRequisito = input.dataset.idRequisito;
            const nombreRequisito = input.dataset.nombreRequisito;
            const archivoData = archivosSeleccionados[idRequisito]; 
            const metaDataPrevia = requisitosGuardados[idRequisito] || {};
            const idActoRequisito = metaDataPrevia.idActoRequisito || input.dataset.idActoRequisito || null;

            const archivoNuevo = !!archivoData?.file;
            const archivoPreviamenteGuardado = !!metaDataPrevia.rutaArchivo && metaDataPrevia.nombreArchivo !== 'NO CUMPLIDO'; 
            
            // Se considera cumplido si se subió uno nuevo O ya había uno guardado
            const archivoPresente = archivoNuevo || archivoPreviamenteGuardado; 

            let fSubidoFinal = null;
            let nombreArchivoFinal = "NO CUMPLIDO";
            let rutaArchivoFinal = null;
            let tipoArchivoFinal = null;

            if (archivoPresente) {
                // REGLA 1: Cumplido -> f_subido = HOY
                fSubidoFinal = fechaHoy;
                
                // Priorizar el archivo nuevo, sino el metadata previo
                nombreArchivoFinal = archivoNuevo ? archivoData.file.name : metaDataPrevia.nombreArchivo;
                rutaArchivoFinal = archivoNuevo ? `/temporal/${idRequisito}_${archivoData.file.name}` : metaDataPrevia.rutaArchivo;
                tipoArchivoFinal = archivoNuevo ? archivoData.tipo : metaDataPrevia.tipoArchivo;

            } else {
                // REGLA 2: No Cumplido -> f_subido = NULL
                fSubidoFinal = null;
            }

            datosRequisitosNuevos[idRequisito] = {
                idActoRequisito,
                nombre: nombreRequisito,
                
                nombreArchivo: nombreArchivoFinal,
                archivoListo: !!archivoPresente,
                rutaArchivo: rutaArchivoFinal,
                tipoArchivo: tipoArchivoFinal,
                
                // ✨ Asignación final de Fechas/Vigencia
                f_subido: fSubidoFinal,
                // Vigencia SIEMPRE es de 7 días, sin importar el estado.
                vigenciaDocumento: plazoSieteDias, 
                
                aprobado: false,
                estadoCumplido: archivoPresente ? 'CUMPLIDO' : 'NO_CUMPLIDO'
            };
        });
    } else if (rol === 'secretaria' || rol === 'administrador') {
        const checkboxes = requisitosContainer.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            const idRequisito = checkbox.dataset.idRequisito;
            const nombreRequisito = checkbox.dataset.nombreRequisito;
            const idActoRequisito = checkbox.dataset.idActoRequisito || null;

            // LEER DATOS PREVIOS DIRECTAMENTE DE SESSION STORAGE (más seguro)
            const metaDataPrevia = requisitosGuardados[idRequisito] || {};

            // ¡USAR LET!
            let nombreArchivo = metaDataPrevia.nombreArchivo || 'NO CUMPLIDO';
            let rutaArchivo = metaDataPrevia.rutaArchivo || null;
            let tipoArchivo = metaDataPrevia.tipoArchivo || null;
            
            let fechaSubidaFinal = null;
            let estadoCumplidoFinal;

            if (checkbox.checked) {
                // REGLA 1: Cumplido (Check marcado) -> f_subido = HOY
                estadoCumplidoFinal = 'CUMPLIDO';
                
                fechaSubidaFinal = fechaHoy; 
                
                if (nombreArchivo === 'NO CUMPLIDO') {
                    nombreArchivo = 'ENTREGADO (Manual)'; 
                }

            } else {
                // REGLA 2: No Cumplido (Check desmarcado) -> f_subido = NULL
                estadoCumplidoFinal = 'NO_CUMPLIDO';
                
                // Resetear metadata de archivo y fechas
                nombreArchivo = 'NO CUMPLIDO';
                rutaArchivo = null;
                tipoArchivo = null;
                fechaSubidaFinal = null; 
            }

            datosRequisitosNuevos[idRequisito] = {
                idActoRequisito,
                nombre: nombreRequisito,
                
                nombreArchivo: nombreArchivo,
                archivoListo: !!rutaArchivo,
                rutaArchivo: rutaArchivo,
                tipoArchivo: tipoArchivo,
                
                // ✨ Asignación de fechas y estado
                f_subido: fechaSubidaFinal,
                // Vigencia SIEMPRE es de 7 días, sin importar el estado.
                vigenciaDocumento: plazoSieteDias, 
                
                aprobado: false,
                entregado: checkbox.checked,
                estadoCumplido: estadoCumplidoFinal
            };
        });
    }

    // Merge profundo
    Object.keys(datosRequisitosNuevos).forEach(id => {
        // Al fusionar, los nuevos datos tienen prioridad y están completos
        reservaData.requisitos[id] = {
            ...reservaData.requisitos[id], // Mantiene metadata no modificada
            ...datosRequisitosNuevos[id] // Sobrescribe con los datos de entrada corregidos
        };
    });

    sessionStorage.setItem('reserva', JSON.stringify(reservaData));
    console.log('📌 Requisitos guardados:', reservaData.requisitos);
}


// ==============================
// GUARDAR REQUISITOS Y CONTINUAR
// ==============================
function guardarRequisitosYContinuar() {
// ... (resto de la función es correcto)
    const rol = obtenerRolUsuario();
    const termsCheckbox = document.getElementById('terms-autorizacion');

    // 1. Validar solo si es feligrés e intenta continuar
    if (rol === 'feligres') {
        if (!termsCheckbox || !termsCheckbox.checked) {
            alert("⚠️ Debes aceptar los términos y condiciones antes de continuar.");
            return;
        }
    }
    
    // 2. Guardar los datos de los requisitos
    guardarRequisitos();

    // 3. Redirigir al siguiente paso
    window.location.href = '/cliente/reserva_resumen';
}

// ==============================
// GENERACIÓN DINÁMICA DE UI
// ==============================
function generarUIRequisitos(listaRequisitos, container, rol, reservaData) {
// ... (resto de la función es correcto)
    if (!container) return;
    
    container.innerHTML = '';
    const requisitosGuardados = reservaData.requisitos || {};

    if (rol === 'feligres') {
        const info = document.createElement('p');
        info.className = 'alert alert-info small mt-3';
        info.innerHTML = '<i class="fas fa-info-circle"></i> Nota: Cada documento tiene 7 días para cambios. PDF/JPG/JPEG.';
        container.appendChild(info);
    }

    if (!listaRequisitos || listaRequisitos.length === 0) {
        container.innerHTML = '<p class="alert alert-success">✅ No se encontraron requisitos para este acto.</p>';
        return;
    }

    listaRequisitos.forEach(requisito => {
        const idRequisito = requisito.id;
        const metaDataPrevia = requisitosGuardados[idRequisito] || {};

        const card = document.createElement('div');
        card.className = 'card mb-3 shadow-sm border-info';


        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';

        const titulo = document.createElement('h5');
        titulo.className = 'card-title';
        titulo.textContent = requisito.nombRequisito + (requisito.obligatorio ? ' *' : '');

        const descripcion = document.createElement('p');
        descripcion.className = 'card-text text-muted small';
        descripcion.textContent = requisito.descripcion;

        cardBody.appendChild(titulo);
        cardBody.appendChild(descripcion);

        if (rol === 'feligres') {
            const archivoYaCargado = !!metaDataPrevia.rutaArchivo || !!archivosSeleccionados[idRequisito];

            if (archivoYaCargado && metaDataPrevia.nombreArchivo && metaDataPrevia.nombreArchivo !== 'NO CUMPLIDO') {
                const infoExistente = document.createElement('p');
                infoExistente.className = 'text-success small font-weight-bold';
                infoExistente.innerHTML = `<i class="fas fa-check-circle"></i> Archivo previamente subido: <strong>${metaDataPrevia.nombreArchivo}</strong> (Suba uno nuevo para reemplazar)`;
                cardBody.appendChild(infoExistente);
            }

            const input = document.createElement('input');
            input.type = 'file';
            input.className = 'form-control-file mt-2';
            input.id = `requisito-file-${idRequisito}`;
            input.dataset.idRequisito = idRequisito;
            input.dataset.idActoRequisito = requisito.idActoRequisito;
            input.dataset.nombreRequisito = requisito.nombRequisito;
            input.accept = ".pdf, .jpg, .jpeg";
            if (requisito.obligatorio && !archivoYaCargado) input.required = true;
            input.addEventListener('change', manejarCambioArchivo);
            cardBody.appendChild(input);

        } else if (rol === 'secretaria' || rol === 'administrador') {
            const nombreArchivo = metaDataPrevia.nombreArchivo || 'No subido';
            const entregado = metaDataPrevia.entregado === true;

            const archivoInfo = document.createElement('p');
            archivoInfo.className = entregado ? 'text-success' : 'text-danger';
            archivoInfo.innerHTML = `
                Estado: <strong>${entregado ? 'CUMPLIDO' : 'NO CUMPLIDO'}</strong>
            `;
            cardBody.appendChild(archivoInfo);

            const checkDiv = document.createElement('div');
            checkDiv.className = 'form-check mt-2';

            const inputCheck = document.createElement('input');
            inputCheck.type = 'checkbox';
            inputCheck.className = 'form-check-input';
            inputCheck.id = `requisito-check-${idRequisito}`;
            inputCheck.checked = entregado;
            inputCheck.dataset.idRequisito = idRequisito;
            inputCheck.dataset.idActoRequisito = requisito.idActoRequisito;
            inputCheck.dataset.nombreRequisito = requisito.nombRequisito;
            
            // Los data-attributes ahora solo son para la UI o debug, la lógica usa sessionStorage.
            inputCheck.dataset.nombreArchivo = metaDataPrevia.nombreArchivo || 'NO CUMPLIDO';
            inputCheck.dataset.rutaArchivo = metaDataPrevia.rutaArchivo || null;
            inputCheck.dataset.tipoArchivo = metaDataPrevia.tipoArchivo || null;
            inputCheck.dataset.fSubido = metaDataPrevia.f_subido || null;
            inputCheck.dataset.vigenciaDocumento = metaDataPrevia.vigenciaDocumento || null;
            
            const labelCheck = document.createElement('label');
            labelCheck.className = 'form-check-label font-weight-bold';
            labelCheck.htmlFor = inputCheck.id;
            labelCheck.textContent = 'Entregado';

            checkDiv.appendChild(inputCheck);
            checkDiv.appendChild(labelCheck);
            cardBody.appendChild(checkDiv);
        }

        card.appendChild(cardBody);
        container.appendChild(card);
    });
}

// ==============================
// INICIALIZACIÓN
// ==============================
document.addEventListener('DOMContentLoaded', () => {
// ... (resto de la función es correcto)
    const rolUsuario = obtenerRolUsuario();
    const datosReservaString = sessionStorage.getItem('reserva');
    const requisitosContainer = document.getElementById('requisitos-lista');
    const btnSiguiente = document.getElementById('btn-siguiente'); 
    const btnAtras = document.getElementById('btn-atras'); 
    const termsCheckbox = document.getElementById('terms-autorizacion');

    // Inicializar archivosSeleccionados desde sessionStorage (metadata, no el archivo en sí)
    if (datosReservaString) {
        const reservaData = JSON.parse(datosReservaString);
        archivosSeleccionados = {};
        if (reservaData.requisitos) {
            Object.keys(reservaData.requisitos).forEach(id => {
                const req = reservaData.requisitos[id];
                // Solo inicializa si se subió un archivo válido antes
                if (req.archivoListo && req.rutaArchivo && req.nombreArchivo !== 'NO CUMPLIDO') { 
                    archivosSeleccionados[id] = { file: null, tipo: req.tipoArchivo };
                }
            });
        }
    }

    const termsContainer = termsCheckbox ? termsCheckbox.closest('.form-check') : null;
    if (termsContainer) {
        if (rolUsuario === 'feligres') {
            termsContainer.style.display = '';
            // No fuerces a false si ya estaba checked y volvio a este paso
            // termsCheckbox.checked = false; 
        } else {
            termsContainer.style.display = 'none';
        }
    }

    if (!datosReservaString || !requisitosContainer) return;

    let reservaData = JSON.parse(datosReservaString);
    const idActo = reservaData.idActo;

    if (!idActo) {
        requisitosContainer.innerHTML = '<p class="text-warning">⚠️ No se ha seleccionado un acto. Vuelve al Paso 1.</p>';
        return;
    }

    // Inicializamos requisitos si no existen
    reservaData.requisitos = reservaData.requisitos || {};
    sessionStorage.setItem('reserva', JSON.stringify(reservaData));

    fetch(`/api/requisito/${idActo}`)
        .then(resp => resp.ok ? resp.json() : Promise.reject(`HTTP ${resp.status}`))
        .then(data => {
            const requisitos = data.datos;
            generarUIRequisitos(requisitos, requisitosContainer, rolUsuario, reservaData);
        })
        .catch(err => {
            console.error("❌ Error cargando requisitos:", err);
            requisitosContainer.innerHTML = `<p class="alert alert-danger">Error: ${err}</p>`;
        });

    if (btnSiguiente) btnSiguiente.addEventListener('click', guardarRequisitosYContinuar);
    if (btnAtras) btnAtras.addEventListener('click', volverPasoAnterior);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault(); 
            guardarRequisitosYContinuar();
        }
        if (e.key === 'Backspace' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault(); 
            volverPasoAnterior();
        }
    });
});