// =========================================================
// reserva_requisito.js - Lógica con Roles (Feligrés/Secretario)
// =========================================================

// Almacena los objetos File seleccionados temporalmente (solo usado por el Feligrés).
let archivosSeleccionados = {}; 

// ==============================
// PARTE 1: NAVEGACIÓN Y ALMACENAMIENTO DE DATOS
// ==============================


function obtenerRolUsuario() {
    return document.body.dataset.rol ? document.body.dataset.rol.toLowerCase() : 'feligres'; 
}

function volverPasoAnterior() {
    window.location.href = '/cliente/reserva_participante'; 
}

/**
 * Handler para validar el tipo de archivo y almacenarlo en caché.
 */
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
            input.value = ''; // Limpiar el input si es inválido
            return;
        }

        archivosSeleccionados[idRequisito] = {
            file: archivo,
            tipo: tipoArchivo.split('/')[1].toUpperCase()
        };
        console.log(`✅ Archivo seleccionado y válido para el requisito ${idRequisito}: ${archivo.name}, Tipo: ${archivosSeleccionados[idRequisito].tipo}`);
    } else {
        // Si el input se limpia o deselecciona
        delete archivosSeleccionados[idRequisito];
        console.log(`❌ Archivo deseleccionado para el requisito ${idRequisito}.`);
    }
}

/**
 * Recolecta la información según el rol, actualiza 'reservaData' y avanza.
 */
function guardarRequisitosYContinuar() {
    const rol = obtenerRolUsuario();
    const requisitosContainer = document.getElementById('requisitos-lista');
    let formValido = true;
    const datosRequisitos = {};
    
    // 1. LÓGICA DE RECOLECCIÓN Y VALIDACIÓN
    if (rol === 'feligres') {
        const inputFiles = requisitosContainer.querySelectorAll('input[type="file"]');
        const termsCheckbox = document.getElementById('terms-autorizacion');

        if (!termsCheckbox || !termsCheckbox.checked) {
            alert("⚠️ Debes aceptar los términos y condiciones antes de continuar.");
            return;
        }
        
        inputFiles.forEach(input => {
            const idRequisito = input.dataset.idRequisito;
            const nombreRequisito = input.dataset.nombreRequisito;
            const archivoData = archivosSeleccionados[idRequisito];
            
            // --- CÁLCULO DE METADATOS (null si no se subió) ---
            let rutaArchivo = null;
            let tipoArchivo = null;
            let fechaSubida = null;
            let vigenciaDocumento = null;
            let estadoCumplimiento = 'PENDIENTE';
            
            if (archivoData && archivoData.file) {
                // Si el archivo SÍ se subió y es válido:
                fechaSubida = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
                
                const fechaLimite = new Date();
                fechaLimite.setDate(fechaLimite.getDate() + 7);
                vigenciaDocumento = fechaLimite.toISOString().split('T')[0];
                
                estadoCumplimiento = 'CUMPLIDO';
                tipoArchivo = archivoData.tipo;
                rutaArchivo = `/temporal/${idRequisito}_${archivoData.file.name}`; 
                
                input.classList.remove('is-invalid');
            } else if (input.required) {
                // Si es requerido y NO se subió:
                formValido = false;
                input.classList.add('is-invalid');
            }
            
            // 2. ALMACENAMIENTO DE METADATOS EN EL OBJETO DE RESERVA
            datosRequisitos[idRequisito] = {
                nombre: nombreRequisito,
                nombreArchivo: archivoData ? archivoData.file.name : "PENDIENTE",
                archivoListo: !!archivoData,
                
                rutaArchivo: rutaArchivo,
                tipoArchivo: tipoArchivo,
                f_subido: fechaSubida,
                vigenciaDocumento: vigenciaDocumento,
                
                estadoCumplimiento: estadoCumplimiento, 
                aprobado: false 
            };
        });

        if (!formValido) {
            alert("⚠️ Por favor, sube un archivo (PDF/JPG) para todos los requisitos obligatorios antes de continuar.");
            return;
        }

    } else if (rol === 'secretario' || rol === 'admin') {
        // Lógica del secretario: recolecta el estado de aprobación
        const checkboxes = requisitosContainer.querySelectorAll('input[type="checkbox"]');
        
        checkboxes.forEach(checkbox => {
            const idRequisito = checkbox.dataset.idRequisito;
            
            datosRequisitos[idRequisito] = {
                nombre: checkbox.dataset.nombreRequisito,
                nombreArchivo: checkbox.dataset.nombreArchivo || 'N/A',
                archivoListo: (checkbox.dataset.nombreArchivo && checkbox.dataset.nombreArchivo !== 'N/A'),
                
                rutaArchivo: checkbox.dataset.rutaArchivo || null,
                tipoArchivo: checkbox.dataset.tipoArchivo || null,
                f_subido: checkbox.dataset.fSubido || null,
                vigenciaDocumento: checkbox.dataset.vigenciaDocumento || null,
                
                estadoCumplimiento: checkbox.dataset.estadoCumplimiento || 'PENDIENTE',
                aprobado: checkbox.checked // Toma el valor actual del checkbox (puede ser true/false)
            };
        });
        
    } else {
        console.error("Rol de usuario no reconocido. Abortando guardado.");
        return;
    }
    
    // 3. ACTUALIZAR y GUARDAR el objeto de reserva en sessionStorage
    const datosReservaString = sessionStorage.getItem('reserva');
    let reservaData = JSON.parse(datosReservaString || '{}');
    
    reservaData.requisitos = datosRequisitos; 
    
    sessionStorage.setItem('reserva', JSON.stringify(reservaData));
    console.log(`✅ Datos de requisitos (Rol: ${rol}) guardados en sessionStorage.`);

    // 4. Redirigir al siguiente paso
    window.location.href = '/cliente/reserva_resumen'; 
}


// ==============================
// PARTE 2: GENERACIÓN DINÁMICA DE ELEMENTOS
// ==============================

/**
 * Genera la UI de requisitos basada en el rol del usuario.
 */
function generarUIRequisitos(listaRequisitos, container, rol) {
    if (!container) return;
    
    container.innerHTML = ''; 

    // Mensaje de vigencia unificado para el feligrés
    if (rol === 'feligres') {
        const vigenciaGeneral = document.createElement('p');
        vigenciaGeneral.className = 'alert alert-info small mt-3';
        vigenciaGeneral.innerHTML = '<i class="fas fa-info-circle"></i> **Nota:** Una vez subido cada documento, tendrá **7 días** para realizar cambios. Asegúrese de subir archivos PDF o imágenes (JPG/JPEG).';
        container.appendChild(vigenciaGeneral);
    }

    if (listaRequisitos && listaRequisitos.length > 0) {
        
        listaRequisitos.forEach(requisito => {
            const formGroup = document.createElement('div');
            formGroup.className = 'form-group mb-4 p-3 border rounded shadow-sm';
            
            const titulo = document.createElement('h5');
            titulo.textContent = requisito.nombRequisito;

            const descripcion = document.createElement('p');
            descripcion.className = 'text-muted small';
            descripcion.textContent = requisito.descripcion;
            
            formGroup.appendChild(titulo);
            formGroup.appendChild(descripcion);
            
            // --- FELIGRÉS: Subida de Archivo ---
            if (rol === 'feligres') {
                const idInput = `requisito-file-${requisito.id}`; 
                const input = document.createElement('input');
                input.type = 'file';
                input.className = 'form-control-file mt-2';
                input.id = idInput;
                input.name = idInput; 
                input.required = true; 
                input.accept = ".pdf, .jpg, .jpeg"; 
                input.dataset.idRequisito = requisito.id;
                input.dataset.nombreRequisito = requisito.nombRequisito;

                input.addEventListener('change', manejarCambioArchivo); 
                
                formGroup.appendChild(input);
                
            // --- SECRETARIO/ADMIN: Aprobación ---
            } else if (rol === 'secretario' || rol === 'admin') {
                const idCheck = `requisito-check-${requisito.id}`;
                
                // Simulación/Datos previos (estos datos deben venir de la API real de reserva)
                // Se asume que la API debe devolver estos campos si el documento ya fue cargado
                const archivoExistente = requisito.archivoCargado || { nombre: 'No subido', url: '#', estado: 'PENDIENTE', tipo: 'N/A', ruta: null, fSubido: null, vigencia: null }; 
                const nombreArchivo = archivoExistente.nombre;
                const estaAprobado = requisito.aprobado || false; 
                const estadoCumplimiento = archivoExistente.estado || 'PENDIENTE';
                
                const archivoInfo = document.createElement('p');
                archivoInfo.className = nombreArchivo !== 'No subido' ? 'text-success' : 'text-danger';
                archivoInfo.innerHTML = `
                    <i class="fas fa-file-alt"></i> Archivo Subido: 
                    <strong>
                        ${nombreArchivo !== 'No subido' 
                            ? `<a href="${archivoExistente.url}" target="_blank">${nombreArchivo}</a> (Tipo: ${archivoExistente.tipo})`
                            : nombreArchivo}
                    </strong>
                    <br>
                    Estado de Cumplimiento: <strong>${estadoCumplimiento}</strong>
                `;
                formGroup.appendChild(archivoInfo);

                if (nombreArchivo !== 'No subido') {
                    const checkDiv = document.createElement('div');
                    checkDiv.className = 'form-check mt-3';

                    const inputCheck = document.createElement('input');
                    inputCheck.type = 'checkbox';
                    inputCheck.className = 'form-check-input';
                    inputCheck.id = idCheck;
                    inputCheck.checked = estaAprobado; // Usa el estado de la API o false
                    inputCheck.dataset.idRequisito = requisito.id;
                    inputCheck.dataset.nombreRequisito = requisito.nombRequisito;
                    inputCheck.dataset.nombreArchivo = nombreArchivo;
                    // Adjuntar todos los metadatos para que el guardar los recoja
                    inputCheck.dataset.tipoArchivo = archivoExistente.tipo;
                    inputCheck.dataset.estadoCumplimiento = estadoCumplimiento;
                    inputCheck.dataset.rutaArchivo = archivoExistente.ruta;
                    inputCheck.dataset.fSubido = archivoExistente.fSubido;
                    inputCheck.dataset.vigenciaDocumento = archivoExistente.vigencia;

                    const labelCheck = document.createElement('label');
                    labelCheck.className = 'form-check-label font-weight-bold text-primary';
                    labelCheck.htmlFor = idCheck;
                    labelCheck.textContent = 'Marcar como Aprobado (Verificado y Conforme)';

                    checkDiv.appendChild(inputCheck);
                    checkDiv.appendChild(labelCheck);
                    formGroup.appendChild(checkDiv);
                }
            }

            container.appendChild(formGroup);
        });
    } else {
        container.innerHTML = '<p class="alert alert-success">✅ No se encontraron requisitos configurados para este acto. Puede continuar.</p>';
    }
}


// ==============================
// PARTE 3: INICIALIZACIÓN (DOMContentLoaded)
// ==============================
document.addEventListener('DOMContentLoaded', () => {
    const rolUsuario = obtenerRolUsuario();
    
    // Obtener datos de reserva y contenedores
    const datosReservaString = sessionStorage.getItem('reserva');
    const requisitosContainer = document.getElementById('requisitos-lista');
    const tituloActoEl = document.getElementById('titulo-acto');
    const btnSiguiente = document.getElementById('btn-siguiente'); 
    const btnAtras = document.getElementById('btn-atras'); 

    // 🔑 CORRECCIÓN CRUCIAL: Asegurar que el checkbox de términos esté desmarcado al cargar
    const termsCheckbox = document.getElementById('terms-autorizacion');
    if (termsCheckbox) {
        termsCheckbox.checked = false;
    }

    if (!datosReservaString || !requisitosContainer) {
        if (requisitosContainer) {
            requisitosContainer.innerHTML = '<p class="text-danger">⚠️ Error: Datos de reserva o contenedor no encontrados.</p>';
        }
        return;
    }

    const reservaData = JSON.parse(datosReservaString);
    const idActo = reservaData.idActo;
    const nombreActo = reservaData.nombreActo;
    
    if (!idActo) {
        requisitosContainer.innerHTML = '<p class="text-warning">⚠️ No se ha seleccionado un acto litúrgico. Vuelve al Paso 1.</p>';
        return;
    }


    // 1. Llamar a la API para obtener requisitos
    const fetchUrl = `/api/requisito/${idActo}`; 
    console.log(`📡 Llamando a la API de Requisitos (Rol: ${rolUsuario}): ${fetchUrl}`);

    fetch(fetchUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error ${response.status}: No se pudo cargar los requisitos.`);
            }
            return response.json();
        })
        .then(data => {
            const requisitos = data.datos; 
            generarUIRequisitos(requisitos, requisitosContainer, rolUsuario);
        })
        .catch(error => {
            console.error("❌ Error en la llamada a la API de requisitos:", error);
            if (requisitosContainer) {
                 requisitosContainer.innerHTML = `<p class="alert alert-danger">❌ Error de conexión al cargar requisitos: ${error.message}</p>`;
            }
        });
        
    // 2. Manejo de botones de navegación
    if (btnSiguiente) {
        btnSiguiente.addEventListener('click', guardarRequisitosYContinuar);
    }
    
    if (btnAtras) {
        btnAtras.addEventListener('click', volverPasoAnterior);
    }
    
    // 3. Manejo de Teclado
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault(); 
            guardarRequisitosYContinuar();
        }
        
        if (e.key === 'Backspace' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
            e.preventDefault(); 
            volverPasoAnterior();
        }
    });
});