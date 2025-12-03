// ================================================
// PARTE 1: CARGA DE SACERDOTES
// ================================================
let sacerdotesData = [];

async function cargarSacerdotes(idParroquia) {
    if (!idParroquia) return;

    try {
        const resp = await fetch(`/api/usuario/personal_reserva/${idParroquia}`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        if (data.datos && Array.isArray(data.datos)) {
            sacerdotesData = data.datos
                .map(item => Array.isArray(item) ? item[0] : item)
                .filter(n => typeof n === 'string' && n.trim().length > 0);
        }
    } catch (err) {
        console.error("Error cargando sacerdotes:", err);
    }
}

// ================================================
// CARGA AUTOMÁTICA DE SACERDOTE DISPONIBLE
// ================================================
async function cargarSacerdoteDisponible(idParroquia, fecha, hora, inputElement) {
    if (!idParroquia || !fecha || !hora || !inputElement) return;
    
    try {
        // Formatear hora si es necesario (asegurar formato HH:MM)
        let horaFormateada = hora;
        if (horaFormateada.length === 5 && horaFormateada.includes(':')) {
            // Ya está en formato HH:MM
        } else if (horaFormateada.length === 8 && horaFormateada.includes(':')) {
            // Formato HH:MM:SS, tomar solo HH:MM
            horaFormateada = horaFormateada.substring(0, 5);
        }
        
        const resp = await fetch(`/api/usuario/sacerdote_disponible/${idParroquia}/${fecha}/${horaFormateada}`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        
        const data = await resp.json();
        if (data.success && data.sacerdote) {
            // Llenar automáticamente el campo del sacerdote
            inputElement.value = data.sacerdote;
            inputElement.classList.add('is-valid');
            console.log('✅ Sacerdote disponible asignado automáticamente:', data.sacerdote);
            
            // Mostrar indicador visual
            const indicador = document.createElement('small');
            indicador.className = 'text-success';
            indicador.textContent = '✓ Sacerdote disponible asignado automáticamente';
            indicador.style.display = 'block';
            indicador.style.marginTop = '5px';
            
            // Remover indicador anterior si existe
            const indicadorAnterior = inputElement.parentNode.querySelector('.text-success');
            if (indicadorAnterior && indicadorAnterior !== indicador) {
                indicadorAnterior.remove();
            }
            
            inputElement.parentNode.appendChild(indicador);
        } else {
            console.log('⚠️ No hay sacerdotes disponibles para esa fecha y hora');
            // No llenar el campo, el usuario deberá ingresarlo manualmente
        }
    } catch (err) {
        console.error("Error cargando sacerdote disponible:", err);
        // En caso de error, no hacer nada - el usuario puede ingresar manualmente
    }
}

// ================================================
// AUTOCOMPLETADO VISUAL
// ================================================
function mostrarSugerencias(input) {
    let contenedor = input.nextElementSibling;
    if (!contenedor || !contenedor.classList.contains('sugerencias-sacerdote')) {
        contenedor = document.createElement('div');
        contenedor.className = 'sugerencias-sacerdote';
        contenedor.style.position = 'absolute';
        contenedor.style.background = '#fff';
        contenedor.style.border = '1px solid #ccc';
        contenedor.style.width = input.offsetWidth + 'px';
        contenedor.style.maxHeight = '150px';
        contenedor.style.overflowY = 'auto';
        contenedor.style.zIndex = 1000;
        input.parentNode.appendChild(contenedor);
    }
    contenedor.innerHTML = '';

    const valor = input.value.toLowerCase().trim();
    if (valor.length < 2) {
        contenedor.style.display = 'none';
        return;
    }

    const coincidencias = sacerdotesData.filter(nombre => nombre.toLowerCase().includes(valor));
    coincidencias.slice(0, 10).forEach(nombre => {
        const div = document.createElement('div');
        div.textContent = nombre;
        div.style.padding = '4px';
        div.style.cursor = 'pointer';
        div.addEventListener('mousedown', e => {
            e.preventDefault();
            input.value = nombre;
            contenedor.style.display = 'none';
        });
        contenedor.appendChild(div);
    });

    contenedor.style.display = coincidencias.length ? 'block' : 'none';
}

// ================================================
// NAVEGACIÓN Y VALIDACIÓN
// ================================================
function volverPasoAnterior() {
    let reservaData = JSON.parse(sessionStorage.getItem('reserva') || '{}');

    // Solo reinicia datos dependientes si realmente cambió la parroquia o acto
    if (reservaData._parroquiaAnterior !== reservaData.idParroquia || reservaData._actoAnterior !== reservaData.idActo) {
        reservaData.participantes = {};
        reservaData.solicitante = {};
        reservaData.requisito = {};
        reservaData._parroquiaAnterior = reservaData.idParroquia;
        reservaData._actoAnterior = reservaData.idActo;
        sessionStorage.setItem('reserva', JSON.stringify(reservaData));
    }

    window.location.href = '/cliente/reserva_acto';
}

function guardarParticipantesYContinuar() {
    const rolUsuario = document.body.dataset.rol?.trim().toLowerCase();
    const esSacerdote = rolUsuario === 'sacerdote';
    
    // 🔹 CASO SACERDOTE: Solo validar mención
    if (esSacerdote) {
        const mencionTextarea = document.getElementById('mencion-reserva');
        const checkboxAbsorcion = document.getElementById('absorcion-pago');
        
        if (!mencionTextarea || mencionTextarea.value.trim() === '') {
            alert("⚠️ Debe ingresar una mención para la reserva.");
            if (mencionTextarea) mencionTextarea.classList.add('is-invalid');
            return;
        }
        
        let reservaData = JSON.parse(sessionStorage.getItem('reserva') || '{}');
        reservaData.observaciones = mencionTextarea.value.trim();
        reservaData.absorcionPago = checkboxAbsorcion ? checkboxAbsorcion.checked : true;
        reservaData.participantes = {}; // No hay participantes
        reservaData.estadoReserva = 'RESERVA_PARROQUIA'; // Estado único para reservas de parroquia
        
        sessionStorage.setItem('reserva', JSON.stringify(reservaData));
        window.location.href = '/cliente/reserva_resumen';
        return;
    }
    
    // 🔹 CASO NORMAL: Feligrés y Secretaria
    const participantesContainer = document.getElementById('participantes-inputs');
    if (!participantesContainer) {
        alert("⚠️ Error: No se encontró el contenedor de participantes.");
        return;
    }
    
    const inputs = participantesContainer.querySelectorAll('input[name^="participante_"]');

    let formValido = true;
    const datosParticipantes = {};
    let solicitanteValido = false;

    inputs.forEach(input => {
        // 💡 CORRECCIÓN APLICADA: Validar y guardar el 'participante_solicitante' para secretaria
        if (input.name === 'participante_solicitante') {
            // Se valida que el campo no esté vacío si es requerido
            if (input.required && input.value.trim() === '') {
                formValido = false;
                input.classList.add('is-invalid');
                solicitanteValido = false;
            } else if (input.value.trim() !== '') {
                input.classList.remove('is-invalid');
                solicitanteValido = true;
                // Guardar datos del solicitante en reservaData.solicitante
                let reservaData = JSON.parse(sessionStorage.getItem('reserva') || '{}');
                if (!reservaData.solicitante) reservaData.solicitante = {};
                // El nombre completo ya está guardado en reservaData.solicitante.nombreCompleto
                // Solo validamos que exista
                if (!reservaData.solicitante.nombreCompleto && input.value.trim()) {
                    reservaData.solicitante.nombreCompleto = input.value.trim();
                    sessionStorage.setItem('reserva', JSON.stringify(reservaData));
                }
            }
            // Retornamos para NO guardar este input en datosParticipantes
            return; 
        }
        
        if (input.required && input.value.trim() === '') {
            formValido = false;
            input.classList.add('is-invalid');
        } else {
            input.classList.remove('is-invalid');
            
            // Guardamos los demás participantes
            const claveCompleta = input.name; 
            datosParticipantes[claveCompleta] = input.value.trim();
        }
    });

    // Validar que el solicitante esté completo para secretaria
    const esSecretaria = rolUsuario === 'secretaria';
    if (esSecretaria && !solicitanteValido) {
        alert("⚠️ Debe ingresar y validar el nombre del solicitante antes de continuar.");
        formValido = false;
    }

    if (!formValido) {
        alert("⚠️ Completa todos los campos obligatorios antes de continuar.");
        return;
    }

    // Validar que haya al menos un participante o solicitante
    let reservaData = JSON.parse(sessionStorage.getItem('reserva') || '{}');
    
    if (esSecretaria && !reservaData.solicitante) {
        alert("⚠️ Error: No se encontraron datos del solicitante. Por favor, complete el formulario.");
        return;
    }
    
    reservaData.participantes = datosParticipantes;
    // Establecer estado como PENDIENTE_PAGO ya que no se suben documentos en el proceso
    reservaData.estadoReserva = 'PENDIENTE_PAGO';
    sessionStorage.setItem('reserva', JSON.stringify(reservaData));

    window.location.href = '/cliente/reserva_resumen';
}

// ================================================
// GENERACIÓN DE INPUTS
// ================================================
function generarInputsParticipantes(listaParticipantes, container, reservaData = {}) {
    if (!container) return;
    container.innerHTML = '';

    // 🔹 Verificar rol (case-insensitive)
    const rolUsuario = document.body.dataset.rol;
    const esSecretaria = rolUsuario && rolUsuario.trim().toLowerCase() === 'secretaria';
    const esSacerdote = rolUsuario && rolUsuario.trim().toLowerCase() === 'sacerdote';
    console.log('🔍 [generarInputsParticipantes] Rol:', rolUsuario, '| Es secretaria:', esSecretaria, '| Es sacerdote:', esSacerdote);

    // 🔹 CASO ESPECIAL: SACERDOTE - Nombre automático como participante + mención + checkbox
    if (esSacerdote) {
        console.log('✅ Modo SACERDOTE: Participante automático, mención y absorción');
        
        // Obtener nombre completo del sacerdote desde el dataset
        const nombre = document.body.dataset.nombre || '';
        const apellidoPaterno = document.body.dataset.apellidopaterno || '';
        const apellidoMaterno = document.body.dataset.apellidomaterno || '';
        const nombreCompleto = `${nombre} ${apellidoPaterno} ${apellidoMaterno}`.trim();
        
        console.log('📝 Datos del sacerdote:', { nombre, apellidoPaterno, apellidoMaterno, nombreCompleto });
        
        // Campo del sacerdote - estilo simple sin colores
        const participanteGroup = document.createElement('div');
        participanteGroup.className = 'form-group full-width mb-3';
        
        const participanteLabel = document.createElement('label');
        participanteLabel.className = 'form-label';
        participanteLabel.innerHTML = '<strong>Celebrado por (Sacerdote)</strong>';
        
        const participanteInput = document.createElement('input');
        participanteInput.type = 'text';
        participanteInput.className = 'form-control';
        participanteInput.name = 'participante_sacerdote';
        participanteInput.value = nombreCompleto;
        participanteInput.readOnly = true;
        participanteInput.style.cssText = 'background-color: #f5f5f5; border: 1px solid #ddd;';
        
        participanteGroup.appendChild(participanteLabel);
        participanteGroup.appendChild(participanteInput);
        container.appendChild(participanteGroup);
        
        // Campo de Mención (obligatorio) - estilo simple sin colores
        const mencionGroup = document.createElement('div');
        mencionGroup.className = 'form-group full-width mb-3';
        
        const mencionLabel = document.createElement('label');
        mencionLabel.htmlFor = 'mencion-reserva';
        mencionLabel.className = 'form-label';
        mencionLabel.innerHTML = '<strong>Mención / Intención de la Misa</strong> <span class="text-danger">*</span>';
        
        const mencionTextarea = document.createElement('textarea');
        mencionTextarea.id = 'mencion-reserva';
        mencionTextarea.name = 'mencion';
        mencionTextarea.className = 'form-control';
        mencionTextarea.rows = 4;
        mencionTextarea.required = true;
        mencionTextarea.placeholder = 'Ejemplo: "Por el eterno descanso de...", "Por la salud de...", "En acción de gracias por..."';
        mencionTextarea.value = reservaData.observaciones || '';
        mencionTextarea.style.cssText = 'border: 1px solid #ddd; border-radius: 4px;';
        
        mencionGroup.appendChild(mencionLabel);
        mencionGroup.appendChild(mencionTextarea);
        container.appendChild(mencionGroup);
        
        // Checkbox de absorción de pago - estilo simple sin borde
        const checkboxGroup = document.createElement('div');
        checkboxGroup.className = 'form-check mt-3 p-3';
        checkboxGroup.style.cssText = 'background-color: #f9f9f9; border-radius: 4px;';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'form-check-input';
        checkbox.id = 'absorcion-pago';
        checkbox.name = 'absorcionPago';
        checkbox.checked = reservaData.absorcionPago !== false;
        checkbox.style.cssText = 'width: 18px; height: 18px; cursor: pointer;';
        
        const checkboxLabel = document.createElement('label');
        checkboxLabel.className = 'form-check-label ms-2';
        checkboxLabel.htmlFor = 'absorcion-pago';
        checkboxLabel.style.cssText = 'cursor: pointer; font-weight: 500;';
        checkboxLabel.textContent = 'Esta reserva está absorbida por la parroquia (sin pago)';
        
        checkboxGroup.appendChild(checkbox);
        checkboxGroup.appendChild(checkboxLabel);
        container.appendChild(checkboxGroup);
        
        return; // No mostrar participantes
    }

    // 🔹 IMPORTANTE: Solicitante solo para secretaria - DEBE IR PRIMERO
    if (esSecretaria) {
        console.log('✅ Generando campo de SOLICITANTE para secretaria');
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group full-width';

        const idInput = `participante-solicitante`;
        const nameInput = `participante_solicitante`;

        const label = document.createElement('label');
        label.htmlFor = idInput;
        label.textContent = 'Nombre completo de: Solicitante';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'form-control';
        input.id = idInput;
        input.name = nameInput;
        input.required = true;
        input.placeholder = 'Ingrese el nombre del solicitante';

        if (reservaData.solicitante && reservaData.solicitante.nombreCompleto) {
            input.value = reservaData.solicitante.nombreCompleto;
        } else {
            input.value = '';
        }

        input.addEventListener('blur', async () => {
            const valor = input.value.trim();
            if (!valor) return;

            let reservaData = JSON.parse(sessionStorage.getItem('reserva') || '{}');
            if (!reservaData.solicitante) reservaData.solicitante = {};

            try {
                const response = await fetch(`/api/usuario/buscar_solicitante/${encodeURIComponent(valor)}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.usuario) {
                        // Guardar todos los datos del solicitante
                        reservaData.solicitante = {
                            idUsuario: data.usuario.idUsuario, // Este será el idSolicitante
                            idFeligres: data.usuario.idUsuario, // También como idFeligres para claridad
                            nombreCompleto: data.usuario.nombreCompleto,
                            numDocFel: data.usuario.numDocFel,
                            telefonoFel: data.usuario.telefonoFel,
                            direccionFel: data.usuario.direccionFel
                        };
                        input.value = data.usuario.nombreCompleto;
                        input.classList.remove('is-invalid');
                        input.classList.add('is-valid');
                        
                        // Mostrar confirmación visual
                        const confirma = document.createElement('small');
                        confirma.className = 'text-success';
                        confirma.textContent = '✓ Feligrés encontrado';
                        confirma.style.display = 'block';
                        confirma.style.marginTop = '5px';
                        
                        // Remover confirmación anterior si existe
                        const confirmaAnterior = input.parentNode.querySelector('.text-success');
                        if (confirmaAnterior) confirmaAnterior.remove();
                        
                        input.parentNode.appendChild(confirma);
                    } else {
                        alert("❌ Usuario no registrado. Por favor verifique el nombre.");
                        input.value = '';
                        input.classList.add('is-invalid');
                        reservaData.solicitante = {};
                    }
                } else {
                    alert("❌ Usuario no registrado. Por favor verifique el nombre.");
                    input.value = '';
                    input.classList.add('is-invalid');
                    reservaData.solicitante = {};
                }
            } catch (error) {
                console.error('Error al consultar el usuario:', error);
                alert("❌ Error al consultar el usuario. Por favor intente nuevamente.");
                input.value = '';
                input.classList.add('is-invalid');
                reservaData.solicitante = {};
            }

            sessionStorage.setItem('reserva', JSON.stringify(reservaData));
        });
        
        formGroup.appendChild(label);
        formGroup.appendChild(input);
        container.appendChild(formGroup);
    }

    // 🔹 Participantes restantes
    if (listaParticipantes && listaParticipantes.length > 0) {
        listaParticipantes.forEach((tipo, index) => {
            const isSacerdote = tipo.toLowerCase().includes('sacerdote');
            const formGroup = document.createElement('div');
            formGroup.className = 'form-group full-width';
            formGroup.style.position = 'relative';

            const idInput = `participante-${index}`;
            const nameInput = `participante_${tipo.toLowerCase().replace(/[\s()]/g, '_')}`;
            // Usa el nombre del input para buscar el valor guardado
            const valorPrevio = (reservaData.participantes && reservaData.participantes[nameInput]) || '';

            const label = document.createElement('label');
            label.htmlFor = idInput;
            label.textContent = `Nombre completo de: ${tipo}`;

            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'form-control';
            input.id = idInput;
            input.name = nameInput;
            input.required = true;
            input.placeholder = `Ingrese el nombre del/la ${tipo}`;
            input.value = valorPrevio;

            if (isSacerdote) {
                input.addEventListener('input', () => mostrarSugerencias(input));
                
                // 🔹 AUTOCOMPLETAR SACERDOTE DISPONIBLE para Feligres y Secretaria
                const rolUsuario = document.body.dataset.rol?.trim().toLowerCase();
                const esFeligres = rolUsuario === 'feligres';
                const esSecretaria = rolUsuario === 'secretaria';
                
                if (esFeligres || esSecretaria) {
                    // Obtener fecha y hora de la reserva
                    const reservaData = JSON.parse(sessionStorage.getItem('reserva') || '{}');
                    const fechaReserva = reservaData.fecha;  // Se guarda como 'fecha' en reserva_acto.js
                    const horaReserva = reservaData.hora;    // Se guarda como 'hora' en reserva_acto.js
                    const idParroquia = reservaData.idParroquia;
                    
                    if (fechaReserva && horaReserva && idParroquia) {
                        // Llamar al endpoint para obtener sacerdote disponible
                        cargarSacerdoteDisponible(idParroquia, fechaReserva, horaReserva, input);
                    }
                }
            }

            formGroup.appendChild(label);
            formGroup.appendChild(input);
            container.appendChild(formGroup);
        });
    } else if (!esSecretaria) {
        container.innerHTML = '<p class="alert alert-success">✅ No se requieren participantes adicionales.</p>';
    }
}

// ================================================
// INICIALIZACIÓN
// ================================================
document.addEventListener('DOMContentLoaded', () => {
    const reservaString = sessionStorage.getItem('reserva');
    const participantesContainer = document.getElementById('participantes-inputs');
    const tituloActoEl = document.getElementById('titulo-acto');
    const btnSiguiente = document.getElementById('btn-siguiente');
    const btnAtras = document.getElementById('btn-atras');

    // 🔹 Verificar rol del usuario
    const rolUsuario = document.body.dataset.rol;
    console.log('🔍 Rol detectado:', rolUsuario);

    if (!reservaString) {
        window.location.href = '/cliente/reserva_parroquia';
        return;
    }

    let reservaData = JSON.parse(reservaString);
    const { idParroquia, idActo, nombreActo } = reservaData;

    if (!idParroquia || !idActo) {
        window.location.href = '/cliente/reserva_parroquia';
        return;
    }

    // Guardamos parroquia y acto anteriores si no existen
    if (!reservaData._parroquiaAnterior) reservaData._parroquiaAnterior = idParroquia;
    if (!reservaData._actoAnterior) reservaData._actoAnterior = idActo;
    sessionStorage.setItem('reserva', JSON.stringify(reservaData));

    cargarSacerdotes(idParroquia);

    if (tituloActoEl) tituloActoEl.textContent = `Participantes para el acto: ${nombreActo}`;

    fetch(`/api/acto/participantes/${idActo}`)
        .then(resp => resp.ok ? resp.json() : Promise.reject(`HTTP ${resp.status}`))
        .then(data => generarInputsParticipantes(data.participantes, participantesContainer, reservaData))
        .catch(err => {
            console.error("Error al cargar participantes:", err);
            participantesContainer.innerHTML = `<p class="alert alert-danger">Error: ${err}</p>`;
        });

    if (btnSiguiente) btnSiguiente.addEventListener('click', guardarParticipantesYContinuar);
    if (btnAtras) btnAtras.addEventListener('click', volverPasoAnterior);

    document.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            guardarParticipantesYContinuar();
        }
        if (e.key === 'Backspace' && document.activeElement.tagName !== 'INPUT') {
            e.preventDefault();
            volverPasoAnterior();
        }
    });
});