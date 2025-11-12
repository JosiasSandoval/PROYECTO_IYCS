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
    const participantesContainer = document.getElementById('participantes-inputs');
    const inputs = participantesContainer.querySelectorAll('input[name^="participante_"]');

    let formValido = true;
    const datosParticipantes = {};

    inputs.forEach(input => {
        // 💡 CORRECCIÓN APLICADA: No guardar el 'participante_solicitante' en el objeto participantes
        if (input.name === 'participante_solicitante') {
            // Se valida que el campo no esté vacío si es requerido
            if (input.required && input.value.trim() === '') {
                formValido = false;
                input.classList.add('is-invalid');
            } else {
                input.classList.remove('is-invalid');
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

    if (!formValido) {
        alert("⚠️ Completa todos los campos antes de continuar.");
        return;
    }

    let reservaData = JSON.parse(sessionStorage.getItem('reserva') || '{}');
    reservaData.participantes = datosParticipantes;
    sessionStorage.setItem('reserva', JSON.stringify(reservaData));

    window.location.href = '/cliente/reserva_requisito';
}

// ================================================
// GENERACIÓN DE INPUTS
// ================================================
function generarInputsParticipantes(listaParticipantes, container, reservaData = {}) {
    if (!container) return;
    container.innerHTML = '';

    // 🔹 Solicitante solo para secretaria
    if (document.body.dataset.rol === 'secretaria') {
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
                const resp = await fetch(`/api/usuario/buscar_solicitante/${encodeURIComponent(valor)}`);
                if (resp.ok) {
                    const data = await resp.json();
                    if (data.usuario) {
                        reservaData.solicitante = data.usuario;
                        input.value = data.usuario.nombreCompleto;
                    } else {
                        alert("Usuario no registrado");
                        input.value = '';
                    }
                } else {
                    alert("Usuario no registrado");
                    input.value = '';
                }
            } catch {
                alert("Error al consultar el usuario");
                input.value = '';
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
            }

            formGroup.appendChild(label);
            formGroup.appendChild(input);
            container.appendChild(formGroup);
        });
    } else if (document.body.dataset.rol !== 'secretaria') {
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