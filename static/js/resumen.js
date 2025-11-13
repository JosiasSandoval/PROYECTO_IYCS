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
            
            // 1. Establecer IDs críticos INMEDIATAMENTE y guardar en sesión
            reservaData.idSolicitante = idUsuarioSesion; 
            reservaData.idUsuario = idUsuarioSesion;     
            sessionStorage.setItem('reserva', JSON.stringify(reservaData));
            
            let datos = {};
            let exitoVisual = true; 

            // 2. Intentar obtener datos VISUALES del perfil (opcional, no bloqueante)
            try {
                const response = await fetch(API_URL_PERFIL);
                if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
                
                let data = await response.json();
                
                if (data.ok && data.datos) {
                    datos = data.datos;
                } else {
                    exitoVisual = false;
                    console.warn('Advertencia: Respuesta de API OK, pero datos de perfil incompletos o faltantes.');
                }

            } catch (error) {
                exitoVisual = false;
                console.error('❌ Fallo al cargar datos visuales de la API de perfil:', error);
                datos = {}; 
            }
            
            // 3. Renderizar el resumen (usando datos de API o VALOR_VACIO)
            const nombreCompleto = formatValue(`${datos.nombFel || ''} ${datos.apePatFel || ''} ${datos.apeMatFel || ''}`);
            
            solicitanteDataContainer.innerHTML = `
                <p><strong>Nombre completo:</strong> ${nombreCompleto}</p>
                <p><strong>Email:</strong> ${formatValue(datos.email)}</p>
                <p><strong>DNI/Documento:</strong> ${formatValue(datos.numDocFel)}</p>
                <p><strong>Teléfono:</strong> ${formatValue(datos.telefonoFel)}</p>
                <p><strong>Dirección:</strong> ${formatValue(datos.direccionFel)}</p>
            `;

            if (!exitoVisual) {
                 solicitanteDataContainer.innerHTML += `<p class="alert alert-warning small mt-3">Advertencia: Fallo al cargar datos visuales del perfil. Los IDs de Reserva están establecidos.</p>`;
            }
            
            return true; // ÉXITO: Los IDs internos están garantizados.
            
        } else if (rolUsuario === 'secretaria' || rolUsuario === 'administrador') {
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

// ---------------------------------------------------------------------------------------------------

    // =========================================================
    // 4. Lógica de Registro de APIs (Funciones auxiliares)
    // =========================================================

    // A. Registrar Documento (CORREGIDO)
    async function registrarDocumentoAPI(documento, idReserva) {
        // Validar campos críticos antes de enviar
        if (!documento.idActoRequisito) {
            console.error('Documento omitido por falta de idActoRequisito');
            return { ok: false, mensaje: 'Falta idActoRequisito' };
        }

        // --- Extracción y Coherencia de Datos (AJUSTADA) ---
        
        // 1. Fecha de Subida
        const fechaActual = new Date().toISOString().split('T')[0];
        const fechaSubida = documento.f_subido || 
                            (documento.estadoCumplido === 'CUMPLIDO' ? fechaActual : '1900-01-01'); // Fallback seguro

        // 2. Vigencia del Documento
        const vigenciaFinal = documento.vigenciaDocumento || 
                              (documento.estadoCumplido === 'CUMPLIDO' ? '2050-12-31' : '1900-01-01'); // Fallback seguro
        
        // 3. Estado
        const estadoFinal = documento.estadoCumplido || 'PENDIENTE_REVISION';
        
        const docPayload = {
            idActoRequisito: Number(documento.idActoRequisito), 
            idReserva: Number(idReserva),
            
            // 🚀 Corregido: Usar los valores del objeto documento o fallbacks.
            ruta: documento.rutaArchivo || 'PENDIENTE', 
            tipoArchivo: documento.tipoArchivo || 'N/A', 
            fecha: fechaSubida, // 💡 Usa el valor ajustado.
            estadoCumplimiento: estadoFinal, // 💡 Usa 'CUMPLIDO', 'NO_CUMPLIDO' o 'PENDIENTE_REVISION'.
            observacion: documento.observacion || '', 
            vigencia: vigenciaFinal // 💡 Usa el valor ajustado.
        };

        console.log(`[DEPURACIÓN DOCS] Payload Documento ${documento.idActoRequisito}:`, docPayload);
        
        // 💡 La URL ahora usa la constante corregida que apunta al endpoint completo
        try {
            const response = await fetch(API_URL_REGISTRAR_DOC, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(docPayload)
            });
            
            console.log(`[DEPURACIÓN DOCS] Status HTTP Documento ${documento.idActoRequisito}:`, response.status);
            
            const result = await response.json();

            console.log(`[DEPURACIÓN DOCS] Resultado API Documento ${documento.idActoRequisito}:`, result);

            if (!response.ok || !result.ok) {
                // 🛑 Si el backend devuelve un error, lo lanzamos para que el catch lo maneje
                throw new Error(result.mensaje || `Fallo al registrar documento ${documento.idActoRequisito}`);
            }
            return { ok: result.ok, mensaje: result.mensaje || `Documento ${documento.idActoRequisito} registrado` };
        } catch (error) {
            console.error(`❌ Error de red/backend al registrar documento ${documento.idActoRequisito}:`, error);
            return { ok: false, mensaje: error.message };
        }
    }

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
        
        let idReserva = null; // Variable para almacenar el ID de la reserva creada

        try {
            
            // ====================================================================
            // 🛑 PRE-VALIDACIÓN CRÍTICA DE DATOS ANTES DE CUALQUIER LLAMADA API 🛑
            // ====================================================================
            
            // Validaciones de IDs críticos para la Reserva principal
            if (!data.idSolicitante || !data.idUsuario || !data.idActo || !data.fecha || !data.hora) {
                // Mensaje detallado para saber qué falta
                const missing = [];
                if (!data.idSolicitante) missing.push('ID Solicitante');
                if (!data.idUsuario) missing.push('ID Usuario');
                if (!data.idActo) missing.push('ID Acto');
                if (!data.fecha) missing.push('Fecha');
                if (!data.hora) missing.push('Hora');
                
                throw new Error(`Error de datos críticos: Faltan campos necesarios para el registro principal: ${missing.join(', ')}.`);
            }
            
            // ====================================================================
            // 🚀 Preparar Documentos (Lógica para convertir el objeto en un array)
            // ====================================================================
            // 1. Tomar los documentos del campo 'requisitos' o 'documentos'
            const documentosCrudos = data.requisitos || data.documentos || {};
            
            // 2. Convertir el objeto a un array de documentos, y filtrar explícitamente 
            const documentosArray = Object.values(documentosCrudos).filter(item => {
                // Consideramos un elemento válido si es un objeto con la propiedad clave idActoRequisito
                return typeof item === 'object' && item !== null && item.idActoRequisito;
            });

            console.log("[DEPURACIÓN DOCS - CORREGIDA] Documentos a procesar (Array Final):", documentosArray);
            
            const participantes = data.participantes || {};
            const idActo = data.idActo; 
            
            if (documentosArray.length === 0) {
                 console.warn("Advertencia: No hay documentos para registrar (documentosArray vacío).");
            }
            if (Object.keys(participantes).length === 0) {
                 console.warn("Advertencia: No hay participantes para registrar (participantes vacío).");
            }
            
            // ====================================================================
            // 🚀 PASO 1: REGISTRAR RESERVA PRINCIPAL
            // ====================================================================
            mostrarMensaje('Registrando reserva principal (Paso 1/3)...', 'info');
            
            // 🛑 CORRECCIÓN CLAVE: OBTENER EL ESTADO DE LA RESERVA DE data.requisitos.estado
            const estadoRequisitos = data.requisitos && data.requisitos.estado;
            const estadoInicialReserva = estadoRequisitos || 'PENDIENTE_REVISION'; // Fallback seguro
            
            console.log(`[DEPURACIÓN RESERVA] Estado de Reserva obtenido de 'requisitos.estado': ${estadoInicialReserva}`);

            const reservaPayload = {
                fecha: data.fecha,
                hora: data.hora,
                observaciones: data.observaciones || '', 
                idUsuario: String(data.idUsuario), 
                idSolicitante: String(data.idSolicitante),
                idActo: String(data.idActo),
                estadoReserva: estadoInicialReserva // <<-- CORRECCIÓN FINAL APLICADA AQUÍ
            };
            
            console.log("[DEPURACIÓN RESERVA] Payload de Reserva enviado:", reservaPayload);

            const apiReserva = await fetch(API_URL_NUEVA_RESERVA, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reservaPayload)
            });

            console.log("[DEPURACIÓN RESERVA] Status HTTP de la API de Reserva:", apiReserva.status);

            let resultReserva;
            try {
                resultReserva = await apiReserva.json();
            } catch (e) {
                const responseText = await apiReserva.text();
                console.error("[DEPURACIÓN RESERVA] Error al parsear JSON. Respuesta recibida (NO JSON):", responseText);
                throw new Error("Respuesta del servidor no es JSON. HTTP Status: " + apiReserva.status);
            }
            
            console.log("[DEPURACIÓN RESERVA] Resultado de la API de Reserva:", resultReserva);
            
            if (!apiReserva.ok || !resultReserva.ok) {
                const mensajeError = resultReserva.mensaje || "Error desconocido al crear la reserva principal.";
                console.error("[DEPURACIÓN RESERVA] Error del Backend:", mensajeError);
                throw new Error(`[RESERVA PRINCIPAL] Falló el Paso 1: ${mensajeError}.`);
            }

            idReserva = resultReserva.idReserva; 
            if (!idReserva) throw new Error("La API principal no devolvió el ID de Reserva."); 
            
            // ====================================================================
            // 🚀 PASO 2: Documentos
            // ====================================================================
            if (documentosArray.length > 0) {
                mostrarMensaje('Registrando documentos adjuntos (Paso 2/3)...', 'info');
                
                // Usamos map y Promise.all para manejar la concurrencia
                const promesasDocs = documentosArray.map(doc => registrarDocumentoAPI(doc, idReserva));
                const resultadosDocs = await Promise.all(promesasDocs); 
                
                const fallosDocs = resultadosDocs.filter(r => !r.ok);
                if (fallosDocs.length > 0) {
                    // Si falla, notificamos el error, pero el ID de reserva persiste
                    const mensajeFallo = fallosDocs.map(f => f.mensaje).join('; ');
                    throw new Error(`[DOCUMENTOS] Falló el Paso 2: Fallo al registrar ${fallosDocs.length} documento(s). Detalles: ${mensajeFallo}`);
                }
            }
            
            // ====================================================================
            // 🚀 PASO 3: Participantes
            // ====================================================================
            if (Object.keys(participantes).length > 0) {
                 mostrarMensaje('Registrando participantes del acto (Paso 3/3)...', 'info');
                 
                 // Usamos filter para omitir participantes con nombre vacío
                 const promesasParticipantes = Object.entries(participantes)
                      .filter(([, nombre]) => nombre && String(nombre).trim() !== '')
                      .map(([rol, nombre]) => registrarParticipanteAPI(rol, nombre, idActo, idReserva));
                 
                 const resultadosParticipantes = await Promise.all(promesasParticipantes);
                 
                 const fallosParticipantes = resultadosParticipantes.filter(r => !r.ok && r.mensaje !== 'Participante omitido (vacío)');
                 if (fallosParticipantes.length > 0) {
                      // Si falla, notificamos el error, pero el ID de reserva persiste
                      const mensajeFallo = fallosParticipantes.map(f => f.mensaje).join('; ');
                      throw new Error(`[PARTICIPANTES] Falló el Paso 3: Fallo al registrar ${fallosParticipantes.length} participante(s). Detalles: ${mensajeFallo}`);
                 }
            }

            // --- ÉXITO TOTAL (Todos los pasos OK) ---
            
            mostrarMensaje('✅ Reserva confirmada exitosamente. Redirigiendo al inicio...', 'success');
            
            // 🛑 ÚNICO LUGAR DONDE SE LIMPIA sessionStorage Y REDIRIGE A /principal
            sessionStorage.clear(); 
            
            setTimeout(() => {
                window.location.href = `/principal`;
            }, 1500);
            
            // Usamos 'return' aquí para evitar que el 'finally' se ejecute antes de la redirección
            return; 

        } catch (error) {
            // Manejo de errores fatales
            // 🛑 La sesión NO se limpia en caso de error (se mantiene en la vista actual)
            let mensajeMostrar = `❌ Error al confirmar la reserva: ${error.message}`;
            
            if (idReserva) {
                // Si la reserva principal se creó (Paso 1 OK) pero fallaron subsiguientes (Paso 2 o 3),
                mensajeMostrar += `<br>La **Reserva (ID: ${idReserva})** se creó, pero fallaron pasos posteriores (Documentos/Participantes). **Necesita revisión manual**. Los datos de sesión persisten.`;
            } else {
                // Si falla la pre-validación o el Paso 1, la reserva principal nunca se creó.
                mensajeMostrar += `<br>La **Reserva NO fue creada**. Los datos de sesión persisten.`;
            }
            
            mostrarMensaje(mensajeMostrar, 'error');
            console.error('Proceso de reserva fallido (Datos de sesión mantenidos):', error);
        } finally {
            // Restauramos el botón solo si la función no ha salido por éxito (mediante el 'return' dentro del try)
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
if(btnConfirmar) { 
        if(exitoCargaSolicitante){
            
            // ELIMINAMOS la restricción del rolUsuario.
            // Si la carga fue exitosa, ACTIVAMOS el botón para CUALQUIER rol.
            
            btnConfirmar.disabled = false;
            btnConfirmar.textContent = 'Confirma reserva';
            
            // Mensaje informativo actualizado para todos los roles
            // (Opcional, se puede eliminar si no se necesita un mensaje constante)
            mostrarMensaje('Procede a la confirmación de la reserva.','info');

            // 🛑 El click en el botón principal usa window.confirm() e inicia la transacción.
            btnConfirmar.addEventListener('click', () => {
                 const isConfirmed = window.confirm("¿Está seguro de que desea confirmar y registrar esta reserva? Esta acción es final y creará el registro definitivo.");
                 
                 if (isConfirmed) {
                      enviarReserva(reservaData);
                 } else {
                      mostrarMensaje('Confirmación cancelada por el usuario.', 'info');
                 }
            });
            
        } else {
             // Fallo total en la carga de IDs críticos (Esta lógica se mantiene para seguridad)
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