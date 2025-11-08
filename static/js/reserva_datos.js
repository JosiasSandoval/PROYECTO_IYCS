// ==============================
// PARTE 1: CONFIGURACIÓN Y DATOS
// ==============================

// Variable global para almacenar los nombres de los sacerdotes
let sacerdotesData = [];

async function cargarSacerdotes(idParroquia) {
    if (!idParroquia) {
        console.error("❌ ERROR CRÍTICO: idParroquia es nulo o indefinido. Imposible cargar API.");
        return;
    }
    
    const fetchUrl = `/api/usuario/personal_reserva/${idParroquia}`;
    console.log(`📡 Llamando a la API de Sacerdotes: ${fetchUrl}`);
    
    try {
        const response = await fetch(fetchUrl); 
        
        if (!response.ok) {
            console.error(`❌ Fallo de API: Status ${response.status}.`);
            return;
        }
        
        const data = await response.json();
        
        if (data.datos && Array.isArray(data.datos)) {
            sacerdotesData = data.datos
                .map(item => Array.isArray(item) ? item[0] : null) 
                .filter(nombre => typeof nombre === 'string' && nombre.trim().length > 0); 

            console.log(`✅ ${sacerdotesData.length} nombres de sacerdotes cargados.`);

        } else {
            console.error("❌ La respuesta JSON de sacerdotes no tiene el formato esperado.", data);
        }
    } catch (error) {
        console.error("❌ Error de red o en la llamada a la API de sacerdotes:", error);
    }
}


// ==============================
// PARTE 2: LÓGICA DE AUTOCOMPLETADO
// ==============================

/**
 * Muestra la lista de sugerencias filtradas y diseñadas para el input de sacerdote.
 */
function mostrarSugerenciasPersonalizadas(input, suggestionsList) {
    const valor = input.value.toLowerCase().trim();
    suggestionsList.innerHTML = ''; 
    
    if (valor.length < 2) { 
        suggestionsList.style.display = 'none';
        return;
    }

    const coincidencias = sacerdotesData.filter(nombre => 
        nombre.toLowerCase().includes(valor)
    );

    if (coincidencias.length === 0) {
        suggestionsList.style.display = 'none';
        return;
    }
    
    coincidencias.slice(0, 10).forEach(nombre => { 
        const li = document.createElement('li');
        li.textContent = nombre;
        li.className = 'custom-suggestion-item'; 
        
        li.addEventListener('mousedown', (e) => { 
            e.preventDefault(); 
            input.value = nombre;
            suggestionsList.style.display = 'none';
        });
        suggestionsList.appendChild(li);
    });

    suggestionsList.style.display = 'block';
}


// ==============================
// PARTE 3: GUARDADO Y NAVEGACIÓN (CONFIRMADO)
// ==============================

function volverPasoAnterior() {
    window.location.href = '/cliente/reserva_acto'; 
}

/**
 * Recolecta los nombres de todos los participantes, actualiza el objeto 'reserva' 
 * y avanza al siguiente paso (Resumen/Confirmación).
 */
function guardarParticipantesYContinuar() {
    const participantesContainer = document.getElementById('participantes-inputs');
    const inputs = participantesContainer.querySelectorAll('input[name^="participante_"]'); 
    
    let formValido = true;
    const datosParticipantes = {}; 

    inputs.forEach(input => {
        if (input.required && input.value.trim() === '') {
            formValido = false;
            input.focus();
            input.classList.add('is-invalid'); 
            return;
        } else {
            input.classList.remove('is-invalid');
        }

        const tipoParticipante = input.name.replace('participante_', ''); 
        datosParticipantes[tipoParticipante] = input.value.trim();
    });

    if (!formValido) {
        alert("⚠️ Por favor, completa todos los campos requeridos antes de continuar.");
        return;
    }

    // OBTENER el objeto de reserva actual
    const datosReservaString = sessionStorage.getItem('reserva');
    let reservaData = JSON.parse(datosReservaString || '{}');
    
    // Obtener el ID de usuario desde el body del HTML
    const idUsuario = document.body.dataset.id; 
    
    // 4. ACTUALIZAR el objeto de reserva con los datos del paso 3
    reservaData.idUsuario = idUsuario; 
    reservaData.participantes = datosParticipantes; 
    
    // 5. GUARDAR el objeto actualizado en sessionStorage (centralizando datos)
    sessionStorage.setItem('reserva', JSON.stringify(reservaData));
    console.log("✅ Datos de participantes guardados en sessionStorage.");

    // 6. Redirigir al siguiente paso: Requisitos (Paso 4)
    window.location.href = '/cliente/reserva_requisito'; // RUTA PROPUESTA PARA EL SIGUIENTE PASO
}


// ==============================
// PARTE 4: GENERACIÓN DE INPUTS
// ==============================

function generarInputsParticipantes(listaParticipantes, container) {
    if (!container) return;
    
    container.innerHTML = ''; 
    
    if (listaParticipantes && listaParticipantes.length > 0) {
        
        listaParticipantes.forEach((tipoParticipante, index) => {
            const labelText = tipoParticipante.trim(); 
            const isSacerdoteInput = labelText.toLowerCase().includes('sacerdote');
            
            const formGroup = document.createElement('div');
            // Clase clave para el posicionamiento del autocompletado
            formGroup.className = 'form-group full-width ' + (isSacerdoteInput ? 'autocomplete-container' : ''); 
            
            const idInput = `participante-input-${index}`; 
            const nameInput = `participante_${labelText.toLowerCase().replace(/[\s()]/g, '_')}`; 

            const label = document.createElement('label');
            label.htmlFor = idInput;
            label.textContent = `Nombre completo de: ${labelText}`; 

            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'form-control'; 
            input.id = idInput;
            input.name = nameInput; 
            input.placeholder = `Ingrese el nombre del/la ${labelText}`;
            input.required = true; 

            if (isSacerdoteInput) {
                const suggestionsList = document.createElement('ul');
                suggestionsList.className = 'custom-suggestions-list'; 
                
                input.addEventListener('input', () => {
                    mostrarSugerenciasPersonalizadas(input, suggestionsList);
                });
                
                input.addEventListener('blur', () => {
                    // Pequeño retraso para permitir el clic en una sugerencia antes de ocultar
                    setTimeout(() => {
                        suggestionsList.style.display = 'none';
                    }, 200); 
                });
                
                formGroup.appendChild(label);
                formGroup.appendChild(input);
                formGroup.appendChild(suggestionsList); // La lista va dentro del contenedor relativo
            } else {
                formGroup.appendChild(label);
                formGroup.appendChild(input);
            }

            container.appendChild(formGroup);
        });
    } else {
        container.innerHTML = '<p class="alert alert-info">No se requiere ingresar datos de participantes para este acto.</p>';
    }
}


// ==============================
// PARTE 5: INICIALIZACIÓN (DOMContentLoaded)
// ==============================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Obtener datos de reserva y contenedores
    const datosReservaString = sessionStorage.getItem('reserva');
    const participantesContainer = document.getElementById('participantes-inputs');
    const tituloActoEl = document.getElementById('titulo-acto');
    const btnSiguiente = document.getElementById('btn-siguiente'); 
    const btnAtras = document.getElementById('btn-atras');         
    
    const idParroquia = sessionStorage.getItem('idParroquiaSeleccionada'); 
    
    if (!datosReservaString || !participantesContainer) {
        if (participantesContainer) {
             participantesContainer.innerHTML = '<p class="text-danger">⚠️ Error: No se encontraron datos de reserva o contenedor de formulario.</p>';
        }
        return;
    }

    const reservaData = JSON.parse(datosReservaString);
    const idActo = reservaData.idActo;
    const nombreActo = reservaData.nombreActo;

    // ** LLAMADA A LA API DE SACERDOTES **
    if (idParroquia) {
        cargarSacerdotes(idParroquia); 
    } else {
        console.warn("⚠️ idParroquiaSeleccionada no encontrado. No se cargarán sacerdotes.");
    }

    // 2. Mostrar el nombre del acto seleccionado
    if (tituloActoEl) {
        tituloActoEl.textContent = `Participantes para el acto: ${nombreActo}`; 
    }

    // 3. Llamar a la API para obtener tipos de participantes
    fetch(`/api/acto/participantes/${idActo}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error ${response.status}: No se pudo cargar los participantes.`);
            }
            return response.json();
        })
        .then(data => {
            generarInputsParticipantes(data.participantes, participantesContainer);
        })
        .catch(error => {
            console.error("❌ Error en la llamada a la API:", error);
            if (participantesContainer) {
                 participantesContainer.innerHTML = `<p class="alert alert-danger">❌ Error de conexión: ${error.message}</p>`;
            }
        });
        
    // 🌟 MANEJO DE BOTONES DE NAVEGACIÓN 🌟
    if (btnSiguiente) {
        btnSiguiente.addEventListener('click', guardarParticipantesYContinuar);
    }
    
    if (btnAtras) {
        btnAtras.addEventListener('click', volverPasoAnterior);
    }

    // 🌟 MANEJO DE TECLADO 🌟
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); 
            guardarParticipantesYContinuar();
        }
        
        if (e.key === 'Backspace' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
             e.preventDefault(); 
             volverPasoAnterior();
        }
    });
});