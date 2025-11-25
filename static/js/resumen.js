document.addEventListener('DOMContentLoaded', async () => {

    // --- Configuración de API y Constantes ---
    const API_URL_PERFIL = '/api/usuario/perfil/datos';
    const API_URL_NUEVA_RESERVA = '/api/reserva/nueva_reserva';
    // ✅ CORRECCIÓN APLICADA: La URL completa para el endpoint de registro de documentos.
    const API_URL_REGISTRAR_DOC = '/api/requisito/registrar_documento'; 
    const API_URL_REGISTRAR_PARTICIPANTE = '/api/acto/registrar_participante';
    const VALOR_VACIO = '<span class="text-danger font-italic">No agregado</span>';

    // --- Elementos DOM ---
    const bodyElement = document.body;
    const solicitanteDataContainer = document.getElementById('solicitante_data');
    const parroquiaActoDataContainer = document.getElementById('parroquia_acto_data');
    const participantesDataContainer = document.getElementById('participantes_data');
    const mensajeErrorContainer = document.getElementById('mensajeError'); // Mantener para mensajes de estado

    const btnAtras = document.querySelector('.btn-prev');
    const btnConfirmar = document.querySelector('.btn-next');
    
    // 🛑 ELEMENTOS DEL MODAL ELIMINADOS

    // 💡 LECTURA DIRECTA DE LOS DATOS DEL BODY (Rol y ID de Sesión)
    const rolUsuario = bodyElement.dataset.rol ? bodyElement.dataset.rol.toLowerCase() : null;
    const idUsuarioSesion = bodyElement.dataset.id; // El ID del usuario autenticado (quien registra)

    // --- Validación inicial: si no hay reserva o rol, reiniciar y redirigir ---
    const datosReservaString = sessionStorage.getItem('reserva');
    // Nota: Corregí la redirección por defecto de vuelta a /principal, ya que antes estaba a /cliente/reserva_inicio.
    if (!datosReservaString || !rolUsuario) {
        sessionStorage.clear();
        window.location.href = '/principal'; 
        return;
    }
    let reservaData = JSON.parse(datosReservaString);
    
    // 📢 NUEVA CONSOLA DE DEPURACIÓN CRÍTICA
    console.log("[DEPURACIÓN INICIAL] Objeto de Reserva cargado desde SessionStorage:", reservaData);


    // --- Funciones utilitarias ---
    function formatValue(value) {
        return value && String(value).trim() !== '' ? value : VALOR_VACIO;
    }

    /**
     * Muestra un mensaje de estado al usuario en el contenedor de mensajes.
     */
    function mostrarMensaje(mensaje, tipo) {
        if (mensajeErrorContainer) {
            const baseClasses = "p-3 my-4 rounded-lg text-white font-weight-bold";
            let colorClass;
            switch (tipo) {
                case 'success':
                    colorClass = 'bg-success';
                    break;
                case 'info':
                    colorClass = 'bg-info';
                    break;
                case 'error':
                    colorClass = 'bg-danger';
                    break;
                default:
                    colorClass = 'bg-secondary';
            }
            mensajeErrorContainer.innerHTML = `<p class="${baseClasses} ${colorClass}">${mensaje}</p>`;
        }
    }
    
// ---------------------------------------------------------------------------------------------------

    // =========================================================
    // 1. Cargar datos del Solicitante (Asegura idSolicitante e idUsuario)
    // =========================================================
    async function cargarDatosSolicitante() {
        if (!solicitanteDataContainer) return false;

        // LECTURA DE DATOS CRÍTICOS DE LA SESIÓN/BODY
        const rolUsuario = bodyElement.dataset.rol ? bodyElement.dataset.rol.toLowerCase() : null;
        const idUsuarioSesion = bodyElement.dataset.id; // El ID del usuario autenticado

        if (!idUsuarioSesion) {
            solicitanteDataContainer.innerHTML = `<p class="alert alert-danger">Error: ID de Usuario de Sesión no encontrado en el Body.</p>`;
            return false;
        }

        if (rolUsuario === 'feligres') {

                let datos = {};
                let exitoVisual = true;

                try {
                    const response = await fetch(API_URL_PERFIL);
                    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

                    const data = await response.json();

                    if (data.ok && data.datos) {
                        datos = data.datos;

                        // ✅ CORRECCIÓN CLAVE: idSolicitante se toma del API
                        reservaData.idSolicitante = datos.idFeligres || idUsuarioSesion; // fallback seguro
                        reservaData.idUsuario = idUsuarioSesion; // quien registra
                        sessionStorage.setItem('reserva', JSON.stringify(reservaData));

                    } else {
                        exitoVisual = false;
                    }

                } catch (error) {
                    exitoVisual = false;
                    console.error('❌ Fallo al obtener datos del API de perfil:', error);
                }

                const nombreCompleto = formatValue(`${datos.nombFel || ''} ${datos.apePatFel || ''} ${datos.apeMatFel || ''}`);

                solicitanteDataContainer.innerHTML = `
                    <p><strong>Nombre completo:</strong> ${nombreCompleto}</p>
                    <p><strong>Email:</strong> ${formatValue(datos.email)}</p>
                    <p><strong>DNI/Documento:</strong> ${formatValue(datos.numDocFel)}</p>
                    <p><strong>Teléfono:</strong> ${formatValue(datos.telefonoFel)}</p>
                    <p><strong>Dirección:</strong> ${formatValue(datos.direccionFel)}</p>
                `;

                if (!exitoVisual) {
                    solicitanteDataContainer.innerHTML += `<p class="alert alert-warning small mt-3">Advertencia: No se pudieron cargar todos los datos del perfil. Los IDs de reserva se han intentado establecer.</p>`;
                }

                return true;
            }
            else if (rolUsuario === 'secretaria' || rolUsuario === 'administrador') {
            // Secretaria/Admin
            const datos = reservaData.solicitante || {};

            // CLAVE: Extraer idSolicitante (que es datos.idUsuario) de reservaData.solicitante y el idUsuario de la Sesión

            // Se corrige la condición: se debe verificar la existencia del ID de usuario del solicitante (datos.idUsuario)
            // en lugar de un idSolicitante que no existe en el objeto 'solicitante'.
            if (datos.idUsuario && idUsuarioSesion) {
                
                // Asignación de IDs:
                // 1. El ID del solicitante (quien pidió la misa) es datos.idUsuario (e.g., 1)
                reservaData.idSolicitante = datos.idUsuario; 
                
                // 2. El ID de usuario (el secretario que registra) es idUsuarioSesion
                reservaData.idUsuario = idUsuarioSesion;
                
                sessionStorage.setItem('reserva', JSON.stringify(reservaData));

                const nombreCompleto = formatValue(
                    datos.nombreCompleto || `${datos.nombFel || ''} ${datos.apePatFel || ''} ${datos.apeMatFel || ''}`
                );

                solicitanteDataContainer.innerHTML = `
                    <p><strong>Nombre completo:</strong> ${nombreCompleto}</p>
                    <p><strong>DNI/Documento:</strong> ${formatValue(datos.numDoc || datos.numDocFel)}</p>
                    <p><strong>Teléfono:</strong> ${formatValue(datos.telefono || datos.telefonoFel)}</p>
                    <p><strong>Dirección:</strong> ${formatValue(datos.direccionFel)}</p>
                `;
                return true;
            } else {
                solicitanteDataContainer.innerHTML = `<p class="alert alert-danger">Error: Falta ID de Solicitante o de Usuario de Sesión (Sec/Admin).</p>`;
                return false;
            }
        }
        return false; // Rol no manejado
    }

// ---------------------------------------------------------------------------------------------------

    // =========================================================
    // 2. Cargar Resumen de Parroquia y Acto (Visual)
    // =========================================================
    function cargarResumenActo() {
        if (!parroquiaActoDataContainer) return;

        const costo = parseFloat(reservaData.costoBase || 0);
        const costoFormateado = costo > 0 
            ? `<span class="text-success font-weight-bold">S/ ${costo.toFixed(2)}</span>` 
            : '<span class="badge badge-success">Gratuito</span>';

        const observaciones = formatValue(reservaData.observaciones); 

        parroquiaActoDataContainer.innerHTML = `
            <p><strong>Parroquia:</strong> ${formatValue(reservaData.nombreParroquia)}</p>
            <p><strong>Acto Litúrgico:</strong> ${formatValue(reservaData.nombreActo)}</p>
            <p><strong>Fecha y Hora:</strong> ${formatValue(reservaData.fecha)} a las ${formatValue(reservaData.hora)}</p>
            <p><strong>Costo Base:</strong> ${costoFormateado}</p>
            <hr style="margin: 15px 0; border-color: #eee;">
            <p><strong>Peticiones:</strong> ${observaciones}</p> 
        `;
    }

// ---------------------------------------------------------------------------------------------------

    // =========================================================
    // 3. Cargar Participantes (Visual)
    // =========================================================
    function cargarParticipantes() {
        if (!participantesDataContainer) return;
        
        const participantes = reservaData.participantes || {};
        let html = '';
        let hayDatos = false;

        for (const [rol, nombre] of Object.entries(participantes)) {
            // Limpia el rol para una mejor presentación
            let rolLimpio = rol.replace(/participante_/g, '').replace(/_/g, ' '); 
            rolLimpio = rolLimpio.replace(/\s?s$/, '').trim(); 
            rolLimpio = rolLimpio.charAt(0).toUpperCase() + rolLimpio.slice(1);
            html += `<p><strong>${rolLimpio}:</strong> ${formatValue(nombre)}</p>`;
            if (nombre && String(nombre).trim() !== '') hayDatos = true;
        }

        if (!hayDatos && Object.keys(participantes).length === 0) {
            participantesDataContainer.innerHTML = `<p class="alert alert-info small">No se requirieron participantes para este acto.</p>`;
        } else {
            participantesDataContainer.innerHTML = html;
        }
    }


    // =========================================================
    // 4. Lógica de Registro de APIs (Funciones auxiliares)
    // =========================================================
async function registrarDocumentoAPI(documento, idReserva) {
    if (!documento.idActoRequisito) {
        console.error('Documento omitido por falta de idActoRequisito');
        return { ok: false, mensaje: 'Falta idActoRequisito' };
    }
    if (!idReserva) {
        console.error('Documento omitido por falta de idReserva');
        return { ok: false, mensaje: 'Falta idReserva' };
    }

    const fechaActual = new Date().toISOString().split('T')[0];
    const fechaSubida = documento.f_subido || fechaActual;
    const vigenciaFinal = documento.vigenciaDocumento || '2050-12-31';

    // ❌ LÍNEA ORIGINAL ELIMINADA: const estadoFinal = documento.estadoCumplimiento || 'NO_CUMPLIDO';
    // ✅ CORRECCIÓN: Usar directamente el estado que viene con el documento. 
    // Si la propiedad no está (lo cual no debería ocurrir después de los requisitos), 
    // se usa un valor seguro, aunque el API espera el valor correcto.
    const estadoFinal = documento.estadoCumplimiento || 'SIN_ESTADO_DEFINIDO'; 

    // Convertir aprobado a entero (1 = true, 0 = false)
    const aprobadoInt = documento.aprobado ? 1 : 0;

    const formData = new FormData();
    formData.append('idActoRequisito', String(documento.idActoRequisito));
    formData.append('idReserva', String(idReserva));
    formData.append('estadoCumplimiento', estadoFinal); // <-- USANDO estadoFinal
    formData.append('observacion', documento.observacion || '');
    formData.append('vigenciaDocumento', vigenciaFinal);
    formData.append('aprobado', aprobadoInt);
    formData.append('f_subido', fechaSubida);

    if (documento.file) {
        formData.append('file', documento.file);
        if (documento.rutaArchivo) formData.append('rutaArchivo', documento.rutaArchivo);
        if (documento.tipoArchivo) formData.append('tipoArchivo', documento.tipoArchivo);
    }

    try {
        const response = await fetch('/api/requisito/registrar_documento', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        if (!response.ok || !result.ok) {
            throw new Error(result.mensaje || `Fallo al registrar documento ${documento.idActoRequisito}`);
        }

        return { ok: true, mensaje: result.mensaje || `Documento ${documento.idActoRequisito} registrado` };
    } catch (error) {
        console.error(`❌ Error registrar documento ${documento.idActoRequisito}:`, error);
        return { ok: false, mensaje: error.message };
    }
}
// ... (El resto del código sigue igual)
    // B. Registrar Participante
    async function registrarParticipanteAPI(rol, nombre, idActo, idReserva) {
        if (!nombre || String(nombre).trim() === '') return { ok: true, mensaje: 'Participante omitido (vacío)' };
        if (!idActo) {
            console.error('Participante omitido por falta de idActo');
            return { ok: false, mensaje: 'Falta idActo para participante' };
        }
        
        const rolLimpio = rol.replace(/participante_/g, '');

        const participantePayload = {
            idActo: String(idActo),
            nombParticipante: nombre,
            rolParticipante: rolLimpio, 
            idReserva: String(idReserva)
        };
        
        console.log(`[DEPURACIÓN PARTICIPANTE] Payload Participante ${rolLimpio}:`, participantePayload);

        try {
            const response = await fetch(API_URL_REGISTRAR_PARTICIPANTE, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(participantePayload)
            });

            console.log(`[DEPURACIÓN PARTICIPANTE] Status HTTP Participante ${rolLimpio}:`, response.status);

            const result = await response.json();
            
            console.log(`[DEPURACIÓN PARTICIPANTE] Resultado API Participante ${rolLimpio}:`, result);

            if (!response.ok || !result.ok) {
                throw new Error(result.mensaje || `Fallo al registrar participante ${rol}`);
            }
            return { ok: result.ok, mensaje: result.mensaje || `Participante ${rol} registrado` };
        } catch (error) {
            console.error(`❌ Error de red/backend al registrar participante ${rol}:`, error);
            return { ok: false, mensaje: error.message };
        }
    }

// ---------------------------------------------------------------------------------------------------

    // =========================================================
    // 5. FUNCIÓN PRINCIPAL DE CONFIRMACIÓN (API ORCHESTRATOR)
    // =========================================================

async function enviarReserva(data) {
    if (!btnConfirmar) return;

    btnConfirmar.disabled = true;
    btnConfirmar.textContent = 'Enviando...';
    mostrarMensaje('Procesando reserva, por favor espere...', 'info');

    let idReserva = null;

    try {
        // -------------------------------------------------------
        // 🛑 VALIDACIÓN DE CAMPOS CRÍTICOS
        // -------------------------------------------------------
        if (!data.idSolicitante || !data.idUsuario || !data.idActo || !data.fecha || !data.hora) {
            const missing = [];
            if (!data.idSolicitante) missing.push('ID Solicitante');
            if (!data.idUsuario) missing.push('ID Usuario');
            if (!data.idActo) missing.push('ID Acto');
            if (!data.fecha) missing.push('Fecha');
            if (!data.hora) missing.push('Hora');
            throw new Error(`Error de datos: faltan ${missing.join(', ')}`);
        }

        // -------------------------------------------------------
        // 📁 DOCUMENTOS
        // -------------------------------------------------------
        const documentosCrudos = data.requisitos || data.documentos || {};
        const documentosArray = Object.values(documentosCrudos)
            .filter(d => d && typeof d === 'object' && d.idActoRequisito);

        console.log("Documentos a procesar:", documentosArray);

        // -------------------------------------------------------
        // 👥 PARTICIPANTES
        // -------------------------------------------------------
        const participantes = data.participantes || {};
        const idActo = data.idActo;

        // -------------------------------------------------------
        // 🔥 DEFINIR ESTADO DE LA RESERVA (TU CONDICIÓN NUEVA)
        // -------------------------------------------------------
        const requisitos = data.requisitos ||{};

        // -------------------------------------------------------
        // 📝 PASO 1 — REGISTRAR RESERVA
        // -------------------------------------------------------
        mostrarMensaje('Registrando reserva principal (Paso 1/3)...', 'info');

        const reservaPayload = {
            fecha: data.fecha,
            hora: data.hora,
            observaciones: data.observaciones || '',
            idUsuario: String(data.idUsuario),
            idSolicitante: String(data.idSolicitante),
            idActo: String(data.idActo),
            estadoReserva: requisitos.estado,
            idParroquia: data.idParroquia
        };

        console.log("Payload reserva:", reservaPayload);

        const apiReserva = await fetch(API_URL_NUEVA_RESERVA, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reservaPayload)
        });

        let resultReserva;
        try {
            resultReserva = await apiReserva.json();
        } catch (e) {
            const responseText = await apiReserva.text();
            console.error("No es JSON:", responseText);
            throw new Error("Respuesta del servidor no es JSON");
        }

        if (!apiReserva.ok || !resultReserva.ok) {
            throw new Error(resultReserva.mensaje || "Error al registrar la reserva");
        }

        idReserva = resultReserva.idReserva;
        if (!idReserva) throw new Error("La API no devolvió idReserva");

        // -------------------------------------------------------
        // 📁 PASO 2 — REGISTRAR DOCUMENTOS
        // -------------------------------------------------------
        if (documentosArray.length > 0) {
            mostrarMensaje('Registrando documentos (Paso 2/3)...', 'info');

            const resultadosDocs = await Promise.all(
                documentosArray.map(doc => registrarDocumentoAPI(doc, idReserva))
            );

            const fallos = resultadosDocs.filter(r => !r.ok);
            if (fallos.length > 0) {
                const detalles = fallos.map(f => f.mensaje).join('; ');
                throw new Error(`Fallaron ${fallos.length} documentos: ${detalles}`);
            }
        }

        // -------------------------------------------------------
        // 👥 PASO 3 — REGISTRAR PARTICIPANTES
        // -------------------------------------------------------
        if (Object.keys(participantes).length > 0) {
            mostrarMensaje('Registrando participantes (Paso 3/3)...', 'info');

            const resultadosParticipantes = await Promise.all(
                Object.entries(participantes)
                    .filter(([, nombre]) => nombre && nombre.trim() !== '')
                    .map(([rol, nombre]) => registrarParticipanteAPI(rol, nombre, idActo, idReserva))
            );

            const fallos = resultadosParticipantes.filter(
                r => !r.ok && r.mensaje !== 'Participante omitido (vacío)'
            );

            if (fallos.length > 0) {
                const detalles = fallos.map(f => f.mensaje).join('; ');
                throw new Error(`Fallaron participantes: ${detalles}`);
            }
        }

        // -------------------------------------------------------
        // 🎉 ÉXITO TOTAL
        // -------------------------------------------------------
        mostrarMensaje('✅ Reserva confirmada exitosamente. Redirigiendo...', 'success');

        sessionStorage.clear();

        setTimeout(() => {
            window.location.href = `/principal`;
        }, 1500);

        return;

    } catch (error) {
        let mensaje = `❌ Error al confirmar la reserva: ${error.message}`;

        if (idReserva) {
            mensaje += `<br>La reserva (ID: ${idReserva}) sí se creó, pero fallaron pasos posteriores. Revisión manual necesaria.`;
        } else {
            mensaje += `<br>La reserva NO se creó.`;
        }

        mostrarMensaje(mensaje, 'error');
        console.error("Error en envío de reserva:", error);

    } finally {
        if (btnConfirmar.textContent === 'Enviando...') {
            btnConfirmar.disabled = false;
            btnConfirmar.textContent = 'Confirma reserva';
        }
    }
}


// ---------------------------------------------------------------------------------------------------

    // =========================================================
    // 6. Inicialización y Event Listeners (Corregido)
    // =========================================================
    
    // 1. Cargamos datos del solicitante (Asegura los IDs en reservaData)
    const exitoCargaSolicitante = await cargarDatosSolicitante(); 
    
    // 2. Cargamos datos visuales
    cargarResumenActo();     
    cargarParticipantes();     
    
    // 3. Configuración del botón Confirmar
if (btnConfirmar) { 
    if (exitoCargaSolicitante) {

        btnConfirmar.disabled = false;
        btnConfirmar.textContent = 'Confirma reserva';
        mostrarMensaje('Procede a la confirmación de la reserva.','info');

        btnConfirmar.addEventListener('click', async () => {
            const isConfirmed = window.confirm("¿Está seguro de que desea confirmar y registrar esta reserva? Esta acción es final y creará el registro definitivo.");

            if (!isConfirmed) {
                mostrarMensaje('Confirmación cancelada por el usuario.', 'info');
                return;
            }

            // 1️⃣ Enviar la reserva primero
            await enviarReserva(reservaData);

            // 2️⃣ Redirección según rol
            if (rolUsuario === 'feligres') {
                // Feligres va a "Mis reservas" (cliente/mis_reserva)
                window.location.href = '/cliente/mis_reservas';
            } else if (rolUsuario === 'secretaria' || rolUsuario === 'administrador') {
                if (['PENDIENTE_DOCUMENTO', 'PENDIENTE_REVISION'].includes(reservaData.estadoReserva)) {
                    window.location.href = '/principal';
                } else if (reservaData.estadoReserva === 'PENDIENTE_PAGO') {
                    window.location.href = '/cliente/pago';
                } else {
                    window.location.href = '/principal'; // fallback por seguridad
                }
            } else {
                // Por seguridad, fallback a principal
                window.location.href = '/principal';
            }
        });

    } else {
        btnConfirmar.disabled = true;
        btnConfirmar.textContent = 'Error de Carga (Recargar)';
        mostrarMensaje('No se pudieron establecer los IDs críticos de Solicitante/Usuario. Por favor, recarga la página.','error');
    }
}

    
    // 4. Botón Atrás
    btnAtras?.addEventListener('click', () => { 
        window.location.href = '/cliente/reserva_requisito'; 
    });
});