// ============================================================
// ACTOS LITÚRGICOS CLIENTE - Carga dinámica desde BD con paginación
// ============================================================

let actosYaCargados = false;
let todosLosActos = [];
let paginaActual = 1;
const actosPorPagina = 9;

document.addEventListener('DOMContentLoaded', async () => {
    if (!actosYaCargados) {
        actosYaCargados = true;
        await cargarActosLiturgicos();
        configurarEventosRequisitos();
    }
});

// Función para cargar todos los actos litúrgicos desde la API
async function cargarActosLiturgicos() {
    try {
        console.log('📋 Cargando actos litúrgicos...');
        const response = await fetch('/api/acto_liturgico/actos');
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Datos recibidos:', data);

        if (data.success && data.datos && Array.isArray(data.datos)) {
            // Filtrar actos activos
            todosLosActos = data.datos.filter(acto => acto.estadoActo === true);
            console.log(`✅ ${todosLosActos.length} actos activos encontrados`);
            paginaActual = 1;
            mostrarActosLiturgicos();
        } else {
            mostrarMensajeError('No se encontraron actos litúrgicos.');
        }

    } catch (error) {
        console.error('❌ Error al cargar actos litúrgicos:', error);
        mostrarMensajeError('Error al cargar los actos litúrgicos. Por favor, intente más tarde.');
    }
}
// Función para mostrar los actos litúrgicos en tarjetas con paginación
function mostrarActosLiturgicos() {
    const contenedor = document.querySelector('.contenedor-campos');
    
    if (!contenedor) {
        console.error('❌ No se encontró el contenedor de actos');
        return;
    }

    // Limpiar contenedor
    contenedor.innerHTML = '';

    if (todosLosActos.length === 0) {
        contenedor.innerHTML = '<p class="no-actos">No hay actos litúrgicos disponibles en este momento.</p>';
        return;
    }

    // Calcular índices para la paginación
    const inicio = (paginaActual - 1) * actosPorPagina;
    const fin = inicio + actosPorPagina;
    const actosPagina = todosLosActos.slice(inicio, fin);

    // Crear tarjeta para cada acto de la página actual
    actosPagina.forEach(acto => {
        const tarjeta = crearTarjetaActo(acto);
        contenedor.appendChild(tarjeta);
    });

    // Agregar controles de paginación
    crearControlesPaginacion(contenedor.parentElement);

    console.log(`✅ Mostrando ${actosPagina.length} actos (página ${paginaActual})`);
}

// Función para crear controles de paginación
function crearControlesPaginacion(contenedorPadre) {
    // Remover paginación existente
    const paginacionExistente = contenedorPadre.querySelector('.paginacion');
    if (paginacionExistente) {
        paginacionExistente.remove();
    }

    const totalPaginas = Math.ceil(todosLosActos.length / actosPorPagina);
    
    // Solo mostrar paginación si hay más de una página
    if (totalPaginas <= 1) return;

    const paginacion = document.createElement('div');
    paginacion.className = 'paginacion';

    // Botón anterior
    const btnAnterior = document.createElement('button');
    btnAnterior.textContent = '← Anterior';
    btnAnterior.className = 'btn-pagina';
    btnAnterior.disabled = paginaActual === 1;
    btnAnterior.onclick = () => {
        if (paginaActual > 1) {
            paginaActual--;
            mostrarActosLiturgicos();
            contenedorPadre.scrollTop = 0;
        }
    };

    // Información de página
    const infoPagina = document.createElement('span');
    infoPagina.className = 'info-pagina';
    infoPagina.textContent = `Página ${paginaActual} de ${totalPaginas}`;

    // Botón siguiente
    const btnSiguiente = document.createElement('button');
    btnSiguiente.textContent = 'Siguiente →';
    btnSiguiente.className = 'btn-pagina';
    btnSiguiente.disabled = paginaActual === totalPaginas;
    btnSiguiente.onclick = () => {
        if (paginaActual < totalPaginas) {
            paginaActual++;
            mostrarActosLiturgicos();
            contenedorPadre.scrollTop = 0;
        }
    };

    paginacion.appendChild(btnAnterior);
    paginacion.appendChild(infoPagina);
    paginacion.appendChild(btnSiguiente);

    contenedorPadre.appendChild(paginacion);
}

// Función para crear una tarjeta de acto litúrgico
function crearTarjetaActo(acto) {
    const campo = document.createElement('div');
    campo.className = 'campo';
    campo.dataset.idActo = acto.idActo;
    campo.dataset.nombActo = acto.nombActo;

    // Imagen del acto
    const img = document.createElement('img');
    img.src = acto.imgActo || '/static/img/acto.png';
    img.alt = acto.nombActo;
    img.onerror = () => { img.src = '/static/img/acto.png'; };

    // Contenedor de información
    const info = document.createElement('div');
    info.className = 'info';

    // Título
    const titulo = document.createElement('h3');
    titulo.textContent = acto.nombActo;

    // Descripción
    const descripcion = document.createElement('p');
    descripcion.textContent = acto.descripcionActo || 'Participe en este acto litúrgico de nuestra parroquia.';

    // Información adicional
    const infoAdicional = document.createElement('div');
    infoAdicional.className = 'info-adicional';
    infoAdicional.innerHTML = `
        <span class="info-item">👥 ${acto.numParticipantes} ${acto.tipoParticipantes}</span>
    `;

    // Contenedor de botones
    const botones = document.createElement('div');
    botones.className = 'botones';

    // Botón realizar reserva
    const btnReserva = document.createElement('button');
    btnReserva.type = 'button';
    btnReserva.className = 'reserva';
    btnReserva.textContent = 'Realice su reserva';
    btnReserva.onclick = () => realizarReserva(acto.idActo, acto.nombActo);

    // Botón ver requisitos (solo si NO es misa)
    const esMisa = acto.nombActo.toLowerCase().includes('misa');
    
    if (!esMisa) {
        const btnRequisitos = document.createElement('button');
        btnRequisitos.type = 'button';
        btnRequisitos.className = 'requisitos';
        btnRequisitos.textContent = 'Ver requisitos';
        btnRequisitos.onclick = () => mostrarRequisitos(acto.idActo, acto.nombActo);
        botones.appendChild(btnRequisitos);
    }

    botones.insertBefore(btnReserva, botones.firstChild);

    // Ensamblar la tarjeta
    info.appendChild(titulo);
    info.appendChild(descripcion);
    info.appendChild(infoAdicional);
    info.appendChild(botones);

    campo.appendChild(img);
    campo.appendChild(info);

    return campo;
}

// Función para realizar reserva
function realizarReserva(idActo, nombActo) {
    console.log(`🎯 Realizar reserva para: ${nombActo} (ID: ${idActo})`);
    // Guardar en sessionStorage y redirigir
    sessionStorage.setItem('idActoSeleccionado', idActo);
    sessionStorage.setItem('nombActoSeleccionado', nombActo);
    window.location.href = '/cliente/reserva';
}

// Función para mostrar requisitos
async function mostrarRequisitos(idActo, nombActo) {
    try {
        console.log(`📋 Cargando requisitos para: ${nombActo} (ID: ${idActo})`);
        
        const response = await fetch(`/api/requisito/${idActo}`);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        console.log('📄 Requisitos recibidos:', data);

        if (data.success && data.datos && Array.isArray(data.datos)) {
            mostrarModalRequisitos(nombActo, data.datos);
        } else {
            alert(`No se encontraron requisitos para ${nombActo}`);
        }

    } catch (error) {
        console.error('❌ Error al cargar requisitos:', error);
        alert('Error al cargar los requisitos. Por favor, intente más tarde.');
    }
}

// Función para mostrar el modal de requisitos
function mostrarModalRequisitos(nombActo, requisitos) {
    const modal = document.querySelector('.requisitos-container');
    const titulo = modal.querySelector('h2');
    const lista = document.getElementById('lista-requisitos');

    // Actualizar título
    titulo.textContent = `Requisitos para ${nombActo}`;

    // Limpiar lista
    lista.innerHTML = '';

    if (requisitos.length === 0) {
        lista.innerHTML = '<li class="no-requisitos">✅ Este acto no requiere documentos adicionales.</li>';
    } else {
        requisitos.forEach(req => {
            const li = document.createElement('li');
            li.className = 'requisito-item';
            li.innerHTML = `
                <span class="requisito-icono">📄</span>
                <span class="requisito-nombre">${req.nombRequisito}</span>
            `;
            lista.appendChild(li);
        });
    }

    // Mostrar modal
    modal.classList.remove('oculto');
}

// Función para configurar eventos del modal de requisitos
function configurarEventosRequisitos() {
    const modal = document.querySelector('.requisitos-container');
    const btnCerrar = modal.querySelector('.requisitos-header img');

    // Cerrar al hacer clic en la X
    if (btnCerrar) {
        btnCerrar.onclick = (e) => {
            e.stopPropagation();
            modal.classList.add('oculto');
        };
    }

    // Cerrar al hacer clic fuera del modal
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.classList.add('oculto');
        }
    };
}

// Cerrar modal con tecla ESC (solo una vez)
document.addEventListener('keydown', function cerrarModalEsc(e) {
    if (e.key === 'Escape') {
        const modal = document.querySelector('.requisitos-container');
        if (modal && !modal.classList.contains('oculto')) {
            modal.classList.add('oculto');
        }
    }
}, { once: false });

// Función para mostrar mensaje de error
function mostrarMensajeError(mensaje) {
    const contenedor = document.querySelector('.contenedor-campos');
    if (contenedor) {
        contenedor.innerHTML = `<p class="error-mensaje">⚠️ ${mensaje}</p>`;
    }
}
